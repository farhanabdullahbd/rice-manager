const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { allow } = require('../middleware/rbac');

router.get('/', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const branchId = req.user.role === 'super_admin'
      ? (req.query.branchId ? parseInt(req.query.branchId) : undefined)
      : req.user.branchId;

    const where = {};
    if (branchId) where.branchId = branchId;
    if (req.query.category) where.category = req.query.category;
    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date.gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const branchId = req.user.branchId || (req.user.role === 'super_admin' ? parseInt(req.body.branchId) : null);

    if (!amount) return res.status(400).json({ message: 'পরিমাণ দিন' });

    const expense = await prisma.expense.create({
      data: {
        branchId,
        userId: req.user.id,
        category: category || 'other',
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'খরচ মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
