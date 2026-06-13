/** Shared helpers for prisma/seed.js */

export const SALT_ROUNDS = 12;

/** Spread timestamps from ~5 months ago to now. */
export function daysAgo(days, hour = 12, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function hoursAgo(hours) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

export function pick(arr, index) {
  return arr[index % arr.length];
}

export function madToCents(mad) {
  return Math.round(mad * 100);
}

export function priceLabel(cents, currency = 'MAD') {
  return `${Math.round(cents / 100).toLocaleString('fr-MA')} ${currency}`;
}

/**
 * Wipe all application tables in reverse FK order.
 * Safe for development reseeding only.
 */
export async function resetDatabase(prisma) {
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.orderDelivery.deleteMany(),
    prisma.order.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.chatThreadParticipant.deleteMany(),
    prisma.chatThread.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.listingImage.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.upload.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export function logCounts(label, counts) {
  console.log(`\n${label}`);
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(28)} ${count}`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`  ${'TOTAL'.padEnd(28)} ${total}\n`);
}
