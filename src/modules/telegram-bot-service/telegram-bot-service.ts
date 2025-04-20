// import { Ctx, On, Start, Update } from 'nestjs-telegraf';
// import { Context, Telegraf } from 'telegraf';
// import { AddressService } from '../address/address.service';
// import { Injectable } from '@nestjs/common';

// @Update()
// @Injectable()
// export class TelegramBotService {
//   private bot: Telegraf;

//   constructor(private readonly addressService: AddressService) {
//   }

//   @Start()
//   async onStart(@Ctx() ctx: Context) {

//     console.log('START command received!');
//     await ctx.reply('Assalomu alaykum! 📍 Manzil yuborish uchun tugmani bosing.', {
//       reply_markup: {
//         keyboard: [[{ text: '📍 Manzil yuborish', request_location: true }]],
//         resize_keyboard: true,
//         one_time_keyboard: true,
//       },
//     });
//   }

//   @On('location')
//   async handleLocation(@Ctx() ctx: Context) {
//     const location = ctx.message['location'];
//     const { latitude, longitude } = location;

//     const address = await this.addressService.createAddress(latitude, longitude);

//     await ctx.reply(`✅ Manzilingiz saqlandi!\n\n📍 ${address.description || 'Manzil topilmadi'}`);
//   }
// }




//buni oxirida ulavoraiz addressni testing qilish uchun birinchi yozib korgandim,ochirilmasin!!!

import { Injectable } from '@nestjs/common';
import { Ctx, Start, On, Action, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { CallbackQuery, Message } from 'telegraf/typings/core/types/typegram';
import { createReadStream } from 'fs';
import { join } from 'path';

const userLanguageMap: Record<number, 'uz' | 'ru' | 'en'> = {};
const userPageMap: Record<number, number> = {};
const userCategoryMap: Record<number, number> = {};

const menus = {
  uz: [
    ['🍽 Menu', 'menu'],
    ['🔍 Qidiruv', 'search'],
    ['🛒 Savat', 'cart'],
    ['📦 Buyurtmalar', 'orders'],
    ['📞 Bogʻlanish', 'contact'],
    ['👤 Profil', 'profile'],
  ],
  ru: [
    ['🍽 Меню', 'menu'],
    ['🔍 Поиск', 'search'],
    ['🛒 Корзина', 'cart'],
    ['📦 История заказов', 'orders'],
    ['📞 Контакты', 'contact'],
    ['👤 Профиль', 'profile'],
  ],
  en: [
    ['🍽 Menu', 'menu'],
    ['🔍 Search', 'search'],
    ['🛒 Cart', 'cart'],
    ['📦 Orders', 'orders'],
    ['📞 Contact', 'contact'],
    ['👤 Profile', 'profile'],
  ],
};

@Update()
@Injectable()
export class TelegramBotService {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
  ) {}


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

  @Action(/cat_\d+/)
  async onCategory(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    const lang = userLanguageMap[userId] || 'uz';
    const categoryId = parseInt((ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')[1]);

    userPageMap[userId] = 0;
    userCategoryMap[userId] = categoryId;

    await this.sendProducts(ctx, categoryId, 0, lang);


  }

  @Action(/prod_\d+/)
  async onProduct(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    const lang = userLanguageMap[userId] || 'uz';
    const productId = parseInt((ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')[1]);

    const product = await this.productService.findOne(productId);
    if (!product) {
      return ctx.answerCbQuery(
        lang === 'uz' ? 'Mahsulot topilmadi.' :
        lang === 'ru' ? 'Продукт не найден.' :
        'Product not found.',
        { show_alert: true }
      );
    }

    await ctx.replyWithPhoto(
      { source: createReadStream(join(process.cwd(), product.image)) },
      {
        caption: `${product.name} - ${product.price} so'm\n\n${product.description}`,
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🛒 Savatga qoʻshish', `add_${product.id}`)],
          [Markup.button.callback('💳 Hozir sotib olish', `buy_${product.id}`)],
        ]).reply_markup,
      }
    );

    await ctx.answerCbQuery();
  }

  @Action(/page_(next|prev)/)
  async onPaginate(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    const lang = userLanguageMap[userId] || 'uz';
    const direction = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')[1];
    const currentPage = userPageMap[userId] || 0;
    const categoryId = userCategoryMap[userId];

    const newPage = direction === 'next' ? currentPage + 1 : Math.max(currentPage - 1, 0);
    userPageMap[userId] = newPage;

    await this.sendProducts(ctx, categoryId, newPage, lang);
  }

  async sendProducts(ctx: Context, categoryId: number, page: number, lang: string) {
    const limit = 10; // Har sahifada 10 mahsulot ko'rsatiladi
    const offset = page * limit;
    const products = await this.productService.findByProductPaginated(categoryId, limit, offset);

    if (!products.length) {
      return ctx.reply(
        lang === 'uz' ? 'Mahsulotlar topilmadi.' :
        lang === 'ru' ? 'Продукты не найдены.' :
        'No products found.'
      );
    }

    const buttons = products.map(product =>
      Markup.button.callback(product.name, `prod_${product.id}`)
    );

    const keyboard = [];
    for (let i = 0; i < buttons.length; i += 3) {
      keyboard.push(buttons.slice(i, i + 3));
    }

    await ctx.editMessageText(
      lang === 'uz' ? '🛍 Mahsulotlar:' :
      lang === 'ru' ? '🛍 Продукты:' :
      '🛍 Products:',
      Markup.inlineKeyboard(keyboard)
    );

    await ctx.reply(
      lang === 'uz' ? 'Sahifalarni boshqarish:' :
      lang === 'ru' ? 'Управление страницами:' :
      'Pagination:',
      Markup.inlineKeyboard([
        Markup.button.callback('⬅️ Oldingi', 'page_prev'),
        Markup.button.callback('➡️ Keyingi', 'page_next'),
      ])
    );
  }

  @Action(['search', 'cart', 'orders', 'contact', 'profile'])
  async handleMenuActions(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
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
  async onText(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    const lang = userLanguageMap[userId] || 'uz';
    const message = ctx.message as Message.TextMessage;
    const keyword = message.text;

    const products = await this.productService.searchByName(keyword);

    if (!products.length) {
      return ctx.reply(
        lang === 'uz' ? '😕 Mahsulot topilmadi.' :
        lang === 'ru' ? '😕 Продукт не найден.' :
        '😕 Product not found.'
      );
    }

    for (const product of products) {
      await ctx.replyWithPhoto(
        { source: createReadStream(join(process.cwd(), product.image)) },
        {
          caption: `${product.name} - ${product.price} so'm\n\n${product.description}`,
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🛒 Savatga qoʻshish', `add_${product.id}`)],
            [Markup.button.callback('💳 Hozir sotib olish', `buy_${product.id}`)],
          ]).reply_markup,
        }
      );
    }
  }
}
