export function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    uid: user.id,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    role: user.role.toLowerCase(),
    isPro: user.isPro,
    shopName: user.shopName,
    shopLogoUrl: user.shopLogoUrl,
    shopDescription: user.shopDescription,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function mapListing(listing) {
  if (!listing) return null;
  const images = listing.images || [];
  const imageUrls = images.sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url);
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    priceCents: listing.priceCents,
    currency: listing.currency,
    category: listing.category,
    city: listing.city,
    youtubeVideoId: listing.youtubeVideoId,
    videoUrl: listing.videoUrl,
    thumbnailUrl: listing.thumbnailUrl || imageUrls[0] || '',
    imageUrls,
    ownerUid: listing.ownerId,
    ownerId: listing.ownerId,
    owner: listing.owner
      ? {
          displayName: listing.owner.displayName,
          shopName: listing.owner.shopName,
          phoneNumber: listing.owner.phoneNumber,
          isPro: listing.owner.isPro,
        }
      : null,
    status: listing.status.toLowerCase(),
    viewCount: listing.viewCount,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}

export function mapFavorite(fav) {
  return {
    id: fav.id,
    adId: fav.listingId,
    listingId: fav.listingId,
    title: fav.title,
    priceCents: fav.priceCents,
    currency: fav.currency,
    thumbnailUrl: fav.thumbnailUrl,
    city: fav.city,
    ownerUid: fav.ownerId,
    createdAt: fav.createdAt,
  };
}

export function mapChatThread(thread) {
  return {
    id: thread.id,
    listingId: thread.listingId,
    adId: thread.listingId,
    buyerUid: thread.buyerId,
    sellerUid: thread.sellerId,
    participantIds: [thread.buyerId, thread.sellerId].sort(),
    productTitle: thread.productTitle,
    productThumb: thread.productThumb,
    priceLabel: thread.priceLabel,
    lastMessageText: thread.lastMessageText,
    lastMessageAt: thread.lastMessageAt,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

export function mapChatMessage(msg) {
  return {
    id: msg.id,
    threadId: msg.threadId,
    senderUid: msg.senderId,
    senderId: msg.senderId,
    text: msg.text,
    imageUrl: msg.imageUrl,
    listingId: msg.listingId,
    createdAt: msg.createdAt,
    timestamp: msg.createdAt,
  };
}

export function mapNotification(n) {
  return {
    id: n.id,
    recipientId: n.recipientId,
    senderName: n.senderName,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    link: n.link,
    readAt: n.readAt,
    readBy: n.readById,
    createdAt: n.createdAt,
  };
}

export function mapOrder(order) {
  const delivery = order.delivery || {};
  return {
    id: order.id,
    buyerUid: order.buyerId,
    sellerUid: order.sellerId,
    adId: order.listingId,
    adTitle: order.listingTitle,
    adThumbnailUrl: order.listingThumbnailUrl,
    priceCents: order.priceCents,
    subtotalCents: order.subtotalCents,
    shippingFeeCents: order.shippingFeeCents,
    totalCents: order.totalCents,
    currency: order.currency,
    delivery: {
      fullName: delivery.fullName || '',
      phone: delivery.phone || '',
      address: delivery.address || '',
      city: delivery.city || '',
      zip: delivery.zip || '',
      notes: delivery.notes || '',
    },
    deliveryMethod: order.deliveryMethod.toLowerCase(),
    paymentMethod: order.paymentMethod.toLowerCase(),
    status: order.status.toLowerCase(),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function mapUpload(upload) {
  return {
    id: upload.id,
    originalName: upload.originalName,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
    publicUrl: upload.publicUrl,
    createdAt: upload.createdAt,
  };
}
