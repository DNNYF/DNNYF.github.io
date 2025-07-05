import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Ganti sesuai username yang ingin diupdate
  const username = 'admin@gmail.com';
  // Password baru (plain text)
  const plainPassword = '123';

  // Hash password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Update password di database
  const updated = await prisma.admin.updateMany({
    where: { username },
    data: { password: hashedPassword }
  });

  if (updated.count > 0) {
    console.log('Password berhasil diupdate dengan hash bcrypt!');
  } else {
    console.log('Admin dengan username tersebut tidak ditemukan.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());