const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getHierarchyTree,
} = require('../controllers/employeeController');
const { protect, isZonalManager } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEmployees)
  .post(protect, isZonalManager, createEmployee);

router.get('/hierarchy/tree', protect, getHierarchyTree);

router.route('/:id')
  .get(protect, getEmployeeById)
  .put(protect, isZonalManager, updateEmployee);

module.exports = router;
