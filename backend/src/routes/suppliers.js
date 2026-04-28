const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { allow } = require('../middleware/rbac');

router.get('/', auth, async (req, res) => {
  try {
    const where = req.query.search ? { name: { contains: req.query.search } } : {};
    const suppliers = await prisma.supplier.findMany({ where, orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name) return res.status(400).json({ message: 'সরবরাহকারীর নাম দিন' });
    const supplier = await prisma.supplier.create({ data: { name, phone, address } });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const supplier = await prisma.supplier.update({ where: { id: parseInt(req.params.id) }, data: { name, phone, address } });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
