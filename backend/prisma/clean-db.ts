import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function clean() {
  console.log('🧹 Limpiando datos de prueba de la Base de Datos...');

  // Eliminar en orden inverso por llaves foráneas
  await prisma.ventaPago.deleteMany({});
  await prisma.ventaDetalle.deleteMany({});
  await prisma.venta.deleteMany({});
  await prisma.merma.deleteMany({});
  await prisma.gasto.deleteMany({});
  await prisma.loteProduccion.deleteMany({});
  await prisma.productoInsumoAdicional.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.recetaInsumo.deleteMany({});
  await prisma.receta.deleteMany({});
  await prisma.insumo.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.cliente.deleteMany({});

  console.log('✅ Todos los registros operativos de prueba eliminados.');

  // Asegurar usuario Admin
  let admin = await prisma.usuario.findUnique({
    where: { email: 'admin@krumly.com' },
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    admin = await prisma.usuario.create({
      data: {
        username: 'admin',
        email: 'admin@krumly.com',
        passwordHash,
        role: 'admin',
        activo: true,
      },
    });
    console.log('👤 Usuario Administrador creado: admin@krumly.com / admin123');
  } else {
    console.log('👤 Usuario Administrador conservado para inicio de sesión.');
  }

  console.log('🎉 Base de datos lista en 0 para ingresar datos reales del negocio.');
}

clean()
  .catch((e) => {
    console.error('❌ Error al limpiar base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
