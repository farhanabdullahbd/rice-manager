const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { allow } = require('../middleware/rbac');

router.get('/', auth, async (req, res) => {
  try {
    const { search, categoryId } = req.query;
    const where = {};
    if (search) where.name = { contains: search };
    if (categoryId) where.categoryId = parseInt(categoryId);

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ message: 'পণ্য পাওয়া যায়নি' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, sku, unit, purchasePrice, sellingPrice, categoryId } = req.body;
    if (!name || !sku || !purchasePrice || !sellingPrice) {
      return res.status(400).json({ message: 'নাম, SKU, ক্রয়মূল্য ও বিক্রয়মূল্য দিন' });
    }
    const product = await prisma.product.create({
      data: { name, sku, unit: unit || 'piece', purchasePrice: parseFloat(purchasePrice), sellingPrice: parseFloat(sellingPrice), categoryId: categoryId ? parseInt(categoryId) : null },
    });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'SKU ইতিমধ্যে ব্যবহৃত' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, sku, unit, purchasePrice, sellingPrice, categoryId } = req.body;
    const data = {};
    if (name) data.name = name;
    if (sku) data.sku = sku;
    if (unit) data.unit = unit;
    if (purchasePrice) data.purchasePrice = parseFloat(purchasePrice);
    if (sellingPrice) data.sellingPrice = parseFloat(sellingPrice);
    if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId) : null;

    const product = await prisma.product.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, allow('super_admin'), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'পণ্য মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Categories
router.get('/meta/categories', auth, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meta/categories', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'ক্যাটাগরির নাম দিন' });
    const category = await prisma.category.create({ data: { name, description } });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
