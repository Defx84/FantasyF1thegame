module.exports = function (req, res, next) {
  if (req.user && req.user.isAppAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'App admin privileges required' });
}; 