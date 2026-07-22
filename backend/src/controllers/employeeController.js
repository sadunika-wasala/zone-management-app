const Employee = require('../models/Employee');
const Customer = require('../models/Customer');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Zonal Manager sees all, others see active only for directories)
const getEmployees = async (req, res) => {
  try {
    let query = {};
    if (req.user.position !== 'Zonal Manager') {
      query.status = 'Active';
    }

    const employees = await Employee.find(query)
      .select('-password')
      .populate('manager', 'name email position')
      .populate('leader', 'name email position');

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('-password')
      .populate('manager', 'name email position')
      .populate('leader', 'name email position');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get customer count for this employee (specifically if advisor, leader, or manager)
    let customerCount = 0;
    if (employee.position === 'Advisor') {
      customerCount = await Customer.countDocuments({ assignedAdvisor: employee._id });
    } else if (employee.position === 'Unit Leader') {
      // Advisors under this Unit Leader
      const advisors = await Employee.find({ leader: employee._id, position: 'Advisor' });
      const advisorIds = advisors.map(a => a._id);
      customerCount = await Customer.countDocuments({ assignedAdvisor: { $in: advisorIds } });
    } else if (employee.position === 'Branch Manager') {
      // Advisors under leaders under this Branch Manager
      const advisors = await Employee.find({ manager: employee._id, position: 'Advisor' });
      const advisorIds = advisors.map(a => a._id);
      customerCount = await Customer.countDocuments({ assignedAdvisor: { $in: advisorIds } });
    }

    res.json({
      ...employee.toObject(),
      customerCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an employee
// @route   POST /api/employees
// @access  Private/ZonalManager
const createEmployee = async (req, res) => {
  const { nic, name, email, password, telephone, address, position, manager, leader } = req.body;

  try {
    // Check if employee exists
    const employeeExists = await Employee.findOne({ $or: [{ email }, { nic }] });
    if (employeeExists) {
      return res.status(400).json({ message: 'Employee with this Email or NIC already exists' });
    }

    // Validation based on position
    let finalManager = null;
    let finalLeader = null;

    if (position === 'Advisor') {
      if (!manager || !leader) {
        return res.status(400).json({ message: 'Advisors must be assigned a Unit Leader and Branch Manager' });
      }
      finalManager = manager;
      finalLeader = leader;
    } else if (position === 'Unit Leader') {
      if (!manager) {
        return res.status(400).json({ message: 'Unit Leaders must be assigned a Branch Manager' });
      }
      finalManager = manager;
    }

    const employee = await Employee.create({
      nic,
      name,
      email,
      password,
      telephone,
      address,
      position,
      manager: finalManager,
      leader: finalLeader,
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        nic: employee.nic,
        name: employee.name,
        email: employee.email,
        position: employee.position,
        telephone: employee.telephone,
        address: employee.address,
        status: employee.status,
      });
    } else {
      res.status(400).json({ message: 'Invalid employee data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/ZonalManager
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.name = req.body.name || employee.name;
    employee.email = req.body.email || employee.email;
    employee.nic = req.body.nic || employee.nic;
    employee.telephone = req.body.telephone || employee.telephone;
    employee.address = req.body.address || employee.address;
    employee.position = req.body.position || employee.position;
    employee.status = req.body.status || employee.status;

    if (req.body.password) {
      employee.password = req.body.password;
    }

    // Hierarchy updates
    if (employee.position === 'Advisor') {
      employee.manager = req.body.manager || employee.manager;
      employee.leader = req.body.leader || employee.leader;
    } else if (employee.position === 'Unit Leader') {
      employee.manager = req.body.manager || employee.manager;
      employee.leader = null;
    } else {
      employee.manager = null;
      employee.leader = null;
    }

    const updatedEmployee = await employee.save();
    res.json({
      _id: updatedEmployee._id,
      nic: updatedEmployee.nic,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      position: updatedEmployee.position,
      telephone: updatedEmployee.telephone,
      address: updatedEmployee.address,
      status: updatedEmployee.status,
      manager: updatedEmployee.manager,
      leader: updatedEmployee.leader,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complete organizational hierarchy
// @route   GET /api/employees/hierarchy/tree
// @access  Private
const getHierarchyTree = async (req, res) => {
  try {
    // 1. Fetch all active employees
    const employees = await Employee.find({ status: 'Active' }).select('-password').lean();

    // 2. Fetch customer counts for advisors
    const customerCounts = await Customer.aggregate([
      { $group: { _id: '$assignedAdvisor', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    customerCounts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    // 3. Separate by position
    const branchManagers = employees.filter(e => e.position === 'Branch Manager');
    const unitLeaders = employees.filter(e => e.position === 'Unit Leader');
    const advisors = employees.filter(e => e.position === 'Advisor');

    // 4. Build Tree
    const tree = branchManagers.map(bm => {
      // Find leaders under this BM
      const leadersUnderBm = unitLeaders
        .filter(ul => ul.manager && ul.manager.toString() === bm._id.toString())
        .map(ul => {
          // Find advisors under this UL
          const advisorsUnderUl = advisors
            .filter(adv => adv.leader && adv.leader.toString() === ul._id.toString())
            .map(adv => {
              const count = countMap[adv._id.toString()] || 0;
              return {
                ...adv,
                customerCount: count,
              };
            });

          const ulCustomerCount = advisorsUnderUl.reduce((sum, adv) => sum + adv.customerCount, 0);

          return {
            ...ul,
            advisors: advisorsUnderUl,
            customerCount: ulCustomerCount,
          };
        });

      const bmCustomerCount = leadersUnderBm.reduce((sum, ul) => sum + ul.customerCount, 0);

      return {
        ...bm,
        leaders: leadersUnderBm,
        customerCount: bmCustomerCount,
      };
    });

    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getHierarchyTree,
};
