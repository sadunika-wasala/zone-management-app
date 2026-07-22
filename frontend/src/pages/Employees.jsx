import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Edit2, ShieldAlert, Check, X } from 'lucide-react';

const Employees = () => {
  const { user, isZonalManager } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [branchManagers, setBranchManagers] = useState([]);
  const [unitLeaders, setUnitLeaders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Form Fields State
  const [nic, setNic] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState('Advisor');
  const [manager, setManager] = useState('');
  const [leader, setLeader] = useState('');
  const [status, setStatus] = useState('Active');

  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { headers });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data);
        
        // Filter down active roles for the dropdown lists
        const activeBms = data.filter(e => e.position === 'Branch Manager' && e.status === 'Active');
        const activeUls = data.filter(e => e.position === 'Unit Leader' && e.status === 'Active');
        
        setBranchManagers(activeBms);
        setUnitLeaders(activeUls);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setNic('');
    setName('');
    setEmail('');
    setPassword('');
    setTelephone('');
    setAddress('');
    setPosition('Advisor');
    setManager('');
    setLeader('');
    setStatus('Active');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setNic(emp.nic);
    setName(emp.name);
    setEmail(emp.email);
    setPassword(''); // Leave password empty unless updating
    setTelephone(emp.telephone);
    setAddress(emp.address);
    setPosition(emp.position);
    setManager(emp.manager?._id || emp.manager || '');
    setLeader(emp.leader?._id || emp.leader || '');
    setStatus(emp.status);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (position === 'Advisor' && (!manager || !leader)) {
      setError('Advisors must be assigned a Unit Leader and Branch Manager.');
      return;
    }
    if (position === 'Unit Leader' && !manager) {
      setError('Unit Leaders must be assigned a Branch Manager.');
      return;
    }

    const payload = {
      nic,
      name,
      email,
      telephone,
      address,
      position,
      status,
      manager: (position === 'Advisor' || position === 'Unit Leader') ? manager : null,
      leader: position === 'Advisor' ? leader : null,
    };

    // Only add password if editing with a new password, or creating
    if (!editingEmployee || password) {
      if (!editingEmployee && !password) {
        setError('Password is required for new employees.');
        return;
      }
      payload.password = password;
    }

    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee._id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!');
        fetchEmployees();
        setTimeout(() => setModalOpen(false), 1200);
      } else {
        setError(data.message || 'Action failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div>
      <div className="header-action">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Employees</h1>
          <p>View and manage the insurance team organizational directory.</p>
        </div>
        {isZonalManager && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <UserPlus size={18} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ marginTop: '2rem' }}>Loading employees...</p>
      ) : (
        <div className="table-container glass-panel">
          <table className="custom-table">
            <thead>
              <tr>
                <th>NIC</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Reports To</th>
                <th>Status</th>
                {isZonalManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={isZonalManager ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp._id}>
                    <td>{emp.nic}</td>
                    <td style={{ fontWeight: '600' }}>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.telephone}</td>
                    <td>
                      <span className={`badge ${
                        emp.position === 'Zonal Manager' ? 'badge-danger' : 
                        emp.position === 'Branch Manager' ? 'badge-info' : 
                        emp.position === 'Unit Leader' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {emp.position}
                      </span>
                    </td>
                    <td>
                      {emp.position === 'Advisor' && emp.leader ? (
                        <div style={{ fontSize: '0.85rem' }}>
                          Leader: <strong>{emp.leader.name}</strong>
                          <br />
                          Manager: <strong>{emp.manager?.name}</strong>
                        </div>
                      ) : emp.position === 'Unit Leader' && emp.manager ? (
                        <div style={{ fontSize: '0.85rem' }}>
                          Manager: <strong>{emp.manager.name}</strong>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Direct / None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {emp.status}
                      </span>
                    </td>
                    {isZonalManager && (
                      <td>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          onClick={() => openEditModal(emp)}
                          title="Edit Employee"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>{editingEmployee ? 'Edit Employee Profile' : 'Create Employee Account'}</h2>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="nic">NIC Number</label>
                  <input 
                    type="text" 
                    id="nic" 
                    value={nic} 
                    onChange={e => setNic(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password {editingEmployee && '(leave blank to keep current)'}</label>
                  <input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required={!editingEmployee} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="telephone">Telephone Number</label>
                  <input 
                    type="tel" 
                    id="telephone" 
                    value={telephone} 
                    onChange={e => setTelephone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="position">Position Role</label>
                  <select 
                    id="position" 
                    value={position} 
                    onChange={e => setPosition(e.target.value)}
                  >
                    <option value="Advisor">Advisor</option>
                    <option value="Unit Leader">Unit Leader</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Zonal Manager">Zonal Manager</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Home Address</label>
                <textarea 
                  id="address" 
                  rows="2" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  required
                ></textarea>
              </div>

              {/* Hierarchy Assignment Dropdowns */}
              {position === 'Advisor' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="manager">Branch Manager</label>
                    <select 
                      id="manager" 
                      value={manager} 
                      onChange={e => setManager(e.target.value)}
                      required
                    >
                      <option value="">-- Select Manager --</option>
                      {branchManagers.map(bm => (
                        <option key={bm._id} value={bm._id}>{bm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="leader">Unit Leader</label>
                    <select 
                      id="leader" 
                      value={leader} 
                      onChange={e => setLeader(e.target.value)}
                      required
                    >
                      <option value="">-- Select Leader --</option>
                      {unitLeaders.map(ul => (
                        <option key={ul._id} value={ul._id}>{ul.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {position === 'Unit Leader' && (
                <div className="form-group">
                  <label htmlFor="manager">Branch Manager</label>
                  <select 
                    id="manager" 
                    value={manager} 
                    onChange={e => setManager(e.target.value)}
                    required
                  >
                    <option value="">-- Select Manager --</option>
                    {branchManagers.map(bm => (
                      <option key={bm._id} value={bm._id}>{bm.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingEmployee && (
                <div className="form-group">
                  <label htmlFor="status">Account Status</label>
                  <select 
                    id="status" 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive (Disable Login)</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}
              >
                {editingEmployee ? 'Update Profile' : 'Register Employee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
