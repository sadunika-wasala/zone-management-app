const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (employee.status === 'Inactive') {
      return res.status(403).json({ message: 'Account is inactivated. Contact the Zonal Manager.' });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);

    if (isMatch) {
      res.json({
        _id: employee.id,
        name: employee.name,
        email: employee.email,
        position: employee.position,
        nic: employee.nic,
        status: employee.status,
        token: generateToken(employee._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id).select('-password');
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  getMe,
};
