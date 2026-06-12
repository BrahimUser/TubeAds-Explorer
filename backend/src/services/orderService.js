import { orderRepository } from '../repositories/orderRepository.js';
import { listingRepository } from '../repositories/listingRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { mapOrder } from '../utils/mappers.js';

function buildOrderNumber() {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${rnd}`;
}

export const orderService = {
  async place(buyerId, input) {
    if (!input?.listingId && !input?.adId) throw new ValidationError('Missing listing.');
    const listingId = input.listingId || input.adId;
    const sellerId = input.sellerUid || input.sellerId;
    if (!sellerId) throw new ValidationError('Missing seller.');
    if (sellerId === buyerId) {
      throw new ValidationError('You cannot order your own listing.');
    }

    const listing = await listingRepository.findById(listingId);
    const subtotalCents = Math.max(0, Number(input.subtotalCents ?? input.priceCents) || 0);
    const shippingFeeCents = Math.max(0, Number(input.shippingFeeCents) || 0);
    const totalCents = subtotalCents + shippingFeeCents;

    const order = await orderRepository.create({
      orderNumber: buildOrderNumber(),
      buyerId,
      sellerId,
      listingId,
      listingTitle: input.adTitle || input.listingTitle || listing?.title || '',
      listingThumbnailUrl: input.adThumbnailUrl || input.listingThumbnailUrl || listing?.thumbnailUrl || '',
      priceCents: subtotalCents,
      subtotalCents,
      shippingFeeCents,
      totalCents,
      currency: input.currency || 'MAD',
      deliveryMethod: input.deliveryMethod === 'pickup' ? 'PICKUP' : 'HOME',
      paymentMethod: input.paymentMethod === 'card' ? 'CARD' : 'CASH',
      status: 'PENDING',
      delivery: {
        create: {
          fullName: String(input.delivery?.fullName || '').trim(),
          phone: String(input.delivery?.phone || '').trim(),
          address: String(input.delivery?.address || '').trim(),
          city: String(input.delivery?.city || '').trim(),
          zip: String(input.delivery?.zip || '').trim(),
          notes: String(input.delivery?.notes || '').trim(),
        },
      },
    });

    return mapOrder(order);
  },

  async list(userId, role = 'buyer') {
    const orders = await orderRepository.findByUser(userId, role);
    return orders.map(mapOrder);
  },

  async getById(userId, orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new AuthorizationError('Access denied');
    }
    return mapOrder(order);
  },

  async updateStatus(userId, orderId, action) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.sellerId !== userId) {
      throw new AuthorizationError('Only the seller can update this order.');
    }

    let nextStatus;
    if (action === 'confirm') {
      if (order.status !== 'PENDING') {
        throw new ValidationError('Only pending orders can be confirmed.');
      }
      nextStatus = 'CONFIRMED';
    } else if (action === 'mark_shipped' || action === 'ship') {
      if (order.status !== 'CONFIRMED') {
        throw new ValidationError('Only in-progress orders can be marked shipped.');
      }
      nextStatus = 'SHIPPED';
    } else if (action === 'cancel') {
      if (order.status === 'SHIPPED' || order.status === 'CANCELLED') {
        throw new ValidationError('This order can no longer be cancelled.');
      }
      nextStatus = 'CANCELLED';
    } else {
      throw new ValidationError('Invalid action');
    }

    const updated = await orderRepository.update(orderId, { status: nextStatus });

    if (action === 'confirm' && order.buyerId) {
      const seller = await userRepository.findById(userId);
      const sellerName = seller?.displayName || seller?.shopName || 'Vendeur';
      await notificationRepository.create({
        recipientId: order.buyerId,
        senderName: sellerName,
        message: `Commande ${order.orderNumber} confirmée par le vendeur`,
        type: 'order_status',
        link: { type: 'orders', orderId: order.id },
      });
    }

    return mapOrder(updated);
  },
};
