const ROLE_HIERARCHY = {
  super_admin: 3,
  branch_manager: 2,
  cashier: 1,
};

const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'এই কাজের অনুমতি নেই' });
  }
  next();
};

const branchGuard = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();

  const branchId = parseInt(req.params.branchId || req.body.branchId || req.query.branchId);
  if (branchId && req.user.branchId !== branchId) {
    return res.status(403).json({ message: 'অন্য ব্রাঞ্চের তথ্য দেখার অনুমতি নেই' });
  }
  next();
};

module.exports = { allow, branchGuard };
