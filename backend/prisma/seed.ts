import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existingUser = await prisma.usuario.findUnique({
    where: { email: 'admin@krumly.com' },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuario.create({
      data: {
        username: 'admin',
        email: 'admin@krumly.com',
        passwordHash: passwordHash,
        role: 'admin',
        activo: true,
      },
    });
    console.log('Usuario Admin creado con éxito:', admin.email);
  } else {
    console.log('El usuario admin@krumly.com ya existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
