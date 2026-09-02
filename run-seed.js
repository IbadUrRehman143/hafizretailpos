import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Database se connect ho raha hai...');

  // 1. Branch Check / Create
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: { name: 'Main Branch', code: 'MAIN01' },
    });
    console.log('Branch created:', branch.name);
  } else {
    console.log('Branch pehle se mojood hai:', branch.name);
  }

  // 2. Role Check / Create
  let role = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  if (!role) {
    role = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Super Admin Access' },
    });
    console.log('Role created:', role.name);
  } else {
    console.log('Role pehle se mojood hai:', role.name);
  }

  // 3. Password Hash
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // 4. Admin User Create / Update
  const user = await prisma.appUser.upsert({
    where: { email: 'ibadurrehman010@gmail.com' },
    update: {
      password: hashedPassword,
      isActive: true,
    },
    create: {
      name: 'Ibad Khan',
      email: 'ibadurrehman010@gmail.com',
      password: hashedPassword,
      roleId: role.id,
      branchId: branch.id,
      isActive: true,
    },
  });

  console.log('✅ Super Admin successfully created/updated:', user.email);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });