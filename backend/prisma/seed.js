const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Branches
  const branch1 = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'মূল শাখা', address: 'ঢাকা', phone: '01700000001' },
  });
  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'চট্টগ্রাম শাখা', address: 'চট্টগ্রাম', phone: '01700000002' },
  });

  // Super admin
  await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@pos.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'super_admin',
      branchId: null,
    },
  });

  // Branch managers
  await prisma.user.upsert({
    where: { email: 'manager1@pos.com' },
    update: {},
    create: {
      name: 'করিম ম্যানেজার',
      email: 'manager1@pos.com',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'branch_manager',
      branchId: branch1.id,
    },
  });

  // Cashier
  await prisma.user.upsert({
    where: { email: 'cashier1@pos.com' },
    update: {},
    create: {
      name: 'রহিম ক্যাশিয়ার',
      email: 'cashier1@pos.com',
      passwordHash: await bcrypt.hash('cashier123', 10),
      role: 'cashier',
      branchId: branch1.id,
    },
  });

  // Categories
  const categories = ['চাল ও খাদ্যশস্য', 'ডাল ও মসুর', 'তেল ও মশলা', 'পানীয়', 'অন্যান্য'];
  const createdCats = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { id: categories.indexOf(name) + 1 },
      update: {},
      create: { name },
    });
    createdCats[name] = cat;
  }

  // Products
  const products = [
    { name: 'মিনিকেট চাল', sku: 'RICE-001', unit: 'kg', purchasePrice: 52, sellingPrice: 58, cat: 'চাল ও খাদ্যশস্য' },
    { name: 'নাজিরশাইল চাল', sku: 'RICE-002', unit: 'kg', purchasePrice: 68, sellingPrice: 75, cat: 'চাল ও খাদ্যশস্য' },
    { name: 'আটা (ময়দা)', sku: 'FLOUR-001', unit: 'kg', purchasePrice: 38, sellingPrice: 44, cat: 'চাল ও খাদ্যশস্য' },
    { name: 'মসুর ডাল', sku: 'DAL-001', unit: 'kg', purchasePrice: 90, sellingPrice: 100, cat: 'ডাল ও মসুর' },
    { name: 'সয়াবিন তেল (১লি)', sku: 'OIL-001', unit: 'liter', purchasePrice: 140, sellingPrice: 155, cat: 'তেল ও মশলা' },
    { name: 'হলুদ গুঁড়া', sku: 'SPICE-001', unit: 'kg', purchasePrice: 150, sellingPrice: 180, cat: 'তেল ও মশলা' },
    { name: 'চিনি', sku: 'SUGAR-001', unit: 'kg', purchasePrice: 100, sellingPrice: 115, cat: 'অন্যান্য' },
    { name: 'লবণ', sku: 'SALT-001', unit: 'kg', purchasePrice: 20, sellingPrice: 28, cat: 'অন্যান্য' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          name: p.name, sku: p.sku, unit: p.unit,
          purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice,
          categoryId: createdCats[p.cat]?.id,
        },
      });
      // Add inventory for branch 1
      await prisma.inventory.create({
        data: { branchId: branch1.id, productId: product.id, quantity: 100, minStockAlert: 10 },
      });
    }
  }

  // Sample customer
  await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'আবু সাইদ', phone: '01711111111', address: 'মিরপুর, ঢাকা', branchId: branch1.id, creditLimit: 5000 },
  });

  console.log('✅ Seed সম্পন্ন');
  console.log('লগইন তথ্য:');
  console.log('  admin@pos.com / admin123 (super_admin)');
  console.log('  manager1@pos.com / manager123 (branch_manager)');
  console.log('  cashier1@pos.com / cashier123 (cashier)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
