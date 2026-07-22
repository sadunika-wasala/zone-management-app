import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Calendar, User, ArrowRight, X } from 'lucide-react';
import { API_BASE_URL } from '../api'; // Adjust relative import path if needed

const Tasks = () => {
  const { user, isZonalManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('To Do');

  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  const fetchData = async () => {
    try {
      // Fetch tasks (scoped on server)
      const tasksRes = await fetch(`${API_BASE_URL}/api/tasks`, { headers });
      const tasksData = await tasksRes.json();
      if (tasksRes.ok) {
        setTasks(tasksData);
      }

      // Fetch employees for dropdown (only Zonal Manager can assign tasks)
      if (isZonalManager) {
        const empRes = await fetch(`${API_BASE_URL}/api/employees`, { headers });
        const empData = await empRes.json();
        if (empRes.ok) {
          // Filter only active employees
          const activeEmployees = empData.filter(e => e.status === 'Active');
          setEmployees(activeEmployees);
        }
      }
    } catch (err) {
      console.error('Error fetching tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setStartDate('');
    setEndDate('');
    setStatus('To Do');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
    
    // Format dates to YYYY-MM-DD for date input
    const formatInputDate = (d) => {
      if (!d) return '';
      const date = new Date(d);
      return date.toISOString().split('T')[0];
    };
    setStartDate(formatInputDate(task.startDate));
    setEndDate(formatInputDate(task.endDate));
    setStatus(task.status);
    
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      title,
      description,
      assignedTo,
      startDate,
      endDate,
      status,
    };

    try {
      const url = editingTask ? `${API_BASE_URL}/api/tasks/${editingTask._id}` : `${API_BASE_URL}/api/tasks`;
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingTask ? 'Task updated!' : 'Task created and assigned!');
        fetchData();
        setTimeout(() => setModalOpen(false), 1200);
      } else {
        setError(data.message || 'Action failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete task');
      }
    } catch (err) {
      alert('Network error. Failed to delete.');
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Check if user has permission to update this task
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const isAssignee = task.assignedTo?._id === user._id || task.assignedTo === user._id;
    if (!isAssignee && !isZonalManager) {
      alert('You can only update tasks assigned to you.');
      return;
    }

    // Optimistically update status on frontend
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to update status');
        fetchData(); // Rollback on failure
      }
    } catch (err) {
      alert('Network error. Status rollback.');
      fetchData();
    }
  };

  // Status cycling for mobile/click users
  const cycleStatus = async (task) => {
    const isAssignee = task.assignedTo?._id === user._id || task.assignedTo === user._id;
    if (!isAssignee && !isZonalManager) {
      alert('You can only update tasks assigned to you.');
      return;
    }

    let nextStatus = 'To Do';
    if (task.status === 'To Do') nextStatus = 'In Progress';
    else if (task.status === 'In Progress') nextStatus = 'Done';

    // Optimistically update
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: nextStatus } : t));

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        fetchData(); // Rollback
      }
    } catch (err) {
      fetchData();
    }
  };

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  const renderColumn = (columnTitle, columnTasks, statusValue) => {
    return (
      <div 
        className="kanban-column"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, statusValue)}
      >
        <div className="column-header">
          <div className="column-title">
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: 
                statusValue === 'To Do' ? 'var(--color-info)' : 
                statusValue === 'In Progress' ? 'var(--color-warning)' : 'var(--color-success)'
            }}></span>
            <h3>{columnTitle}</h3>
          </div>
          <span className="column-count">{columnTasks.length}</span>
        </div>

        <div className="kanban-tasks">
          {columnTasks.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--border-radius-sm)', minHeight: '120px' }}>
              Drop tasks here
            </div>
          ) : (
            columnTasks.map(task => {
              const isAssignee = task.assignedTo?._id === user._id || task.assignedTo === user._id;
              const canEditStatus = isAssignee || isZonalManager;

              return (
                <div 
                  key={task._id} 
                  className="task-card"
                  draggable={canEditStatus}
                  onDragStart={(e) => handleDragStart(e, task._id)}
                  style={{ opacity: task.assignedTo?.status === 'Inactive' ? 0.6 : 1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 className="task-card-title">{task.title}</h4>
                    {isZonalManager && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          style={{ padding: '0.2rem' }}
                          onClick={() => openEditModal(task)}
                          title="Edit Task"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          style={{ padding: '0.2rem', color: 'var(--color-error)' }}
                          onClick={() => handleDelete(task._id)}
                          title="Delete Task"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="task-card-desc">{task.description || 'No description provided.'}</p>

                  <div className="task-card-meta">
                    <div className="task-card-assignee">
                      <User size={12} />
                      <span>{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    {canEditStatus && task.status !== 'Done' && (
                      <button 
                        onClick={() => cycleStatus(task)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--brand-aia-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.1rem', fontWeight: 600, fontSize: '0.75rem' }}
                        title="Move to Next Column"
                      >
                        <span>Move</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <Calendar size={10} />
                    <span>{new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="header-action">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Task Board</h1>
          <p>DevOps-style workflow task assignment and progress tracking.</p>
        </div>
        {isZonalManager && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ marginTop: '2rem' }}>Loading task board...</p>
      ) : (
        <div className="kanban-board">
          {renderColumn('To Do', todoTasks, 'To Do')}
          {renderColumn('In Progress', inProgressTasks, 'In Progress')}
          {renderColumn('Completed', doneTasks, 'Done')}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task Details' : 'Create New Zonal Task'}</h2>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setModalOpen(false)}
                style={{ borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Task Title</label>
                <input 
                  type="text" 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  disabled={!isZonalManager}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Task Description</label>
                <textarea 
                  id="description" 
                  rows="3"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  disabled={!isZonalManager}
                ></textarea>
              </div>

              {isZonalManager ? (
                <div className="form-group">
                  <label htmlFor="assignedTo">Assign To Employee</label>
                  <select 
                    id="assignedTo" 
                    value={assignedTo} 
                    onChange={e => setAssignedTo(e.target.value)}
                    required
                  >
                    <option value="">-- Select Team Member --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.position})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Assignee</label>
                  <input type="text" value={editingTask?.assignedTo?.name || ''} disabled />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input 
                    type="date" 
                    id="startDate" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    required 
                    disabled={!isZonalManager}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input 
                    type="date" 
                    id="endDate" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    required 
                    disabled={!isZonalManager}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="status">Task Status</label>
                <select 
                  id="status" 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}
              >
                {editingTask ? 'Save Changes' : 'Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
