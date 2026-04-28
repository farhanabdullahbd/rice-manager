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
    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date.gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        user: { select: { name: true } },
        branch: { select: { name: true } },
        items: { include: { product: { select: { name: true, unit: true } } } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { supplierId, items, discount, paidAmount, paymentMethod, invoiceNo, notes, date } = req.body;
    const branchId = req.user.branchId || (req.user.role === 'super_admin' ? parseInt(req.body.branchId) : null);

    if (!branchId) return res.status(400).json({ message: 'ব্রাঞ্চ নির্বাচন করুন' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'কমপক্ষে একটি পণ্য যোগ করুন' });

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const discountAmt = parseFloat(discount || 0);
    const totalAmount = subtotal - discountAmt;
    const paid = parseFloat(paidAmount || totalAmount);
    const dueAmount = Math.max(0, totalAmount - paid);

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          branchId,
          supplierId: supplierId ? parseInt(supplierId) : null,
          userId: req.user.id,
          invoiceNo,
          subtotal,
          discount: discountAmt,
          totalAmount,
          paidAmount: paid,
          dueAmount,
          paymentMethod: paymentMethod || 'cash',
          notes,
          date: date ? new Date(date) : new Date(),
          items: {
            create: items.map((i) => ({
              productId: parseInt(i.productId),
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.quantity * i.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      // Add to inventory
      for (const item of items) {
        await tx.inventory.upsert({
          where: { branchId_productId: { branchId, productId: parseInt(item.productId) } },
          update: { quantity: { increment: item.quantity } },
          create: { branchId, productId: parseInt(item.productId), quantity: item.quantity },
        });
      }

      return created;
    });

    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
