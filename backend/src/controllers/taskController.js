const Task = require('../models/Task');
const Employee = require('../models/Employee');

// Helper to get allowed employee IDs for tasks (the user themselves + hierarchy)
const getAllowedTaskEmployeeIds = async (user) => {
  const ids = [user._id]; // Always include the user themselves

  if (user.position === 'Zonal Manager') {
    const all = await Employee.find({});
    return all.map(e => e._id);
  } else if (user.position === 'Branch Manager') {
    const subordinates = await Employee.find({ manager: user._id });
    return [...ids, ...subordinates.map(s => s._id)];
  } else if (user.position === 'Unit Leader') {
    const subordinates = await Employee.find({ leader: user._id });
    return [...ids, ...subordinates.map(s => s._id)];
  }

  return ids;
};

// @desc    Get all tasks based on role/hierarchy
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const allowedEmployeeIds = await getAllowedTaskEmployeeIds(req.user);

    const tasks = await Task.find({ assignedTo: { $in: allowedEmployeeIds } })
      .populate('assignedTo', 'name email position')
      .populate('assignedBy', 'name email position')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email position')
      .populate('assignedBy', 'name email position');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const allowedEmployeeIds = await getAllowedTaskEmployeeIds(req.user);
    const hasAccess = allowedEmployeeIds.some(
      id => id.toString() === task.assignedTo._id.toString()
    );

    if (!hasAccess && task.assignedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this task' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private/ZonalManager (Only Zonal Manager can assign tasks)
const createTask = async (req, res) => {
  const { title, description, assignedTo, startDate, endDate } = req.body;

  try {
    // Verify assignedTo exists
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({ message: 'Assigned employee not found' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      startDate,
      endDate,
      assignedBy: req.user._id, // Logged in Zonal Manager
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email position')
      .populate('assignedBy', 'name email position');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status or details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  const { title, description, assignedTo, startDate, endDate, status } = req.body;

  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isManager = req.user.position === 'Zonal Manager';

    if (!isAssignee && !isManager) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    if (isManager) {
      // Zonal Manager can update all fields
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.startDate = startDate || task.startDate;
      task.endDate = endDate || task.endDate;
      task.status = status || task.status;

      if (assignedTo) {
        const employeeExists = await Employee.findById(assignedTo);
        if (!employeeExists) {
          return res.status(404).json({ message: 'Assigned employee not found' });
        }
        task.assignedTo = assignedTo;
      }
    } else {
      // Employees can only update status
      if (title || description || assignedTo || startDate || endDate) {
        return res.status(403).json({ message: 'Employees can only update task status' });
      }
      if (status) {
        task.status = status;
      }
    }

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email position')
      .populate('assignedBy', 'name email position');

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/ZonalManager
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.position !== 'Zonal Manager') {
      return res.status(403).json({ message: 'Only Zonal Manager can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
