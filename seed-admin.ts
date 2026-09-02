// @ts-nocheck
import PrismaPkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = PrismaPkg;
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data to Neon Database...');

  // 1. Create or Find Main Branch
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        code: 'MAIN01',
      },
    });
    console.log('✔ Created Main Branch');
  }

  // 2. Create or Find Super Admin Role
  let role = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with full access',
      },
    });
    console.log('✔ Created SUPER_ADMIN Role');
  }

  // 3. Hash Password
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // 4. Create Super Admin User
  const user = await prisma.appUser.create({
    data: {
      name: 'Ibad Khan',
      email: 'ibadurrehman010@gmail.com',
      password: hashedPassword,
      roleId: role.id,
      branchId: branch.id,
      isActive: true,
    },
  });

  console.log('SUCCESS! Created Super Admin user:', user.email);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });