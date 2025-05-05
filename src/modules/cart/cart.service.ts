import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { CartItem } from '../cart-item/entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Promocode } from '../promocode/entities/promocode.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Promocode)
    private promocodeRepository: Repository<Promocode>
  ) {}

  async getOrCreateCart(telegramId: string): Promise<Cart> {
    const user = await this.userRepository.findOne({
      where: { telegramId },
      relations: ['carts', 'carts.items', 'carts.items.product'],
    });
  
    if (!user) throw new NotFoundException('User not found');
  
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
    });
  
    if (!cart) {
      cart = this.cartRepository.create({ user, items: [] });
      await this.cartRepository.save(cart);
    }
  
    return cart;
  }
  
  

  async addToCart(telegramId: string, productId: number, quantity: number) {
    const cart = await this.getOrCreateCart(telegramId);
    const product = await this.productRepository.findOneBy({ id: productId });
  
    if (!product) throw new NotFoundException('Product not found');
  
    let cartItem = await this.cartItemRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: productId } },
    });
  
    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity,
      });
    }
  
    return this.cartItemRepository.save(cartItem);
  }
  

  async getCartByUser(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) throw new NotFoundException('Cart not found');

    return cart;
  }

  async updateCartItem(userId: string, productId: number, quantity: number) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.cartItemRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: productId } },
    });

    if (!item) throw new NotFoundException('Cart item not found');

    item.quantity = quantity;

    return this.cartItemRepository.save(item);
  }

  async removeCartItem(userId: string, productId: number) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.cartItemRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: productId } },
    });

    if (!item) throw new NotFoundException('Cart item not found');

    return this.cartItemRepository.remove(item);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.cartItemRepository.delete({ cart: { id: cart.id } });

    return { message: 'Cart cleared' };
  }

  async applyPromocode(userId: string, code: string) {
    const cart = await this.getOrCreateCart(userId);
    const promocode = await this.promocodeRepository.findOneBy({ code });
  
    if (!promocode || !promocode.isActive) {
      throw new NotFoundException('Notogri yoki faolsiz promokod');
    }
  
    const now = new Date();
  
    if (promocode.startDate && now < new Date(promocode.startDate)) {
      throw new BadRequestException('Promokod hali kuchga kirmagan');
    }
  
    if (promocode.endDate && now > new Date(promocode.endDate)) {
      throw new BadRequestException('Promokod muddati tugagan');
    }
  
    cart.promocode = promocode;
    await this.cartRepository.save(cart);
  
    return {
      message: 'Promokod qollandi',
      newTotal: cart.getTotalPrice(),
    };
  }

  async save(cart: Cart): Promise<Cart> {
    return this.cartRepository.save(cart);
  }

  async getUserCart(userId: string) {
    return this.cartRepository.find({
      where: { user: { telegramId: userId } },
      relations: ['product', 'user'],
    });
    
  }
  
  // cart.service.ts
async findById(cartId: number): Promise<Cart> {
  return this.cartRepository.findOne({
    where: { id: cartId },
    relations: ['items', 'items.product', 'promocode'],
  });
}

  
}
