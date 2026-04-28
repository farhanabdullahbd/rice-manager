const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const branchId = req.user.role === 'super_admin'
      ? (req.query.branchId ? parseInt(req.query.branchId) : undefined)
      : req.user.branchId;

    const where = {};
    if (branchId) where.branchId = branchId;
    if (req.query.customerId) where.customerId = parseInt(req.query.customerId);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        user: { select: { name: true } },
        sale: { select: { invoiceNo: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// বাকি পরিশোধ
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, saleId, amount, paymentMethod, notes, date } = req.body;
    const branchId = req.user.branchId;

    if (!customerId || !amount) {
      return res.status(400).json({ message: 'কাস্টমার ও পরিমাণ দিন' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          customerId: parseInt(customerId),
          saleId: saleId ? parseInt(saleId) : null,
          branchId,
          userId: req.user.id,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod || 'cash',
          notes,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Reduce customer balance
      await tx.customer.update({
        where: { id: parseInt(customerId) },
        data: { currentBalance: { decrement: parseFloat(amount) } },
      });

      // Update sale due if saleId provided
      if (saleId) {
        const sale = await tx.sale.findUnique({ where: { id: parseInt(saleId) } });
        const newDue = Math.max(0, Number(sale.dueAmount) - parseFloat(amount));
        const newPaid = Number(sale.paidAmount) + parseFloat(amount);
        await tx.sale.update({
          where: { id: parseInt(saleId) },
          data: {
            dueAmount: newDue,
            paidAmount: newPaid,
            status: newDue <= 0 ? 'paid' : 'partial',
          },
        });
      }

      return payment;
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
