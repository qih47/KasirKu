const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'qisthih@gmail.com';
  const password = '@123456Ahsiyap';

  // Check existing user
  const existing = await prisma.user.findFirst({
    where: { email },
    include: { tenant: true, outlet: true },
  });

  if (existing) {
    console.log('User found:', {
      id: existing.id,
      email: existing.email,
      role: existing.role,
      tenantId: existing.tenantId,
      tenant: existing.tenant?.businessName,
      isActive: existing.isActive,
    });

    // Verify password
    const valid = await bcrypt.compare(password, existing.passwordHash);
    console.log('Password valid:', valid);
    if (!valid) {
      console.log('Resetting password...');
      const hash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash: hash, isActive: true } });
      console.log('Password reset done.');
    }
  } else {
    console.log('User NOT found. Creating tenant and user...');

    // Create a test tenant
    const tenant = await prisma.tenant.create({
      data: {
        businessName: 'Bisnis Qisthih Demo',
        status: 'TRIAL',
        trialStartAt: new Date(),
        trialEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create the outlet
    const outlet = await prisma.outlet.create({
      data: {
        tenantId: tenant.id,
        name: 'Outlet Utama',
        address: 'Jl. Demo No. 1',
        isActive: true,
      },
    });

    // Create the user (OWNER role)
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        outletId: outlet.id,
        role: 'OWNER',
        name: 'Qisthih',
        email,
        passwordHash: hash,
        isActive: true,
      },
    });

    // Create a license tier if needed
    const tier = await prisma.licenseTier.findFirst({ where: { code: 'STARTER' } });
    if (tier) {
      await prisma.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          licenseTierId: tier.id,
          billingCycle: 'MONTHLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });
    }

    console.log('Created:', { tenantId: tenant.id, outletId: outlet.id, userId: user.id });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
