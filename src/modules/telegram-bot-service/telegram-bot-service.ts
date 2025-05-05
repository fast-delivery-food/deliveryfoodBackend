
import { Injectable } from '@nestjs/common';
import { Ctx, Start, On, Action, Update, InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { CallbackQuery, Message } from 'telegraf/typings/core/types/typegram';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { CartService } from '../cart/cart.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { PromocodeService } from '../promocode/promocode.service';
import { AddressService } from '../address/address.service';
import { OrderService } from '../orders/orders.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { Order } from '../orders/entities/order.entity';
import { InfoService } from '../info/info.service';

const userLanguageMap: Record<number, 'uz' | 'ru' | 'en'> = {};
const userPageMap: Record<number, number> = {};
const userCategoryMap: Record<number, number> = {};

const menus = {
  uz: [
    ['🍽 Menu', 'menu'],
    // ['🔍 Qidiruv', 'search'],
    ['🛒 Savat', 'view_cart'],
    ['📦 Buyurtmalar', 'order_history'],
    ['📞 Bogʻlanish', 'contact'],
    ['👤 Profil', 'profile'],
  ],
  ru: [
    ['🍽 Меню', 'menu'],
    // ['🔍 Поиск', 'search'],
    ['🛒 Корзина', 'view_cart'],
    ['📦 История заказов', 'order_history'],
    ['📞 Контакты', 'contact'],
    ['👤 Профиль', 'profile'],
  ],
  en: [
    ['🍽 Menu', 'menu'],
    // ['🔍 Search', 'search'],
    ['🛒 Cart', 'view_cart'],
    ['📦 Orders', 'order_history'],
    ['📞 Contact', 'contact'],
    ['👤 Profile', 'profile'],
  ],
};
const userStates = new Map<string, string>(); // Map foydalanuvchilar uchun holat saqlash uchun

@Update()
@Injectable()
export class TelegramBotService {

  private sessionData: Record<string, Record<any, any>> = {};
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly promocodeService: PromocodeService,
    private readonly addressService: AddressService,
    private readonly orderService: OrderService,
    private readonly infoService: InfoService,
    @InjectBot() private readonly bot: Telegraf
  ) { }


  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply('📞 Telefon raqamingizni yuboring:', Markup.keyboard([[Markup.button.contactRequest('📱 Raqamni yuborish')]]).resize());
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    await ctx.reply("🌐 Tilni tanlang:", Markup.inlineKeyboard([
      [Markup.button.callback("🇺🇿 O'zbek", 'lang_uz')],
      [Markup.button.callback("🇷🇺 Русский", 'lang_ru')],
      [Markup.button.callback("🇬🇧 English", 'lang_en')],
    ]));
  }

  @Action(/lang_(uz|ru|en)/)
  async onLanguageChoose(@Ctx() ctx: Context) {
    const data = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
    const match = data?.match(/^lang_(uz|ru|en)$/);
    if (!match) return;

    const lang = match[1] as 'uz' | 'ru' | 'en';
    const userId = ctx.from.id;

    userLanguageMap[userId] = lang;
    await ctx.answerCbQuery();
    await this.sendMainMenu(ctx);
  }

  private async sendMainMenu(ctx: Context) {
    const userId = ctx.from.id;
    const lang = userLanguageMap[userId] || 'uz';

    const localizedMenu = menus[lang].map(([text, callbackData]) =>
      Markup.button.callback(text, callbackData),
    );

    await ctx.reply(
      lang === 'uz' ? '🏠 Asosiy menyu:' :
        lang === 'ru' ? '🏠 Главное меню:' :
          '🏠 Main Menu:',
      Markup.inlineKeyboard(localizedMenu, { columns: 1 }),
    );
    // const localizedMenu = menus[lang].map(([text]) => [text]); // Har bir qator uchun tugma

    // await ctx.reply(
    //   lang === 'uz' ? '🏠 Asosiy menyu:' :
    //     lang === 'ru' ? '🏠 Главное меню:' :
    //       '🏠 Main Menu:',
    //   Markup.keyboard(localizedMenu)
    //     .resize()      
    //     .oneTime(false)
    // );
  }
  @Action(/cat_\d+/)
  async onCategory(@Ctx() ctx: Context) {
    const telegramId = String(ctx.from.id);
    const user = await this.userService.findByUserId(telegramId);

    if (!user) {
      await ctx.reply("Iltimos, avval roʻyxatdan oʻting.");
      await ctx.reply('Roʻyxatdan oʻtish:', Markup.inlineKeyboard([
        [Markup.button.callback('👤 Profil', 'profile')],
      ]));
      return;
    }

    const lang = userLanguageMap[telegramId] || 'uz';
    const categoryId = parseInt((ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')[1]);

    const products = await this.productService.findByCategoryId(categoryId);
    if (!products.length) {
      await ctx.reply(
        lang === 'uz' ? "Bu kategoriyada mahsulot yo‘q." :
          lang === 'ru' ? "Нет товаров в этой категории." :
            "No products in this category."
      );
      return;
    }

    for (const product of products) {
      await this.showProductById(product.id, ctx, lang);
    }

    await ctx.answerCbQuery();
  }



  private async showProductById(productId: number, ctx: Context, lang: string) {
    const product = await this.productService.findOne(productId);
    if (!product) {
      return ctx.answerCbQuery(
        lang === 'uz' ? 'Mahsulot topilmadi.' :
          lang === 'ru' ? 'Продукт не найден.' :
            'Product not found.',
        { show_alert: true }
      );
    }

    let caption = '';
    let addToCart = '';
    let buyNow = '';

    if (lang === 'uz') {
      caption = `${product.name} - ${product.price} so'm\n\n${product.description}`;
      addToCart = '🛒 Savatga qoʻshish';
      buyNow = '💳 Hozir sotib olish';
    } else if (lang === 'ru') {
      caption = `${product.name} - ${product.price} сум\n\n${product.description}`;
      addToCart = '🛒 В корзину';
      buyNow = '💳 Купить сейчас';
    } else {
      caption = `${product.name} - ${product.price} UZS\n\n${product.description}`;
      addToCart = '🛒 Add to cart';
      buyNow = '💳 Buy now';
    }

    if (!existsSync(join(process.cwd(), product.image))) {
      return ctx.reply(
        lang === 'uz' ? 'Rasm mavjud emas.' :
          lang === 'ru' ? 'Изображение недоступно.' :
            'Image not found.'
      )
    }

    await ctx.replyWithPhoto(
      { source: createReadStream(join(process.cwd(), product.image)) },
      {
        caption: caption,
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(addToCart, `add_${product.id}`)],
          [Markup.button.callback(buyNow, `buy_${product.id}`)],
        ]).reply_markup,
      }
    );
  }
//view

  @Action(/add_(\d+)/)
  async onInitialAdd(@Ctx() ctx: Context) {
    const { match } = ctx as Context & { match: RegExpMatchArray };
    const productId = parseInt(match[1]);
    const userId = ctx.from.id;
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const product = await this.productService.findOne(productId);

    if (!product) {
      const notFoundMessages = {
        uz: '❌ Mahsulot topilmadi!',
        ru: '❌ Продукт не найден!',
        en: '❌ Product not found!',
      };
      await ctx.reply(notFoundMessages[lang]);
      return;
    }

    let quantity = 1;
    const userSession = userId.toString();
    if (!this.sessionData[userSession]) {
      this.sessionData[userSession] = {};
    }

    if (!this.sessionData[userSession][productId]) {
      this.sessionData[userSession][productId] = quantity;
    }

    quantity = this.sessionData[userSession][productId];

    let messages = ''
    if (lang === 'uz') {
      messages = `🛒 ${product.name} - ${product.price} so‘m\nMiqdori: ${quantity} dona`

    }
    else if (lang === 'ru') {
      messages = `🛒 ${product.name} - ${product.price} сум\nКоличество: ${quantity} шт`
    }
    else if (lang === 'en') {
      messages = `🛒 ${product.name} - ${product.price} UZS\nQuantity: ${quantity} pcs`

    }

    const addToCartText = {
      uz: '✅ Savatga qo‘shish',
      ru: '✅ В корзину',
      en: '✅ Add to cart',
    };

    await ctx.reply(messages, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '➖', callback_data: `quantity_sub_${productId}_${quantity}` },
            { text: `${quantity}`, callback_data: 'none' },
            { text: '➕', callback_data: `quantity_add_${productId}_${quantity}` },
          ],
          [
            { text: addToCartText[lang], callback_data: `add_to_cart_${productId}_${quantity}` },
          ],
        ],
      },
    });

    await ctx.answerCbQuery();
  }

  @Action(/quantity_(add|sub)_(\d+)/)
  async onQuantityUpdate(@Ctx() ctx: Context) {
    const { match } = ctx as Context & { match: RegExpMatchArray };
    const action = match[1];
    const productId = parseInt(match[2]);
    const userId = ctx.from.id;
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';
    const userSession = userId.toString();

    if (!this.sessionData[userSession]) {
      this.sessionData[userSession] = {};
    }

    if (!this.sessionData[userSession][productId]) {
      this.sessionData[userSession][productId] = 1;
    }

    if (action === 'add') {
      this.sessionData[userSession][productId]++;
    } else if (action === 'sub' && this.sessionData[userSession][productId] > 1) {
      this.sessionData[userSession][productId]--;
    }

    const updatedQuantity = this.sessionData[userSession][productId];

    let quantityText = ''
    let addToCartText = ''
    if (lang == 'uz') {
      addToCartText = '✅ Savatga qo‘shish'
      quantityText = `🛒 ${productId} - Miqdori: ${updatedQuantity} dona`
    }
    else if (lang === 'ru') {
      addToCartText = '✅ В корзину'
      quantityText = `🛒 ${productId} - Количество: ${updatedQuantity} шт`
    }
    else if (lang === 'en') {
      addToCartText = '✅ Add to cart'
      quantityText = `🛒 ${productId} - Quantity: ${updatedQuantity} pcs`

    }

    await ctx.editMessageText(quantityText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '➖', callback_data: `quantity_sub_${productId}` },
            { text: `${updatedQuantity}`, callback_data: 'none' },
            { text: '➕', callback_data: `quantity_add_${productId}` },
          ],
          [
            { text: addToCartText, callback_data: `add_to_cart_${productId}` },
          ],
        ],
      },
    });

    await ctx.answerCbQuery();
  }


  @Action(/add_to_cart_(\d+)_(\d+)/)
  async onAddToCart(@Ctx() ctx: Context) {
    const { match } = ctx as Context & { match: RegExpMatchArray };
    const productId = parseInt(match[1]);
    const userId = String(ctx.from.id);
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const quantity = this.sessionData[userId]?.[productId] || 1;

    try {
      const user = await this.userService.findByUserId(userId);
      if (!user) {
        const notRegisteredMessage =
          lang === 'uz' ? '👤 Siz hali ro‘yxatdan o‘tmagansiz. Iltimos, ro‘yxatdan o‘ting.' :
            lang === 'ru' ? '👤 Вы ещё не зарегистрированы. Пожалуйста, зарегистрируйтесь.' :
              '👤 You are not registered yet. Please sign up.';

        await ctx.reply(notRegisteredMessage);
        return;
      }

      await this.cartService.getOrCreateCart(userId);
      await this.cartService.addToCart(userId, productId, quantity);

      const updatedCart = await this.cartService.getOrCreateCart(userId);

      const addedMessage =
        lang === 'uz' ? `✅ ${quantity} dona ${productId} savatga qo‘shildi!` :
          lang === 'ru' ? `✅ ${quantity} шт. ${productId} добавлено в корзину!` :
            `✅ ${quantity} x ${productId} added to cart!`;

      await ctx.editMessageText(addedMessage);

      if (!this.sessionData[userId]) {
        this.sessionData[userId] = {};
      }

      let sessionCart = this.sessionData[userId]['cartItems'] || [];
      const index = sessionCart.findIndex(item => item.productId === productId);

      if (index > -1) {
        sessionCart[index].quantity += quantity;
      } else {
        sessionCart.push({ productId, quantity });
      }

      this.sessionData[userId]['cartItems'] = sessionCart;

      const totalAmount = updatedCart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const totalItems = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);

      // Multi-lang cart text
      let cartText = '';
      if (lang === 'uz') {
        cartText = '🛒 Savat:\n';
        updatedCart.items.forEach(item => {
          cartText += `${item.product.name} - ${item.quantity} dona\n`;
        });
        cartText += `Jami miqdor: ${totalItems} mahsulot\nJami narx: ${totalAmount} so‘m`;
      } else if (lang === 'ru') {
        cartText = '🛒 Корзина:\n';
        updatedCart.items.forEach(item => {
          cartText += `${item.product.name} - ${item.quantity} шт\n`;
        });
        cartText += `Всего товаров: ${totalItems}\nОбщая сумма: ${totalAmount} сум`;
      } else {
        cartText = '🛒 Cart:\n';
        updatedCart.items.forEach(item => {
          cartText += `${item.product.name} - ${item.quantity} pcs\n`;
        });
        cartText += `Total items: ${totalItems}\nTotal price: ${totalAmount} UZS`;
      }

      // Tugmalar (buttons)
      const enterPromo = lang === 'uz' ? 'Promokod kiritish' : lang === 'ru' ? 'Ввести промокод' : 'Enter promo code';
      const orderNow = lang === 'uz' ? 'Buyurtma berish' : lang === 'ru' ? 'Оформить заказ' : 'Place order';
      const cancel = lang === 'uz' ? 'Bekor qilish' : lang === 'ru' ? 'Отмена' : 'Cancel';

      await ctx.reply(cartText, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: enterPromo, callback_data: 'enter_promo_code' },
              { text: orderNow, callback_data: 'order_now' },
            ],
            [
              { text: cancel, callback_data: 'clear_cart' },
            ],
          ],
        },
      });

      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error adding to cart:', error);

      const errorMsg =
        lang === 'uz' ? '❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.' :
          lang === 'ru' ? '❌ Произошла ошибка. Пожалуйста, попробуйте позже.' :
            '❌ An error occurred. Please try again later.';

      await ctx.reply(errorMsg);
    }
  }

  @Action('clear_cart')
  async onClearCart(@Ctx() ctx: Context) {
    const userId = String(ctx.from.id);
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    try {
      await this.cartService.clearCart(userId);

      const clearedMessage =
        lang === 'uz' ? '✅ Savatingiz tozalandi! Endi savatingiz bo‘sh.' :
          lang === 'ru' ? '✅ Ваша корзина очищена! Теперь она пуста.' :
            '✅ Your cart has been cleared! It is now empty.';

      await ctx.reply(clearedMessage);
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error clearing cart:', error);

      const errorMessage =
        lang === 'uz' ? '❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.' :
          lang === 'ru' ? '❌ Произошла ошибка. Пожалуйста, попробуйте позже.' :
            '❌ An error occurred. Please try again later.';

      await ctx.reply(errorMessage);
    }
  }
  
  @Action('contact')
  async onContacts(@Ctx() ctx: Context) {
    try {
      const infos = await this.infoService.findAll();

      if (!infos.length) {
        return ctx.reply('Bogʻlanish maʼlumotlari topilmadi.');
      }

      // Faqat birinchi contactni ko‘rsatamiz (agar bitta bo‘lsa)
      const info = infos[0];

      const message = `📞 *Bogʻlanish maʼlumotlari:*\n\n` +
        `🏢 *Nomi:* ${info.name}\n` +
        `📍 *Manzil:* ${info.address}\n` +
        `📱 *Telefon:* ${info.phone}\n` +
        (info.description ? `📝 *Qoʻshimcha:* ${info.description}` : '');

      await ctx.replyWithMarkdown(message);
    } catch (error) {
      console.error(error);
      await ctx.reply('❌ Xatolik yuz berdi. Keyinroq urinib ko‘ring.');
    }
  }

  @Action('enter_promo_code')
  async onPromoCode(@Ctx() ctx: Context) {
    const userId = String(ctx.from.id);
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const messages = {
      prompt: {
        uz: 'Iltimos, promokodni kiriting:',
        ru: 'Пожалуйста, введите промокод:',
        en: 'Please enter the promo code:'
      },
      invalidFormat: {
        uz: 'Iltimos, promokodni to‘g‘ri formatda kiriting (faqat katta harflar va raqamlar).',
        ru: 'Пожалуйста, введите промокод в правильном формате (только заглавные буквы и цифры).',
        en: 'Please enter the promo code in the correct format (uppercase letters and digits only).'
      },
      notRegistered: {
        uz: 'Siz ro‘yxatdan o‘tmagansiz. Iltimos, ro‘yxatdan o‘ting!',
        ru: 'Вы не зарегистрированы. Пожалуйста, зарегистрируйтесь!',
        en: 'You are not registered. Please register!'
      },
      success: (amount: number) => ({
        uz: `✅ Promokod muvaffaqiyatli qo‘shildi! Yangi jami narx: ${amount} so‘m`,
        ru: `✅ Промокод успешно применён! Новая общая сумма: ${amount} сум`,
        en: `✅ Promo code successfully applied! New total amount: ${amount} UZS`
      }),
      error: (msg: string) => ({
        uz: `❌ Xatolik: ${msg}`,
        ru: `❌ Ошибка: ${msg}`,
        en: `❌ Error: ${msg}`
      })
    };

    if (userStates.get(userId) !== 'onPromoCode') {
      userStates.set(userId, 'onPromoCode');
      await ctx.reply(messages.prompt[lang]);
      return;
    }

    if (!ctx.message || !(ctx.message as Message.TextMessage).text) {
      await ctx.reply(messages.prompt[lang]);
      return;
    }

    const promoCode = (ctx.message as Message.TextMessage).text.trim();
    const promoCodeRegex = /^[A-Z0-9]+$/;

    try {
      const user = await this.userService.findByUserId(userId);

      if (!user) {
        await ctx.reply(messages.notRegistered[lang]);
        return;
      }

      if (!promoCode.match(promoCodeRegex)) {
        await ctx.reply(messages.invalidFormat[lang]);
        return;
      }

      const promo = await this.promocodeService.validateCode(promoCode);
      const cart = await this.cartService.getOrCreateCart(userId);
      cart.promocode = promo;
      await this.cartService.save(cart);

      const totalAmount = cart.getTotalPrice();

      await ctx.reply(
        messages.success(totalAmount)[lang],
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: lang === 'uz' ? 'Buyurtma berish' : lang === 'ru' ? 'Оформить заказ' : 'Place Order', callback_data: 'order_now' }],
              [{ text: lang === 'uz' ? 'Savatni ko‘rish' : lang === 'ru' ? 'Посмотреть корзину' : 'View Cart', callback_data: 'view_cart' }],
            ],
          },
        },
      );

      userStates.set(userId, '');
    } catch (error) {
      await ctx.reply(
        messages.error(error.message)[lang],
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: lang === 'uz' ? 'Savatni ko‘rish' : lang === 'ru' ? 'Посмотреть корзину' : 'View Cart', callback_data: 'view_cart' }],
            ],
          },
        },
      );
    }
  }

  @Action('view_cart')
  async onViewCart(@Ctx() ctx: Context) {
    const userId = String(ctx.from.id);
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const messages = {
      empty: {
        uz: '🛒 Sizning savatingiz hozircha bo‘sh.',
        ru: '🛒 Ваша корзина пуста.',
        en: '🛒 Your cart is currently empty.'
      },
      title: {
        uz: '🛍 Sizning savatingiz:\n\n',
        ru: '🛍 Ваша корзина:\n\n',
        en: '🛍 Your cart:\n\n'
      },
      item: (name: string, qty: number) => ({
        uz: `🍽 ${name} — ${qty} dona\n`,
        ru: `🍽 ${name} — ${qty} шт.\n`,
        en: `🍽 ${name} — ${qty} pcs\n`
      }),
      orderNow: {
        uz: 'Buyurtma berish',
        ru: 'Оформить заказ',
        en: 'Place Order'
      },
      clear: {
        uz: 'Bekor qilish',
        ru: 'Очистить корзину',
        en: 'Clear Cart'
      }
    };

    const cart = await this.cartService.getOrCreateCart(userId);
//to‘g‘ri maʼlumot yuboring.
    if (!cart.items || cart.items.length === 0) {
      await ctx.reply(messages.empty[lang]);
      return;
    }

    let message = messages.title[lang];
    for (const item of cart.items) {
      message += messages.item(item.product?.name, item.quantity)[lang];
    }

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: messages.orderNow[lang], callback_data: 'order_now' }],
          [{ text: messages.clear[lang], callback_data: 'clear_cart' }],
        ],
      },
    });
  }


  @Action('order_now')
  async onOrderNow(@Ctx() ctx: Context) {
    const userId = String(ctx.from.id);
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const messages = {
      prompt: {
        uz: '📍 Iltimos, manzilingizni yuboring.',
        ru: '📍 Пожалуйста, отправьте ваше местоположение.',
        en: '📍 Please send your location.'
      },
      button: {
        uz: '📍 Manzil yuborish',
        ru: '📍 Отправить местоположение',
        en: '📍 Send location'
      }
    };

    userStates.set(userId, 'awaiting_location');

    await ctx.reply(messages.prompt[lang], {
      reply_markup: {
        keyboard: [[{ text: messages.button[lang], request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  @On('location')
  async handleLocation(@Ctx() ctx: Context & { session: any }) {
    const location = ctx.message['location'];
    const { latitude, longitude } = location;

    const address = await this.addressService.createAddress(latitude, longitude);
    const userId = String(ctx.from.id);

    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const messages = {
      saved: {
        uz: '✅ Manzilingiz saqlandi!',
        ru: '✅ Ваш адрес сохранён!',
        en: '✅ Your address has been saved!',
      },
      notFound: {
        uz: 'Manzil topilmadi',
        ru: 'Адрес не найден',
        en: 'Address not found',
      },
      sendPhone: {
        uz: '📱 Iltimos, telefon raqamingizni yuboring (+998954446633 shaklida).',
        ru: '📱 Пожалуйста, отправьте свой номер телефона (в формате +998954446633).',
        en: '📱 Please send your phone number (in format +998954446633).',
      },
      button: {
        uz: '📱 Telefon raqamini yuborish',
        ru: '📱 Отправить номер телефона',
        en: '📱 Send phone number',
      },
    };

    if (!this.sessionData[userId]) {
      this.sessionData[userId] = {};
    }
    this.sessionData[userId]['address'] = address;

    await ctx.reply(
      `${messages.saved[lang]}\n\n📍 ${address.description || messages.notFound[lang]}`,
    );

    userStates.set(userId, 'awaiting_phone');

    await ctx.reply(messages.sendPhone[lang], {
      reply_markup: {
        keyboard: [
          [{ text: messages.button[lang], request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  @On('text')
  async handleContact(@Ctx() ctx: Context) {
    const userId = String(ctx.from.id);
    const text = ctx.message['text'];
    const state = userStates.get(userId);

    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const messages = {
      invalidPhone: {
        uz: '❗ Telefon raqamingizni to\'g\'ri kiriting (+998954446633 shaklida).',
        ru: '❗ Пожалуйста, введите правильный номер телефона (+998954446633).',
        en: '❗ Please enter a valid phone number (+998954446633).',
      },
      missingAddress: {
        uz: '❗ Manzil yoki mahsulotlar yo‘q. Iltimos, avval buyurtmani to‘ldiring.',
        ru: '❗ Адрес или товары отсутствуют. Пожалуйста, сначала добавьте товары в корзину.',
        en: '❗ No address or items. Please fill your order first.',
      },
      orderAccepted: {
        uz: '✅ Buyurtmangiz qabul qilindi!',
        ru: '✅ Ваш заказ принят!',
        en: '✅ Your order has been accepted!',
      },
      invalidData: {
        uz: '❗ Iltimos, to‘g‘ri maʼlumot yuboring.',
        ru: '❗ Пожалуйста, отправьте правильные данные.',
        en: '❗ Please send valid information',
      },
      orderHistory: {
        uz: 'Buyurtmalar tarixi',
        ru: 'История заказов',
        en: 'Order history',
      },
      viewOrders: {
        uz: 'Buyurtmalarni ko‘rish',
        ru: 'Посмотреть заказы',
        en: 'View orders',
      },
    };

    if (state === 'onPromoCode') {
      return this.onPromoCode(ctx);
    }

    if (state === 'awaiting_firstname' || state === 'awaiting_lastname' || state === 'awaiting_username' || state === 'awaiting_phone_number' || state === 'awaiting_birthday') {
      return this.onTexts(ctx);
    }
    if(state === 'awaiting_phone_update'){
      return this.updatePhoneNumber(ctx,text)
    }

    if (state === 'awaiting_phone') {
      const phoneRegex = /^\+998\d{9}$/;
      if (!phoneRegex.test(text)) {
        await ctx.reply(messages.invalidPhone[lang]);
        return;
      }
      

      await this.userService.updatePhoneNumber(userId, { phone_number: text });
      const user = await this.userService.findByUserId(userId);
      const address = this.sessionData[userId]?.['address'];
      const items = this.sessionData[userId]?.['cartItems'];

      if (!address || !items) {
        await ctx.reply(messages.missingAddress[lang]);
        return;
      }

      const order = await this.orderService.createOrder(user, text, address, items);
      await ctx.reply(messages.orderAccepted[lang]);

      this.sessionData[userId] = null;
      userStates.set(userId, '');

      await ctx.reply(
        messages.orderHistory[lang],
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: messages.viewOrders[lang], callback_data: 'order_history' }],
            ],
          },
        },
      );
      return;
    }

    await ctx.reply(messages.invalidData[lang]);
  }
  @Action('order_history')
  async onOrderHistory(@Ctx() ctx: Context) {
    const userId = String(ctx.from.id);
    await this.sendOrderHistory(ctx, userId);
  }
  async sendOrderHistory(ctx: Context, userId: string) {
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';
  //  Buyurtmalar
    const messages = {
      noOrders: {
        uz: 'Sizda buyurtmalar mavjud emas.',
        ru: 'У вас нет заказов.',
        en: 'You have no orders.',
      },
      noOrdersThisMonth: {
        uz: 'Bu oyda hech qanday buyurtma bermagansiz.',
        ru: 'В этом месяце у вас нет заказов.',
        en: 'You have no orders this month.',
      },
      orderHistory: {
        uz: '🛒 Sizning bu oydagi buyurtmalar tarixi:\n\n',
        ru: '🛒 История заказов за этот месяц:\n\n',
        en: '🛒 Your order history this month:\n\n',
      },
      orderId: {
        uz: '🆔 Buyurtma raqami: ',
        ru: '🆔 Номер заказа: ',
        en: '🆔 Order ID: ',
      },
      orderDate: {
        uz: '📅 Sana: ',
        ru: '📅 Дата: ',
        en: '📅 Date: ',
      },
      orderItems: {
        uz: '🍔 Mahsulotlar: ',
        ru: '🍔 Продукты: ',
        en: '🍔 Items: ',
      },
      orderTotal: {
        uz: '💵 Umumiy narx: ',
        ru: '💵 Общая сумма: ',
        en: '💵 Total price: ',
      },
      orderStatus: {
        accepted: {
          uz: '✅ Qabul qilindi',
          ru: '✅ Принят',
          en: '✅ Accepted',
        },
        in_progress: {
          uz: '⏳ Tayyorlanmoqda',
          ru: '⏳ В процессе',
          en: '⏳ In progress',
        },
        on_the_way: {
          uz: '🚚 Yo\'lda',
          ru: '🚚 В пути',
          en: '🚚 On the way',
        },
        canceled: {
          uz: '❌ Bekor qilindi',
          ru: '❌ Отменено',
          en: '❌ Canceled',
        },
        delivered: {
          uz: '✅ Yetkazib berildi',
          ru: '✅ Доставлено',
          en: '✅ Delivered',
        },
      },
    };
  
    const formatDate = (date: Date): string => {
      return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };
  
    let orders = await this.orderService.getUserOrders(userId);
  
    if (orders.length === 0) {
      await ctx.reply(messages.noOrders[lang]);
      return;
    }
  
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
  
    orders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
  
    if (orders.length === 0) {
      await ctx.reply(messages.noOrdersThisMonth[lang]);
      return;
    }
  
    const lastTenOrders = orders.slice(-10);
    let message = messages.orderHistory[lang];
  
    for (const order of lastTenOrders) {
      const orderDate = new Date(order.createdAt);
      const formattedDate = formatDate(orderDate);
      const itemsList = order.items.map(item => item.product?.name || '❓ Nomaʼlum mahsulot').join(', ');
  
      let statusText = '';
      switch (order.status) {
        case 'accepted':
          statusText = messages.orderStatus.accepted[lang];
          break;
        case 'in_progress':
          statusText = messages.orderStatus.in_progress[lang];
          break;
        case 'on_the_way':
          statusText = messages.orderStatus.on_the_way[lang];
          break;
        case 'canceled':
          statusText = messages.orderStatus.canceled[lang];
          break;
        case 'delivered':
          statusText = messages.orderStatus.delivered[lang];
          break;
        default:
          statusText = '❓Nomaʼlum holat';
      }
  
      // ✅ order.id o‘rniga order.order_number ishlatyapmiz:
      message += `${messages.orderId[lang]}${order.order_number}\n`;
      message += `${messages.orderDate[lang]}${formattedDate}\n`;
      message += `${messages.orderItems[lang]}${itemsList}\n`;
      message += `${messages.orderTotal[lang]}${order.totalPrice} so'm\n`;
      message += `${statusText}\n\n`;
    }
  
    await ctx.reply(message);
  }
  
  
  
  @OnEvent('order.status.updated')
  async handleOrderStatusUpdated(order: Order) {
    if (!order.user || !order.user.telegramId) {
      console.error('Buyurtma yoki foydalanuvchi haqida ma\'lumotlar to\'liq emas');
      return;
    }
    const userTelegramId = order.user.telegramId;

    const fakeCtx: any = {
      reply: (msg: string) => this.bot.telegram.sendMessage(userTelegramId, msg),
    };

    await this.sendOrderHistory(fakeCtx, userTelegramId);
  }


  @Action('menu')
  async onMenu(@Ctx() ctx: Context) {
    const lang = userLanguageMap[ctx.from.id] || 'uz';
    const categories = await this.categoryService.findAll();

    const buttons = categories.map(category =>
      [Markup.button.callback(category.name, `cat_${category.id}`)]
    );

    await ctx.editMessageText(
      lang === 'uz' ? '📋 Kategoriyalar:' :
        lang === 'ru' ? '📋 Категории:' :
          '📋 Categories:',
      Markup.inlineKeyboard(buttons)
    );
  }
  @Action('profile')
  async onProfile(@Ctx() ctx: Context) {
    const telegramId = String(ctx.from.id);
    const user = await this.userService.findByUserId(telegramId);

    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[telegramId] || 'uz';

    const messages = {
      notRegistered: {
        uz: 'Siz hali roʻyxatdan oʻtmagansiz. Iltimos, avval roʻyxatdan oʻting.',
        ru: 'Вы ещё не зарегистрированы. Пожалуйста, зарегистрируйтесь.',
        en: 'You are not registered yet. Please register first.',
      },
      profile: {
        uz: '👤 Profilingiz:\n',
        ru: '👤 Ваш профиль:\n',
        en: '👤 Your Profile:\n',
      },
      firstName: {
        uz: 'Ismi: ',
        ru: 'Имя: ',
        en: 'First Name: ',
      },
      lastName: {
        uz: 'Familiyasi: ',
        ru: 'Фамилия: ',
        en: 'Last Name: ',
      },
      username: {
        uz: 'Username: @',
        ru: 'Username: @',
        en: 'Username: @',
      },
      phone: {
        uz: 'Telefon raqami: ',
        ru: 'Телефон: ',
        en: 'Phone Number: ',
      },
      birthday: {
        uz: 'Tug‘ilgan kuni: ',
        ru: 'Дата рождения: ',
        en: 'Birthday: ',
      },
      notSet: {
        uz: '❌ kiritilmagan',
        ru: '❌ не указано',
        en: '❌ not provided',
      },
      enterBirthDate: {
        uz: '📅 Tug‘ilgan kunni kiritish',
        ru: '📅 Введите дату рождения',
        en: '📅 Enter birthdate',
      },
      settingsMenu: {
        uz: 'Sozlamalar menyusi:',
        ru: 'Меню настроек:',
        en: 'Settings menu:',
      },
      updatePhoneNumber: {
        uz: '📞 Telefon raqamini yangilash',
        ru: '📞 Обновить телефон',
        en: '📞 Update phone number',
      },
      backToMainMenu: {
        uz: '🔙 Orqaga qaytish',
        ru: '🔙 Вернуться в главное меню',
        en: '🔙 Back to main menu',
      },
      promoCode: {
        uz: 'Promo kodni kiriting:',
        ru: 'Введите промокод:',
        en: 'Enter promo code:',
      },
    };

    if (!user) {
      await ctx.reply(messages.notRegistered[lang], Markup.inlineKeyboard([
        [Markup.button.callback('Ro\'yxatdan o\'tish', 'register_user')]
      ]));
      return;
    }

    let profileText = messages.profile[lang];
    profileText += `${messages.firstName[lang]}${user.firstname}\n`;
    profileText += `${messages.lastName[lang]}${user.lastname}\n`;
    profileText += `${messages.username[lang]}${ctx.from.username || 'yo‘q'}\n`;
    profileText += `${messages.phone[lang]}${user.phone_number}\n`;

    if (user.birthday) {
      profileText += `${messages.birthday[lang]}${user.birthday}\n`;
      await ctx.reply(profileText);
    } else {
      profileText += `${messages.birthday[lang]}${messages.notSet[lang]}\n`;
      await ctx.reply(profileText, Markup.inlineKeyboard([
        [Markup.button.callback(messages.enterBirthDate[lang], 'enter_birthdate')]
      ]));
    }

    await ctx.reply(messages.settingsMenu[lang], Markup.inlineKeyboard([
      [Markup.button.callback(messages.updatePhoneNumber[lang], 'update_phone_number')],
      [Markup.button.callback(messages.backToMainMenu[lang], 'back_to_main_menu')]
    ]));
  }

  @On('callback_query')
  async onCallbackQuery(ctx: any) {
    const callbackData = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[String(ctx.from.id)] || 'uz';

    const messages = {
      registerUser: {
        uz: 'Iltimos, ismingizni kiriting:',
        ru: 'Пожалуйста, введите ваше имя:',
        en: 'Please enter your first name:',
      },
      settings: {
        uz: 'Sozlamalar:',
        ru: 'Настройки:',
        en: 'Settings:',
      },
      updatePhoneNumber: {
        uz: 'Iltimos, yangi telefon raqamingizni kiriting (masalan, +998901234567):',
        ru: 'Пожалуйста, введите ваш новый номер телефона (например, +998901234567):',
        en: 'Please enter your new phone number (e.g., +998901234567):',
      },
      backToMainMenu: {
        uz: 'Asosiy menyu:',
        ru: 'Главное меню:',
        en: 'Main menu:',
      },
      promoCode: {
        uz: 'Promo kodni kiriting:',
        ru: 'Введите промокод:',
        en: 'Enter promo code:',
      },
    };

    if (callbackData === 'register_user') {
      await ctx.reply(messages.registerUser[lang]);
      ctx.session.user = {};
      const userId = String(ctx.from.id);
      userStates.get(userId);
      userStates.set(userId, 'awaiting_firstname');
    }
    // ❗ Please send valid information

    // updatePhoneNumber
    if (callbackData === 'settings' || callbackData === 'update_phone_number') {
      await this.onUpdatePhoneNumber(ctx)
    }
    //   await ctx.reply(messages.settings[lang], Markup.inlineKeyboard([
    //     [Markup.button.callback(messages.updatePhoneNumber[lang], 'update_phone_number')],
    //     [Markup.button.callback(messages.backToMainMenu[lang], 'back_to_main_menu')]
    //   ]));
    // }
    // else if (callbackData === 'update_phone_number') {
    //   const userId = String(ctx.from.id);
    //   userStates.get(userId);
    //   userStates.set(userId, 'update_phone_number');
    //   ctx.session.isUpdatingPhone = true;
    //   await ctx.reply(messages.updatePhoneNumber[lang]);
    // }
    // ❗ Please send valid information
    else if (callbackData === 'back_to_main_menu') {
      await ctx.reply(messages.backToMainMenu[lang], Markup.inlineKeyboard([
        [Markup.button.callback('👤 Profil', 'profile')],
        [Markup.button.callback('⚙️ Sozlamalar', 'settings')]
      ]));
    }
    else if (callbackData === 'promo_code') {
      const userId = String(ctx.from.id);
      userStates.set(userId, 'onPromoCode');
      await this.onPromoCode(ctx);
    }
  }

  @Action('settings')
async onSettings(@Ctx() ctx: Context) {
  const userId = String(ctx.from.id);
  const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

  const messages = {
    uz: {
      settings: '⚙️ Sozlamalar menyusi:',
      updatePhoneNumber: '📱 Telefon raqamni yangilash',
      back: '🔙 Bosh menyuga',
    },
    ru: {
      settings: '⚙️ Настройки:',
      updatePhoneNumber: '📱 Обновить номер телефона',
      back: '🔙 Назад в главное меню',
    },
    en: {
      settings: '⚙️ Settings menu:',
      updatePhoneNumber: '📱 Update phone number',
      back: '🔙 Back to main menu',
    },
  };

  userStates.set(userId, 'awaiting_settings_selection');

  await ctx.reply(messages[lang].settings, Markup.inlineKeyboard([
    [Markup.button.callback(messages[lang].updatePhoneNumber, 'update_phone_number')],
    [Markup.button.callback(messages[lang].back, 'back_to_main_menu')]
  ]));
}
@Action('update_phone_number')
async onUpdatePhoneNumber(@Ctx() ctx: Context) {
  const userId = String(ctx.from.id);
  const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

  const messages = {
    uz: '📲 Iltimos, yangi telefon raqamingizni +998901234567 formatida yuboring:',
    ru: '📲 Пожалуйста, отправьте новый номер телефона в формате +998901234567:',
    en: '📲 Please send your new phone number in the format +998901234567:',
  };

  userStates.set(userId, 'awaiting_phone_update');
  await ctx.reply(messages[lang]);
  // this.onText(ctx)

  
} 
async updatePhoneNumber(ctx: Context, phoneNumber: string) {
  const isValid = /^\+998\d{9}$/.test(phoneNumber.trim());
  if (!isValid) {
    await ctx.reply("❌ Telefon raqam noto‘g‘ri formatda. +998901234567 tarzida kiriting.");
    return;
  }

  // update qiling
  const telegramId = String(ctx.from.id);
  await this.userService.updatePhoneNumber(telegramId, {phone_number: phoneNumber});
  userStates.delete(telegramId);

  await ctx.reply("✅ Telefon raqamingiz muvaffaqiyatli yangilandi.");
}

@On('message')
async updatePhoneText(ctx: Context){
  
  const userId = String(ctx.from.id);
  const state = userStates.get(userId);
  
  const userInput = (ctx.message as Message.TextMessage).text.trim();
  console.log("user input:",userInput)
  if (state === 'onPromoCode') {
    return this.onPromoCode(ctx);
  }
  else if (state === 'awaiting_phone') {
    return this.handleContact(ctx);
  }
  else if (state === 'awaiting_firstname') {
    return this.onTexts(ctx);
  }
  else if (state === 'awaiting_firstname') {
    return this.onTextMessage(ctx);
  }
  
  else if (state === 'awaiting_phone_update') {
    
    return this.updatePhoneNumber(ctx, userInput);
  }
// ❗️ Iltimos, to‘g‘ri maʼlumot yuboring

}


  @On('text')
  async onTexts(ctx: any) {
    const userInput = ctx.message.text.trim();
    const userId = String(ctx.from.id);
    const state = userStates.get(userId);

    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const messages = {
      'uz': {
        awaiting_firstname: 'Iltimos, ismingizni kiriting:',
        awaiting_lastname: 'Iltimos, familiyangizni kiriting:',
        awaiting_username: 'Iltmos, username (takrorlanmas) kiriting:',
        awaiting_phone_number: 'Iltimos, telefon raqamingizni kiriting (masalan, +998901234567):',
        invalid_phone_number: 'Telefon raqami noto\'g\'ri formatda. Iltimos, to\'g\'ri formatda kiriting (+998901234567).',
        awaiting_birthday: 'Endi tug\'ilgan kuningizni kiriting (masalan, 1990-01-30):',
        invalid_birthday: 'Tug\'ilgan kuningizni noto\'g\'ri formatda kiritdingiz. Iltimos, to\'g\'ri formatda kiriting (masalan, 1990-01-01).',
        registration_success: 'Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi!',
        main_menu: 'Asosiy menyu:',
        profile: '👤 Profil',
        settings: '⚙️ Sozlamalar',
      },
      'ru': {
        awaiting_firstname: 'Пожалуйста, введите ваше имя:',
        awaiting_lastname: 'Пожалуйста, введите вашу фамилию:',
        awaiting_username: 'Пожалуйста, введите ваш username (неповторяющийся):',
        awaiting_phone_number: 'Пожалуйста, введите ваш номер телефона (например, +998901234567):',
        invalid_phone_number: 'Номер телефона введён в неправильном формате. Пожалуйста, введите в правильном формате (+998901234567).',
        awaiting_birthday: 'Теперь введите вашу дату рождения (например, 1990-01-30):',
        invalid_birthday: 'Дата рождения введена в неправильном формате. Пожалуйста, введите в правильном формате (например, 1990-01-01).',
        registration_success: 'Регистрация прошла успешно!',
        main_menu: 'Основное меню:',
        profile: '👤 Профиль',
        settings: '⚙️ Настройки',
      },
      'en': {
        awaiting_firstname: 'Please enter your first name:',
        awaiting_lastname: 'Please enter your last name:',
        awaiting_username: 'Please enter your username (unique):',
        awaiting_phone_number: 'Please enter your phone number (e.g., +998901234567):',
        invalid_phone_number: 'Phone number is in the wrong format. Please enter it in the correct format (+998901234567).',
        awaiting_birthday: 'Now enter your birthday (e.g., 1990-01-30):',
        invalid_birthday: 'Your birthday is in the wrong format. Please enter it in the correct format (e.g., 1990-01-01).',
        registration_success: 'Registration completed successfully!',
        main_menu: 'Main menu:',
        profile: '👤 Profile',
        settings: '⚙️ Settings',
      },
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const messages2 = {
      uz: {
        updatePhoneNumber: '📞 Telefon raqamni yangilash',
        enterNewPhoneNumber: 'Yangi telefon raqamni kiriting (masalan, +998901234567):',
        invalid_phone_number: 'Telefon raqami noto‘g‘ri formatda. Iltimos, +998 bilan boshlanadigan to‘g‘ri formatda kiriting.',
        success: '✅ Telefon raqam muvaffaqiyatli yangilandi!',
        error: '❌ Telefon raqamni yangilashda xatolik yuz berdi.',
      },
      ru: {
        updatePhoneNumber: '📞 Обновить номер телефона',
        enterNewPhoneNumber: 'Введите новый номер телефона (например, +998901234567):',
        invalid_phone_number: 'Номер телефона в неправильном формате. Пожалуйста, введите в формате +998...',
        success: '✅ Номер телефона успешно обновлён!',
        error: '❌ Произошла ошибка при обновлении номера телефона.',
      },
      en: {
        updatePhoneNumber: '📞 Update Phone Number',
        enterNewPhoneNumber: 'Please enter your new phone number (e.g., +998901234567):',
        invalid_phone_number: 'Phone number is in the wrong format. Please enter it in the correct format starting with +998.',
        success: '✅ Phone number successfully updated!',
        error: '❌ Error occurred while updating the phone number.',
      }
    }


    
    // if (state === 'awaiting_phone_update') {
    //   return this.updatePhoneNumber(ctx, userInput);
    // }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (!this.sessionData[userId]) {
      this.sessionData[userId] = {};
    }

//to‘g‘ri maʼlumot yuboring
    

    if (state === 'awaiting_firstname' && userInput) {
      this.sessionData[userId]['telegramId'] = userId;
      this.sessionData[userId]['firstname'] = userInput;
      userStates.set(userId, 'awaiting_lastname');
      await ctx.reply(messages[lang].awaiting_lastname);
      return;
    }

    if (state === 'awaiting_lastname' && userInput) {
      this.sessionData[userId]['lastname'] = userInput;
      userStates.set(userId, 'awaiting_username');
      await ctx.reply(messages[lang].awaiting_username);
      return;
    }

    if (state === 'awaiting_username' && userInput) {
      this.sessionData[userId]['username'] = userInput;
      userStates.set(userId, 'awaiting_phone_number');
      await ctx.reply(messages[lang].awaiting_phone_number);
      return;
    }

    if (state === 'awaiting_phone_number' && userInput) {
      const phoneNumber = userInput;
      const phonePattern = /^\+998\d{9}$/;
      if (!phonePattern.test(phoneNumber)) {
        await ctx.reply(messages[lang].invalid_phone_number);
        return;
      }
      this.sessionData[userId]['phone_number'] = phoneNumber;
      userStates.set(userId, 'awaiting_birthday');
      await ctx.reply(messages[lang].awaiting_birthday);
      return;
    }
    
  // const telegramId = String(ctx.from.id);
  // await this.userService.updatePhoneNumber(telegramId, phoneNumber);
  // userStates.delete(telegramId);

  // await ctx.reply("✅ Telefon raqamingiz muvaffaqiyatli yangilandi.");

    if (state === 'awaiting_birthday' && userInput) {
      const birthday = userInput;
      if (isNaN(Date.parse(birthday))) {
        await ctx.reply(messages[lang].invalid_birthday);
        return;
      }
      this.sessionData[userId]['birthday'] = birthday;

      await ctx.reply(messages[lang].registration_success);

      await this.authService.signUp(this.sessionData[userId] as CreateUserDto);

      await ctx.reply(messages[lang].main_menu, Markup.inlineKeyboard([
        [Markup.button.callback(messages[lang].profile, 'profile')],
        [Markup.button.callback(messages[lang].settings, 'settings')],
      ]));

      delete this.sessionData[userId];
      userStates.set(userId, '');
      return;
    }
  }

  @Action('enter_birthdate')
  async onEnterBirthdate(@Ctx() ctx: Context) {
    // Determine the language of the user
    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[String(ctx.from.id)] || 'uz';

    const messages = {
      'uz': {
        birthdate_prompt: '📅 Tugilgan kuningizni YYYY-MM-DD formatida yuboring:',
      },
      'ru': {
        birthdate_prompt: '📅 Пожалуйста, введите вашу дату рождения в формате YYYY-MM-DD:',
      },
      'en': {
        birthdate_prompt: '📅 Please enter your birthdate in YYYY-MM-DD format:',
      },
    };

    await ctx.reply(messages[lang].birthdate_prompt);
    userStates.set(String(ctx.from.id), 'birthDate');
  }
  @On('text')
  async onTextMessage(@Ctx() ctx: any) {
    const userId = String(ctx.from.id);

    const state = userStates.get(userId);

    const lang: 'uz' | 'ru' | 'en' = userLanguageMap[userId] || 'uz';

    const messages = {
      'uz': {
        invalid_birthdate: '❌ Tug‘ilgan kun formati noto‘g‘ri. Iltimos, YYYY-MM-DD formatida yuboring.',
        birthdate_saved: '✅ Tug‘ilgan kun muvaffaqiyatli saqlandi.',
        birthdate_error: '❌ Tug‘ilgan kunni saqlashda xatolik yuz berdi.',
      },
      'ru': {
        invalid_birthdate: '❌ Формат даты рождения неверный. Пожалуйста, отправьте в формате YYYY-MM-DD.',
        birthdate_saved: '✅ Дата рождения успешно сохранена.',
        birthdate_error: '❌ Произошла ошибка при сохранении даты рождения.',
      },
      'en': {
        invalid_birthdate: '❌ Birthdate format is incorrect. Please send it in YYYY-MM-DD format.',
        birthdate_saved: '✅ Birthdate successfully saved.',
        birthdate_error: '❌ There was an error saving the birthdate.',
      },
    };

    if (state === 'onPromoCode') {
      return this.onPromoCode(ctx);
    }
    if (state === 'awaiting_phone') {
      return this.handleContact(ctx);
    }
    if (state === 'awaiting_firstname') {
      return this.onTexts(ctx);
    }

    if (userStates.get(userId)) {
      const input = (ctx.message as Message.TextMessage).text;
      const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!birthDateRegex.test(input)) {
        await ctx.reply(messages[lang].invalid_birthdate);
        return;
      }

      try {
        await this.userService.updateBirthDate(userId, input);
        await ctx.reply(messages[lang].birthdate_saved);
        userStates.set(userId, '');
      } catch (error) {
        console.error(error);
        await ctx.reply(messages[lang].birthdate_error);
      }
    }
  }

  @Action(/page_(next|prev)/)
  async onPaginate(@Ctx() ctx: Context) {
    const telegramId = String(ctx.from.id);
    const user = await this.userService.findByUserId(telegramId);

    if (!user) {
      const lang = userLanguageMap[telegramId] || 'uz';

      const messages = {
        'uz': {
          register_prompt: "Iltimos, avval roʻyxatdan oʻting.",
          registration_button: 'Royxatdan otish:',
        },
        'ru': {
          register_prompt: "Пожалуйста, сначала зарегистрируйтесь.",
          registration_button: 'Зарегистрироваться:',
        },
        'en': {
          register_prompt: "Please register first.",
          registration_button: 'Register:',
        },
      };

      await ctx.reply(messages[lang].register_prompt);
      await ctx.reply(messages[lang].registration_button, Markup.inlineKeyboard([
        [Markup.button.callback('👤 Profil', 'profile')],
      ]));
      return;
    }

    const userId = user.id;
    const lang = userLanguageMap[userId] || 'uz';
    const direction = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')[1];
    const currentPage = userPageMap[userId] || 0;
    const categoryId = userCategoryMap[userId];

    const newPage = direction === 'next' ? currentPage + 1 : Math.max(currentPage - 1, 0);
    userPageMap[userId] = newPage;

    await this.sendProducts(ctx, categoryId, newPage, lang);
  }

  async sendProducts(ctx: Context, categoryId: number, page: number, lang: string) {
    const limit = 10;
    const offset = page * limit;
    const products = await this.productService.findByProductPaginated(categoryId, limit, offset);
    console.log("dds", products)

    if (!products.length) {
      return ctx.reply(
        lang === 'uz' ? 'Mahsulotlar topilmadi.' :
          lang === 'ru' ? 'Продукты не найдены.' :
            'No products found.'
      );
    }
    //Buyurtmalarni 
    const buttons = products.map(product =>
      Markup.button.callback(product.name, `prod_${product.id}`)
    );

    const keyboard = [];
    for (let i = 0; i < buttons.length; i += 3) {
      keyboard.push(buttons.slice(i, i + 3));
    }
    const messageText =
      lang === 'uz' ? '🛍 Mahsulotlar:' :
        lang === 'ru' ? '🛍 Продукты:' :
          '🛍 Products:';

    try {
      await ctx.editMessageText(messageText, Markup.inlineKeyboard(keyboard));
    } catch (err) {
      await ctx.reply(messageText, Markup.inlineKeyboard(keyboard));
    }

    let mes2 = '';
    let mes = '';

    if (lang === 'uz') {
      mes = '⬅️ Oldingi';
      mes2 = '➡️ Keyingi';
    } else if (lang === 'ru') {
      mes = '⬅️ Назад';
      mes2 = '➡️ Далее';
    } else if (lang === 'en') {
      mes = '⬅️ Prev';
      mes2 = '➡️ Next';
    }
    await ctx.reply(
      lang === 'uz' ? 'Sahifalarni boshqarish:' :
        lang === 'ru' ? 'Управление страницами:' :
          'Pagination:',
      Markup.inlineKeyboard([
        Markup.button.callback(mes, 'page_prev'),
        Markup.button.callback(mes2, 'page_next'),
      ])
    );
  }




  @Action(['search', 'cart', 'orders', 'contact', 'profile'])
  async handleMenuActions(@Ctx() ctx: Context) {
    const telegramId = String(ctx.from.id);
    const user = await this.userService.findByUserId(telegramId);

    if (!user) {
      await ctx.reply("Iltimos, avval roʻyxatdan oʻting.");
      await ctx.reply('Royxatdan otish:', Markup.inlineKeyboard([
        [Markup.button.callback('👤 Profil', 'profile')],
      ]));
      return;
    }
// settings
    const userId = user.id;
    const lang = userLanguageMap[userId] || 'uz';
    const action = (ctx.callbackQuery as CallbackQuery.DataQuery).data;

    await ctx.answerCbQuery();

    if (action === 'search') {
      return ctx.reply(
        lang === 'uz' ? '🔎 Qidirilayotgan mahsulot nomini kiriting:' :
          lang === 'ru' ? '🔎 Введите название продукта:' :
            '🔎 Enter the product name:'
      );
    }

    await ctx.reply(
      lang === 'uz' ? `✅ [${action}] bo'limi hali tayyor emas.` :
        lang === 'ru' ? `✅ Раздел [${action}] пока не готов.` :
          `✅ [${action}] section is not ready yet.`
    );
  }

  @On('text')
  async onText(@Ctx() ctx: any) {
    const telegramId = String(ctx.from.id);
    const user = await this.userService.findByUserId(telegramId);

    const userd = String(ctx.from.id);
    const state = userStates.get(userd);
    if (state === 'onPromoCode') {
      return this.onPromoCode(ctx);
    }
    if (state === 'awaiting_phone') {
      return this.handleContact(ctx);
    }
    if (state === 'awaiting_firstname') {
      return this.onTexts(ctx);
    }
    if(state === 'update_phone_number'){
      return this.onUpdatePhoneNumber(ctx)
    }
    if (!user) {
      const lang = userLanguageMap[telegramId] || 'uz';

      const messages = {
        'uz': {
          register_prompt: "Iltimos, avval roʻyxatdan oʻting.",
          registration_button: 'Royxatdan otish:',
        },
        'ru': {
          register_prompt: "Пожалуйста, сначала зарегистрируйтесь.",
          registration_button: 'Зарегистрироваться:',
        },
        'en': {
          register_prompt: "Please register first.",
          registration_button: 'Register:',
        },
      };

      await ctx.reply(messages[lang].register_prompt);
      await ctx.reply(messages[lang].registration_button, Markup.inlineKeyboard([
        [Markup.button.callback('👤 Profil', 'profile')],
      ]));
      return;
    }

    const userId = user.id;
    const lang = userLanguageMap[userId] || 'uz';
    const message = ctx.message?.text.trim();
    const keyword = message;
    if (!message) {
      await ctx.reply('Faqatgina matnli xabar yuboring.');
      return;
    }

    const messages = {
      'uz': '😕 Mahsulot topilmadi.',
      'ru': '😕 Продукт не найден.',
      'en': '😕 Product not found.'
    };

    const products = await this.productService.searchByName(keyword);

    if (!products.length) {
      return ctx.reply(messages[lang]);
    }

    for (const product of products) {
      const productMessage = {
        'uz': `${product.name} - ${product.price} so'm\n\n${product.description}`,
        'ru': `${product.name} - ${product.price} сум\n\n${product.description}`,
        'en': `${product.name} - ${product.price} UZS\n\n${product.description}`,
      };

      await ctx.replyWithPhoto(
        { source: createReadStream(join(process.cwd(), product.image)) },
        {
          caption: lang === 'uz' ? product.name + ' - ' + product.price + ' so\'m\n\n' + product.description :
            lang === 'ru' ? product.name + ' - ' + product.price + ' so\'m\n\n' + product.description :
              product.name + ' - ' + product.price + ' so\'m\n\n' + product.description,
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                lang === 'uz' ? '🛒 Savatga qoʻshish' :
                  lang === 'ru' ? '🛒 Добавить в корзину' :
                    '🛒 Add to Cart',
                `add_${product.id}`
              )
            ],
            [
              Markup.button.callback(
                lang === 'uz' ? '💳 Hozir sotib olish' :
                  lang === 'ru' ? '💳 Купить сейчас' :
                    '💳 Buy Now',
                `buy_${product.id}`
              )
            ],
          ]).reply_markup,
        }
      );

    }
  }

}
