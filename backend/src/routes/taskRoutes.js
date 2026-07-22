const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect, isZonalManager } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTasks)
  .post(protect, isZonalManager, createTask);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, isZonalManager, deleteTask);

module.exports = router;
