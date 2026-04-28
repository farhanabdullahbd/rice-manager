const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { allow } = require('../middleware/rbac');

router.get('/', auth, async (req, res) => {
  try {
    const where = req.user.role === 'super_admin' ? {} : { id: req.user.branchId };
    const branches = await prisma.branch.findMany({ where, orderBy: { id: 'asc' } });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allow('super_admin'), async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;
    if (!name) return res.status(400).json({ message: 'ব্রাঞ্চের নাম দিন' });
    const branch = await prisma.branch.create({ data: { name, address, phone, email } });
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, allow('super_admin'), async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;
    const branch = await prisma.branch.update({
      where: { id: parseInt(req.params.id) },
      data: { name, address, phone, email },
    });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, allow('super_admin'), async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'ব্রাঞ্চ মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
