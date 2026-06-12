import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = process.env.SUPER_ADMIN_PHONE || '+212600000000';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123456';

  const existing = await prisma.user.findUnique({ where: { phoneNumber: phone } });
  if (existing) {
    console.log('Super admin already exists:', existing.id);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      phoneNumber: phone,
      passwordHash,
      displayName: 'Super Admin',
      role: 'ADMIN',
      authProvider: 'phone_password',
    },
  });
  console.log('Super admin created:', admin.id, admin.phoneNumber);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
