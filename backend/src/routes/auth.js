const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const authMiddleware = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'ইমেইল ও পাসওয়ার্ড দিন' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: { select: { id: true, name: true } } },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch?.name,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch },
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার সমস্যা', error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, branch: { select: { id: true, name: true } } },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার সমস্যা', error: err.message });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'বর্তমান পাসওয়ার্ড ভুল' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ message: 'পাসওয়ার্ড পরিবর্তন সফল' });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার সমস্যা', error: err.message });
  }
});

module.exports = router;
