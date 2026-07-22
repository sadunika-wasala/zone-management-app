const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

// Helper to get allowed advisor IDs based on user's hierarchy
const getAllowedAdvisorIds = async (user) => {
  if (user.position === 'Zonal Manager') {
    // Zonal Manager can see everything
    const allAdvisors = await Employee.find({ position: 'Advisor' });
    return allAdvisors.map(a => a._id);
  } else if (user.position === 'Branch Manager') {
    // Under this Branch Manager
    const advisors = await Employee.find({ manager: user._id, position: 'Advisor' });
    return advisors.map(a => a._id);
  } else if (user.position === 'Unit Leader') {
    // Under this Unit Leader
    const advisors = await Employee.find({ leader: user._id, position: 'Advisor' });
    return advisors.map(a => a._id);
  } else if (user.position === 'Advisor') {
    // Only themselves
    return [user._id];
  }
  return [];
};

// @desc    Get all customers based on user hierarchy
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const allowedAdvisorIds = await getAllowedAdvisorIds(req.user);

    const customers = await Customer.find({ assignedAdvisor: { $in: allowedAdvisorIds } })
      .populate('assignedAdvisor', 'name email position telephone');

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedAdvisor', 'name email position telephone');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Verify user can access this customer
    const allowedAdvisorIds = await getAllowedAdvisorIds(req.user);
    const hasAccess = allowedAdvisorIds.some(
      id => id.toString() === customer.assignedAdvisor._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this customer record' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  const { nic, name, address, policyAmount, assignedAdvisor } = req.body;

  try {
    // Check if customer with this NIC already exists
    const customerExists = await Customer.findOne({ nic });
    if (customerExists) {
      return res.status(400).json({ message: 'Customer with this NIC already exists' });
    }

    // Determine advisor to assign
    let advisorId = assignedAdvisor;
    if (req.user.position === 'Advisor') {
      // Force advisor to assign to themselves
      advisorId = req.user._id;
    } else {
      // For other positions, verify the assigned advisor exists and is under their hierarchy
      if (!advisorId) {
        return res.status(400).json({ message: 'Assigned advisor is required' });
      }
      const allowedAdvisorIds = await getAllowedAdvisorIds(req.user);
      const isAllowed = allowedAdvisorIds.some(id => id.toString() === advisorId.toString());
      if (!isAllowed) {
        return res.status(403).json({ message: 'Cannot assign customer to an advisor outside your hierarchy' });
      }
    }

    const customer = await Customer.create({
      nic,
      name,
      address,
      policyAmount,
      assignedAdvisor: advisorId,
    });

    const populatedCustomer = await Customer.findById(customer._id)
      .populate('assignedAdvisor', 'name email position');

    res.status(201).json(populatedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  const { nic, name, address, policyAmount, assignedAdvisor } = req.body;

  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Verify current user can manage this customer
    const allowedAdvisorIds = await getAllowedAdvisorIds(req.user);
    const hasAccess = allowedAdvisorIds.some(
      id => id.toString() === customer.assignedAdvisor.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to edit this customer record' });
    }

    // Update fields
    customer.name = name || customer.name;
    customer.nic = nic || customer.nic;
    customer.address = address || customer.address;
    customer.policyAmount = policyAmount !== undefined ? policyAmount : customer.policyAmount;

    // Handle changing assigned advisor if user is not advisor
    if (req.user.position !== 'Advisor' && assignedAdvisor) {
      const isAllowed = allowedAdvisorIds.some(id => id.toString() === assignedAdvisor.toString());
      if (!isAllowed) {
        return res.status(403).json({ message: 'Cannot assign customer to an advisor outside your hierarchy' });
      }
      customer.assignedAdvisor = assignedAdvisor;
    }

    const updatedCustomer = await customer.save();
    const populatedCustomer = await Customer.findById(updatedCustomer._id)
      .populate('assignedAdvisor', 'name email position');

    res.json(populatedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/ZonalManager
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Double check Zonal Manager role (redundant due to route protection but safe)
    if (req.user.position !== 'Zonal Manager') {
      return res.status(403).json({ message: 'Only Zonal Manager can delete customer records' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer record deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
