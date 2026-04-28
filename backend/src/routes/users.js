const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { allow } = require('../middleware/rbac');

router.get('/', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const where = req.user.role === 'super_admin' ? {} : { branchId: req.user.branchId };
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, isActive: true, branchId: true, branch: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'নাম, ইমেইল ও পাসওয়ার্ড দিন' });
    }
    if (req.user.role === 'branch_manager' && role === 'super_admin') {
      return res.status(403).json({ message: 'super_admin তৈরির অনুমতি নেই' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedBranchId = req.user.role === 'branch_manager' ? req.user.branchId : (branchId || null);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'cashier', branchId: assignedBranchId },
      select: { id: true, name: true, email: true, role: true, branchId: true },
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'ইমেইল ইতিমধ্যে ব্যবহৃত' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, allow('super_admin', 'branch_manager'), async (req, res) => {
  try {
    const { name, role, isActive, branchId } = req.body;
    const data = { name, role, isActive };
    if (req.user.role === 'super_admin' && branchId !== undefined) data.branchId = branchId;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, branchId: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
