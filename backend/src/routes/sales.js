const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

function generateInvoiceNo(branchId) {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-B${branchId}-${y}${m}${d}-${rand}`;
}

router.get('/', auth, async (req, res) => {
  try {
    const branchId = req.user.role === 'super_admin'
      ? (req.query.branchId ? parseInt(req.query.branchId) : undefined)
      : req.user.branchId;

    const where = {};
    if (branchId) where.branchId = branchId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.customerId) where.customerId = parseInt(req.query.customerId);
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 20);

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          user: { select: { name: true } },
          branch: { select: { name: true } },
          items: { include: { product: { select: { name: true, unit: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ sales, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        user: { select: { name: true } },
        branch: true,
        items: { include: { product: { select: { name: true, unit: true, sku: true } } } },
        payments: true,
      },
    });
    if (!sale) return res.status(404).json({ message: 'বিক্রয় পাওয়া যায়নি' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { customerId, items, discount, paidAmount, paymentMethod, notes } = req.body;
    const branchId = req.user.branchId;

    if (!branchId) return res.status(400).json({ message: 'ব্রাঞ্চ নির্বাচন করুন' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'কমপক্ষে একটি পণ্য যোগ করুন' });

    // Validate stock and calculate totals
    for (const item of items) {
      const inv = await prisma.inventory.findUnique({
        where: { branchId_productId: { branchId, productId: parseInt(item.productId) } },
      });
      if (!inv || Number(inv.quantity) < item.quantity) {
        const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
        return res.status(400).json({ message: `"${product?.name}" পণ্যের পর্যাপ্ত স্টক নেই` });
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const discountAmt = parseFloat(discount || 0);
    const totalAmount = subtotal - discountAmt;
    const paid = parseFloat(paidAmount || totalAmount);
    const dueAmount = totalAmount - paid;
    const status = dueAmount <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'due');

    const invoiceNo = generateInvoiceNo(branchId);

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          branchId,
          customerId: customerId ? parseInt(customerId) : null,
          userId: req.user.id,
          invoiceNo,
          subtotal,
          discount: discountAmt,
          totalAmount,
          paidAmount: paid,
          dueAmount: Math.max(0, dueAmount),
          paymentMethod: paymentMethod || 'cash',
          status,
          notes,
          items: {
            create: items.map((i) => ({
              productId: parseInt(i.productId),
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount || 0,
              totalPrice: i.quantity * i.unitPrice - (i.discount || 0),
            })),
          },
        },
        include: { items: true },
      });

      // Deduct inventory
      for (const item of items) {
        await tx.inventory.update({
          where: { branchId_productId: { branchId, productId: parseInt(item.productId) } },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Update customer balance if due
      if (customerId && dueAmount > 0) {
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { currentBalance: { increment: dueAmount } },
        });
      }

      return created;
    });

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sales return (void/cancel)
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });
    if (!sale) return res.status(404).json({ message: 'বিক্রয় পাওয়া যায়নি' });

    await prisma.$transaction(async (tx) => {
      // Restore inventory
      for (const item of sale.items) {
        await tx.inventory.update({
          where: { branchId_productId: { branchId: sale.branchId, productId: item.productId } },
          data: { quantity: { increment: item.quantity } },
        });
      }
      // Restore customer balance
      if (sale.customerId && Number(sale.dueAmount) > 0) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { currentBalance: { decrement: Number(sale.dueAmount) } },
        });
      }
      await tx.saleItem.deleteMany({ where: { saleId: sale.id } });
      await tx.sale.delete({ where: { id: sale.id } });
    });

    res.json({ message: 'বিক্রয় বাতিল করা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
