import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import {
  SEED_USER_PASSWORD_DEFAULT,
  buildUserFixtures,
  LISTING_BLUEPRINTS,
  CHAT_SCENARIOS,
  ORDER_SCENARIOS,
  FAVORITE_PAIRS,
  DELIVERY_ADDRESSES,
  USER_IDS,
} from './seed-data.js';
import {
  CHAT_IMAGES,
  getAvatarForUserKey,
  resolveListingMedia,
} from './seed-media.js';
import {
  SALT_ROUNDS,
  daysAgo,
  hoursAgo,
  madToCents,
  priceLabel,
  resetDatabase,
  logCounts,
} from './seed-utils.js';

dotenv.config();

const prisma = new PrismaClient();

const SEED_RESET = process.env.SEED_RESET !== 'false';
const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE || '+212600000000';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123456';
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || SEED_USER_PASSWORD_DEFAULT;

function listingIdFromKey(key) {
  const num = parseInt(key.replace('l', ''), 10);
  return `b200${String(num).padStart(4, '0')}-0000-4000-8000-000000000001`;
}

function threadIdFromKey(key) {
  const num = parseInt(key.replace('t', ''), 10);
  return `c300${String(num).padStart(4, '0')}-0000-4000-8000-000000000001`;
}

function orderIdFromKey(key) {
  const num = parseInt(key.replace('o', ''), 10);
  return `d400${String(num).padStart(4, '0')}-0000-4000-8000-000000000001`;
}

function defaultDescription(bp) {
  if (bp.description) return bp.description;
  const cityLabel = bp.city.charAt(0).toUpperCase() + bp.city.slice(1).replace(/-/g, ' ');
  return `${bp.title}. Article proposé à ${cityLabel}. Contactez le vendeur pour plus de détails ou une visite.`;
}

function userKeyFromId(id) {
  return Object.entries(USER_IDS).find(([, v]) => v === id)?.[0];
}

async function seedUsers(passwordHash, superAdminHash) {
  const fixtures = buildUserFixtures(SUPER_ADMIN_PHONE);
  const users = {};

  for (const f of fixtures) {
    const hash = f.id === USER_IDS.superAdmin ? superAdminHash : passwordHash;
    const createdAt = daysAgo(f.createdDaysAgo, 9 + (fixtures.indexOf(f) % 8));
    const userKey = f.avatarKey || userKeyFromId(f.id);
    const avatarUrl = userKey ? getAvatarForUserKey(userKey) : '';
    const data = {
      id: f.id,
      phoneNumber: f.phoneNumber,
      passwordHash: hash,
      displayName: f.displayName,
      role: f.role,
      isPro: f.isPro,
      shopName: f.shopName,
      shopLogoUrl: avatarUrl,
      shopDescription: f.shopDescription ?? '',
      authProvider: 'phone_password',
      createdAt,
      updatedAt: createdAt,
    };

    const user = await prisma.user.upsert({
      where: { phoneNumber: f.phoneNumber },
      create: data,
      update: {
        passwordHash: hash,
        displayName: f.displayName,
        role: f.role,
        isPro: f.isPro,
        shopName: f.shopName,
        shopDescription: f.shopDescription ?? '',
      },
    });
    users[f.id] = { ...user, _fixture: f };
    users[f.phoneNumber] = users[f.id];
  }

  return users;
}

async function seedUploads(users) {
  const uploads = [];
  let uploadIdx = 1;

  const trackExternal = async (userId, publicUrl, originalName, mimeType, sizeBytes) => {
    const id = `e500${String(uploadIdx++).padStart(4, '0')}-0000-4000-8000-000000000001`;
    const upload = await prisma.upload.upsert({
      where: { id },
      create: {
        id,
        userId,
        originalName,
        mimeType,
        sizeBytes,
        storagePath: publicUrl,
        publicUrl,
        createdAt: daysAgo(10),
      },
      update: { publicUrl },
    });
    uploads.push(upload);
    return upload;
  };

  const seenUserIds = new Set();
  for (const user of Object.values(users)) {
    if (!user.id || seenUserIds.has(user.id) || !user._fixture || !user.shopLogoUrl) continue;
    seenUserIds.add(user.id);
    const userKey = user._fixture.avatarKey || userKeyFromId(user.id);
    if (!userKey) continue;
    await trackExternal(
      user.id,
      user.shopLogoUrl,
      `avatar-${userKey}.jpg`,
      'image/jpeg',
      48000,
    );
  }

  const chatImageOwners = [
    USER_IDS.sellerPro3,
    USER_IDS.sellerPro1,
    USER_IDS.sellerPro4,
  ];
  for (let i = 0; i < CHAT_IMAGES.length; i++) {
    await trackExternal(
      chatImageOwners[i],
      CHAT_IMAGES[i],
      `chat-attachment-${i + 1}.jpg`,
      'image/jpeg',
      125000,
    );
  }

  return uploads;
}

async function seedListings(users) {
  const listings = {};
  const images = [];

  for (const bp of LISTING_BLUEPRINTS) {
    const ownerId = USER_IDS[bp.owner];
    const id = listingIdFromKey(bp.key);
    const priceCents = madToCents(bp.priceMad);
    const media = resolveListingMedia(bp);
    const createdAt = daysAgo(bp.daysAgo, 10 + (LISTING_BLUEPRINTS.indexOf(bp) % 12));
    const updatedAt = bp.status === 'PENDING' ? hoursAgo(2) : daysAgo(Math.max(0, bp.daysAgo - 3));

    const listing = await prisma.listing.upsert({
      where: { id },
      create: {
        id,
        ownerId,
        title: bp.title,
        description: defaultDescription(bp),
        priceCents,
        currency: 'MAD',
        category: bp.category,
        city: bp.city,
        youtubeVideoId: media.youtubeVideoId,
        videoUrl: media.videoUrl,
        thumbnailUrl: media.thumbnailUrl,
        status: bp.status,
        viewCount: bp.views,
        createdAt,
        updatedAt,
      },
      update: {
        title: bp.title,
        status: bp.status,
        priceCents,
        viewCount: bp.views,
        videoUrl: media.videoUrl,
        thumbnailUrl: media.thumbnailUrl,
        youtubeVideoId: media.youtubeVideoId,
      },
    });
    listings[bp.key] = listing;

    await prisma.listingImage.deleteMany({ where: { listingId: id } });
    for (let i = 0; i < media.gallery.length; i++) {
      const imageId = `f600${String(LISTING_BLUEPRINTS.indexOf(bp) * 3 + i + 1).padStart(4, '0')}-0000-4000-8000-000000000001`;
      const image = await prisma.listingImage.create({
        data: { id: imageId, listingId: id, url: media.gallery[i], sortOrder: i },
      });
      images.push(image);
    }
  }

  return { listings, images };
}

async function seedFavorites(users, listings) {
  const favorites = [];
  const noFavUserId = USER_IDS.buyer4;

  for (const [buyerKey, listingKey] of FAVORITE_PAIRS) {
    const buyerId = USER_IDS[buyerKey];
    if (buyerId === noFavUserId) continue;

    const listing = listings[listingKey];
    if (!listing) continue;

    const id = `g700${String(favorites.length + 1).padStart(4, '0')}-0000-4000-8000-000000000001`;
    const fav = await prisma.favorite.upsert({
      where: { userId_listingId: { userId: buyerId, listingId: listing.id } },
      create: {
        id,
        userId: buyerId,
        listingId: listing.id,
        title: listing.title,
        priceCents: listing.priceCents,
        currency: listing.currency,
        thumbnailUrl: listing.thumbnailUrl,
        city: listing.city,
        ownerId: listing.ownerId,
        createdAt: daysAgo(20 - (favorites.length % 18), 14),
      },
      update: {
        title: listing.title,
        priceCents: listing.priceCents,
        thumbnailUrl: listing.thumbnailUrl,
      },
    });
    favorites.push(fav);
  }

  return favorites;
}

async function seedChat(users, listings) {
  const threads = [];
  const messages = [];

  for (const scenario of CHAT_SCENARIOS) {
    const listing = listings[scenario.listingKey];
    const buyerId = USER_IDS[scenario.buyer];
    const sellerId = listing.ownerId;
    const threadId = threadIdFromKey(scenario.key);

    const lastMsg = scenario.messages[scenario.messages.length - 1];
    const threadCreatedAt = scenario.messages.length
      ? hoursAgo(lastMsg.hoursAgo + 24)
      : daysAgo(5);

    const thread = await prisma.chatThread.upsert({
      where: { listingId_buyerId: { listingId: listing.id, buyerId } },
      create: {
        id: threadId,
        listingId: listing.id,
        buyerId,
        sellerId,
        productTitle: listing.title,
        productThumb: listing.thumbnailUrl,
        priceLabel: priceLabel(listing.priceCents),
        lastMessageText: lastMsg?.text || null,
        lastMessageAt: lastMsg ? hoursAgo(lastMsg.hoursAgo) : null,
        createdAt: threadCreatedAt,
        updatedAt: lastMsg ? hoursAgo(lastMsg.hoursAgo) : threadCreatedAt,
      },
      update: {
        lastMessageText: lastMsg?.text || null,
        lastMessageAt: lastMsg ? hoursAgo(lastMsg.hoursAgo) : null,
      },
    });
    threads.push(thread);

    await prisma.chatThreadParticipant.deleteMany({ where: { threadId: thread.id } });
    await prisma.chatThreadParticipant.createMany({
      data: [
        { threadId: thread.id, userId: buyerId },
        { threadId: thread.id, userId: sellerId },
      ],
    });

    await prisma.chatMessage.deleteMany({ where: { threadId: thread.id } });

    for (let i = 0; i < scenario.messages.length; i++) {
      const msg = scenario.messages[i];
      const senderId = USER_IDS[msg.sender];
      const msgId = `h800${String(threads.length * 20 + i + 1).padStart(4, '0')}-0000-4000-8000-000000000001`;
      const imageUrl = i === 1 && scenario.key === 't03' ? CHAT_IMAGES[0] : null;

      const message = await prisma.chatMessage.create({
        data: {
          id: msgId,
          threadId: thread.id,
          senderId,
          text: msg.text,
          imageUrl,
          listingId: listing.id,
          createdAt: hoursAgo(msg.hoursAgo),
        },
      });
      messages.push(message);
    }
  }

  return { threads, messages };
}

async function seedOrders(users, listings) {
  const orders = [];

  for (let i = 0; i < ORDER_SCENARIOS.length; i++) {
    const sc = ORDER_SCENARIOS[i];
    const listing = listings[sc.listingKey];
    const buyerId = USER_IDS[sc.buyer];
    const sellerId = listing.ownerId;
    const subtotalCents = listing.priceCents;
    const shippingFeeCents = madToCents(sc.shippingMad);
    const totalCents = subtotalCents + shippingFeeCents;
    const orderId = orderIdFromKey(sc.key);
    const orderNumber = `ORD-SEED-${String(i + 1).padStart(4, '0')}`;
    const createdAt = daysAgo(sc.daysAgo, 11);
    const addr = DELIVERY_ADDRESSES[sc.buyer];

    const order = await prisma.order.upsert({
      where: { orderNumber },
      create: {
        id: orderId,
        orderNumber,
        buyerId,
        sellerId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingThumbnailUrl: listing.thumbnailUrl,
        priceCents: subtotalCents,
        subtotalCents,
        shippingFeeCents,
        totalCents,
        currency: 'MAD',
        deliveryMethod: sc.deliveryMethod,
        paymentMethod: sc.paymentMethod,
        status: sc.status,
        createdAt,
        updatedAt: daysAgo(Math.max(0, sc.daysAgo - 1)),
        delivery: {
          create: {
            fullName: addr.fullName,
            phone: addr.phone,
            address: sc.deliveryMethod === 'PICKUP' ? 'Retrait chez le vendeur' : addr.address,
            city: addr.city,
            zip: addr.zip,
            notes: sc.deliveryMethod === 'HOME' ? 'Appeler 30 min avant livraison.' : null,
          },
        },
      },
      update: { status: sc.status },
    });
    orders.push(order);
  }

  return orders;
}

async function seedNotifications(users, threads, orders, listings) {
  const notifications = [];
  let n = 1;

  const add = async (data) => {
    const id = `i900${String(n).padStart(4, '0')}-0000-4000-8000-000000000001`;
    n += 1;
    const notif = await prisma.notification.upsert({
      where: { id },
      create: { id, ...data },
      update: { message: data.message, isRead: data.isRead, readAt: data.readAt ?? null },
    });
    notifications.push(notif);
    return notif;
  };

  // Chat message notifications
  for (const thread of threads.slice(0, 10)) {
    const recipientId = thread.buyerId;
    const isRead = notifications.length % 3 === 0;
    await add({
      recipientId,
      senderName: 'Vendeur',
      message: thread.lastMessageText || 'Nouveau message',
      type: 'new_message',
      isRead,
      readAt: isRead ? hoursAgo(1) : null,
      readById: isRead ? recipientId : null,
      link: { type: 'chat', threadId: thread.id, listingId: thread.listingId },
      createdAt: thread.lastMessageAt || thread.createdAt,
    });
  }

  // Extra unread chat notifications
  for (const thread of threads.slice(10, 14)) {
    await add({
      recipientId: thread.sellerId,
      senderName: 'Acheteur',
      message: thread.lastMessageText || 'Nouveau message',
      type: 'new_message',
      isRead: false,
      link: { type: 'chat', threadId: thread.id, listingId: thread.listingId },
      createdAt: thread.lastMessageAt || thread.createdAt,
    });
  }

  // Order status notifications
  for (const order of orders.filter((o) => ['CONFIRMED', 'SHIPPED'].includes(o.status))) {
    const seller = await prisma.user.findUnique({ where: { id: order.sellerId } });
    await add({
      recipientId: order.buyerId,
      senderName: seller?.displayName || 'Vendeur',
      message: `Commande ${order.orderNumber} ${order.status === 'SHIPPED' ? 'expédiée' : 'confirmée'} par le vendeur`,
      type: 'order_status',
      isRead: order.status === 'SHIPPED',
      readAt: order.status === 'SHIPPED' ? daysAgo(2) : null,
      readById: order.status === 'SHIPPED' ? order.buyerId : null,
      link: { type: 'orders', orderId: order.id },
      createdAt: order.updatedAt,
    });
  }

  // Listing approved notifications
  const approvedListings = Object.values(listings).filter((l) => l.status === 'APPROVED').slice(0, 8);
  for (const listing of approvedListings) {
    await add({
      recipientId: listing.ownerId,
      senderName: 'Marketplace',
      message: `Votre annonce « ${listing.title.slice(0, 40)}… » a été approuvée`,
      type: 'listing_approved',
      isRead: true,
      readAt: daysAgo(5),
      readById: listing.ownerId,
      link: { type: 'listing', listingId: listing.id },
      createdAt: daysAgo(3),
    });
  }

  // Generic platform announcements
  const genericMessages = [
    { recipient: USER_IDS.buyer1, message: 'Bienvenue sur Marketplace ! Découvrez les nouvelles annonces près de chez vous.' },
    { recipient: USER_IDS.sellerPro1, message: 'Votre boutique pro est active. Consultez vos statistiques dans votre espace vendeur.' },
    { recipient: USER_IDS.buyer2, message: 'Profitez de la livraison à domicile sur les commandes éligibles.' },
    { recipient: USER_IDS.sellerPro3, message: 'Astuce : ajoutez une vidéo YouTube pour augmenter vos vues de 40 %.' },
    { recipient: USER_IDS.buyer3, message: 'Nouveau : messagerie instantanée avec les vendeurs.' },
  ];
  for (const g of genericMessages) {
    await add({
      recipientId: g.recipient,
      senderName: 'Marketplace',
      message: g.message,
      type: 'generic',
      isRead: false,
      link: null,
      createdAt: daysAgo(7),
    });
  }

  return notifications;
}

async function seedRefreshTokens(users) {
  const tokens = [];
  const scenarios = [
    { userKey: 'buyer1', expired: false, revoked: false },
    { userKey: 'buyer2', expired: false, revoked: false },
    { userKey: 'sellerPro1', expired: true, revoked: false },
    { userKey: 'sellerPro3', expired: true, revoked: false },
    { userKey: 'buyer3', expired: false, revoked: true },
    { userKey: 'admin', expired: false, revoked: true },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const sc = scenarios[i];
    const userId = USER_IDS[sc.userKey];
    const id = `j000${String(i + 1).padStart(4, '0')}-0000-4000-8000-000000000001`;
    const expiresAt = sc.expired ? daysAgo(3) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await prisma.refreshToken.upsert({
      where: { id },
      create: {
        id,
        userId,
        tokenHash: `seed_token_hash_${sc.userKey}_${i}`,
        expiresAt,
        revokedAt: sc.revoked ? daysAgo(1) : null,
        createdAt: daysAgo(sc.expired ? 10 : 2),
      },
      update: { expiresAt, revokedAt: sc.revoked ? daysAgo(1) : null },
    });
    tokens.push(token);
  }

  return tokens;
}

async function main() {
  console.log('Marketplace seed starting…');
  console.log(`  SEED_RESET=${SEED_RESET}`);
  console.log(`  Super admin: ${SUPER_ADMIN_PHONE}`);
  console.log(`  Seed users password: ${SEED_USER_PASSWORD}`);

  if (SEED_RESET) {
    console.log('\nClearing existing data…');
    await resetDatabase(prisma);
  }

  const [passwordHash, superAdminHash] = await Promise.all([
    bcrypt.hash(SEED_USER_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(SUPER_ADMIN_PASSWORD, SALT_ROUNDS),
  ]);

  const users = await seedUsers(passwordHash, superAdminHash);
  console.log(`Users: ${buildUserFixtures(SUPER_ADMIN_PHONE).length} profiles`);

  const uploads = await seedUploads(users);
  const { listings, images } = await seedListings(users);
  const favorites = await seedFavorites(users, listings);
  const { threads, messages } = await seedChat(users, listings);
  const orders = await seedOrders(users, listings);
  const notifications = await seedNotifications(users, threads, orders, listings);
  const refreshTokens = await seedRefreshTokens(users);

  const participantCount = threads.length * 2;

  logCounts('Seed complete — record counts:', {
    users: await prisma.user.count(),
    refresh_tokens: refreshTokens.length,
    listings: Object.keys(listings).length,
    listing_images: images.length,
    favorites: favorites.length,
    chat_threads: threads.length,
    chat_thread_participants: participantCount,
    chat_messages: messages.length,
    notifications: notifications.length,
    orders: orders.length,
    order_delivery: orders.length,
    uploads: await prisma.upload.count(),
  });

  console.log('Test logins:');
  console.log(`  Admin:       ${SUPER_ADMIN_PHONE} / (SUPER_ADMIN_PASSWORD)`);
  console.log(`  Admin:       +212610000001 / ${SEED_USER_PASSWORD}`);
  console.log(`  Pro seller:  +212610000002 / ${SEED_USER_PASSWORD}`);
  console.log(`  Buyer:       +212610000014 / ${SEED_USER_PASSWORD}`);
  console.log(`  Buyer (no favorites): +212610000017 / ${SEED_USER_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
