const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { allow } = require('../middleware/rbac');

router.get('/', auth, async (req, res) => {
  try {
    const branchId = req.user.role === 'super_admin'
      ? (req.query.branchId ? parseInt(req.query.branchId) : undefined)
      : req.user.branchId;

    const where = {};
    if (branchId) where.branchId = branchId;
    if (req.query.search) where.OR = [{ name: { contains: req.query.search } }, { phone: { contains: req.query.search } }];

    const customers = await prisma.customer.findMany({
      where,
      include: { branch: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { branch: { select: { name: true } } },
    });
    if (!customer) return res.status(404).json({ message: 'কাস্টমার পাওয়া যায়নি' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/ledger', auth, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { from, to } = req.query;

    const salesWhere = { customerId };
    if (from || to) {
      salesWhere.createdAt = {};
      if (from) salesWhere.createdAt.gte = new Date(from);
      if (to) salesWhere.createdAt.lte = new Date(to);
    }

    const [customer, sales, payments] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.sale.findMany({
        where: salesWhere,
        include: { items: { include: { product: { select: { name: true } } } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.payment.findMany({
        where: { customerId },
        orderBy: { date: 'asc' },
      }),
    ]);

    res.json({ customer, sales, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, address, creditLimit } = req.body;
    if (!name) return res.status(400).json({ message: 'কাস্টমারের নাম দিন' });
    const branchId = req.user.branchId;
    if (!branchId) return res.status(400).json({ message: 'ব্রাঞ্চ নির্বাচন করুন' });

    const customer = await prisma.customer.create({
      data: { name, phone, address, creditLimit: parseFloat(creditLimit || 0), branchId },
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, address, creditLimit } = req.body;
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { name, phone, address, ...(creditLimit !== undefined && { creditLimit: parseFloat(creditLimit) }) },
    });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
