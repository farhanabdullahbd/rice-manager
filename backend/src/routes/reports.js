const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

function getBranchFilter(req) {
  if (req.user.role === 'super_admin') {
    return req.query.branchId ? parseInt(req.query.branchId) : undefined;
  }
  return req.user.branchId;
}

function dateRange(from, to) {
  const filter = {};
  if (from) filter.gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return Object.keys(filter).length ? filter : undefined;
}

// Daily / range summary
router.get('/summary', auth, async (req, res) => {
  try {
    const branchId = getBranchFilter(req);
    const { from, to } = req.query;
    const createdAt = dateRange(from, to);

    const salesWhere = { ...(branchId && { branchId }), ...(createdAt && { createdAt }) };
    const expWhere = { ...(branchId && { branchId }), ...(createdAt && { date: createdAt }) };
    const purchaseWhere = { ...(branchId && { branchId }), ...(createdAt && { date: createdAt }) };

    const [salesAgg, expenses, purchases] = await Promise.all([
      prisma.sale.aggregate({
        where: salesWhere,
        _sum: { totalAmount: true, paidAmount: true, dueAmount: true, discount: true },
        _count: true,
      }),
      prisma.expense.aggregate({ where: expWhere, _sum: { amount: true } }),
      prisma.purchase.aggregate({ where: purchaseWhere, _sum: { totalAmount: true } }),
    ]);

    const totalSales = Number(salesAgg._sum.totalAmount || 0);
    const totalPurchase = Number(purchases._sum.totalAmount || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);

    // Profit = (selling price - purchase price) * qty  — approximated by revenue - COGS - expenses
    // For a simpler approach: gross profit = sales - purchase cost of sold items
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: salesWhere },
      include: { product: { select: { purchasePrice: true } } },
    });
    const cogs = saleItems.reduce((sum, i) => sum + Number(i.product.purchasePrice) * Number(i.quantity), 0);
    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      totalSales,
      totalSalesCount: salesAgg._count,
      totalPaidAmount: Number(salesAgg._sum.paidAmount || 0),
      totalDueAmount: Number(salesAgg._sum.dueAmount || 0),
      totalDiscount: Number(salesAgg._sum.discount || 0),
      totalPurchase,
      totalExpenses,
      cogs,
      grossProfit,
      netProfit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Top selling products
router.get('/top-products', auth, async (req, res) => {
  try {
    const branchId = getBranchFilter(req);
    const { from, to, limit = 10 } = req.query;
    const createdAt = dateRange(from, to);

    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { ...(branchId && { branchId }), ...(createdAt && { createdAt }) } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: parseInt(limit),
    });

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, unit: true },
    });

    const result = items.map((i) => ({
      ...i,
      product: products.find((p) => p.id === i.productId),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer dues (বাকির তালিকা)
router.get('/customer-dues', auth, async (req, res) => {
  try {
    const branchId = getBranchFilter(req);
    const customers = await prisma.customer.findMany({
      where: {
        ...(branchId && { branchId }),
        currentBalance: { gt: 0 },
      },
      orderBy: { currentBalance: 'desc' },
      include: { branch: { select: { name: true } } },
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Stock alert
router.get('/stock-alert', auth, async (req, res) => {
  try {
    const branchId = getBranchFilter(req);
    const all = await prisma.inventory.findMany({
      where: branchId ? { branchId } : {},
      include: {
        product: { include: { category: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
    });
    const low = all.filter((i) => Number(i.quantity) <= Number(i.minStockAlert));
    res.json(low);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Branch-wise comparison
router.get('/branches', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'শুধুমাত্র super_admin দেখতে পারবেন' });
    }
    const { from, to } = req.query;
    const createdAt = dateRange(from, to);

    const branches = await prisma.branch.findMany();
    const result = await Promise.all(
      branches.map(async (branch) => {
        const where = { branchId: branch.id, ...(createdAt && { createdAt }) };
        const agg = await prisma.sale.aggregate({
          where,
          _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
          _count: true,
        });
        return {
          branch,
          totalSales: Number(agg._sum.totalAmount || 0),
          totalPaid: Number(agg._sum.paidAmount || 0),
          totalDue: Number(agg._sum.dueAmount || 0),
          salesCount: agg._count,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
