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
    if (req.query.lowStock === 'true') {
      where.quantity = { lt: prisma.inventory.fields.minStockAlert };
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: { include: { category: { select: { name: true } } } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/low-stock', auth, async (req, res) => {
  try {
    const branchId = req.user.role === 'super_admin'
      ? (req.query.branchId ? parseInt(req.query.branchId) : undefined)
      : req.user.branchId;

    const inventory = await prisma.$queryRaw`
      SELECT i.*, p.name as productName, p.unit, b.name as branchName
      FROM Inventory i
      JOIN Product p ON i.productId = p.id
      JOIN Branch b ON i.branchId = b.id
      WHERE i.quantity <= i.minStockAlert
      ${branchId ? prisma.$queryRaw`AND i.branchId = ${branchId}` : prisma.$queryRaw``}
    `;
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manual stock adjustment
router.post('/adjust', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { branchId, productId, quantity, minStockAlert } = req.body;
    const targetBranchId = req.user.role === 'super_admin' ? parseInt(branchId) : req.user.branchId;

    const inventory = await prisma.inventory.upsert({
      where: { branchId_productId: { branchId: targetBranchId, productId: parseInt(productId) } },
      update: { quantity: parseFloat(quantity), ...(minStockAlert !== undefined && { minStockAlert: parseFloat(minStockAlert) }) },
      create: { branchId: targetBranchId, productId: parseInt(productId), quantity: parseFloat(quantity), minStockAlert: minStockAlert ? parseFloat(minStockAlert) : 5 },
    });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
