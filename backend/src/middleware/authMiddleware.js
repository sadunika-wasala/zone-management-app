const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token, exclude password
      req.user = await Employee.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (req.user.status === 'Inactive') {
        return res.status(403).json({ message: 'Account is inactivated. Contact the Zonal Manager.' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const isZonalManager = (req, res, next) => {
  if (req.user && req.user.position === 'Zonal Manager') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as Zonal Manager. Access denied.' });
  }
};

module.exports = { protect, isZonalManager };
