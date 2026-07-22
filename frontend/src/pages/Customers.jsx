import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { API_BASE_URL } from '../api'; // Adjust relative import path if needed

const Customers = () => {
  const { user, isZonalManager } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form Fields State
  const [nic, setNic] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [policyAmount, setPolicyAmount] = useState('');
  const [assignedAdvisor, setAssignedAdvisor] = useState('');

  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  const fetchData = async () => {
    try {
      // Fetch customers (scoped to hierarchy on server)
      const custRes = await fetch(`${API_BASE_URL}/api/customers`, { headers });
      const custData = await custRes.json();
      if (custRes.ok) {
        setCustomers(custData);
      }

      // Fetch advisors for dropdown selection (only needed for managers/leaders)
      if (user.position !== 'Advisor') {
        const empRes = await fetch(`${API_BASE_URL}/api/employees`, { headers });
        const empData = await empRes.json();
        if (empRes.ok) {
          // Filter only active advisors
          const activeAdvisors = empData.filter(
            e => e.position === 'Advisor' && e.status === 'Active'
          );
          setAdvisors(activeAdvisors);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setNic('');
    setName('');
    setAddress('');
    setPolicyAmount('');
    setAssignedAdvisor(user.position === 'Advisor' ? user._id : '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setNic(cust.nic);
    setName(cust.name);
    setAddress(cust.address);
    setPolicyAmount(cust.policyAmount);
    setAssignedAdvisor(cust.assignedAdvisor?._id || cust.assignedAdvisor || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      nic,
      name,
      address,
      policyAmount: parseFloat(policyAmount),
      assignedAdvisor: user.position === 'Advisor' ? user._id : assignedAdvisor,
    };

    if (!payload.assignedAdvisor) {
      setError('Assigned Advisor is required.');
      return;
    }

    try {
      const url = editingCustomer ? `${API_BASE_URL}/api/customers/${editingCustomer._id}` : `${API_BASE_URL}/api/customers`;
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingCustomer ? 'Customer policy updated!' : 'Customer policy registered!');
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
    if (!window.confirm('Are you sure you want to permanently delete this customer record? This action is irreversible.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setCustomers(prev => prev.filter(c => c._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete customer record');
      }
    } catch (err) {
      alert('Network error. Failed to delete.');
    }
  };

  const formatLKR = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <div className="header-action">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Customers</h1>
          <p>Register and view customer policy details sold by the team.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>New Customer</span>
        </button>
      </div>

      {loading ? (
        <p style={{ marginTop: '2rem' }}>Loading customers...</p>
      ) : (
        <div className="table-container glass-panel">
          <table className="custom-table">
            <thead>
              <tr>
                <th>NIC</th>
                <th>Name</th>
                <th>Address</th>
                <th>Policy Val.</th>
                <th>Sold By (Advisor)</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No customer records accessible.
                  </td>
                </tr>
              ) : (
                customers.map(cust => (
                  <tr key={cust._id}>
                    <td>{cust.nic}</td>
                    <td style={{ fontWeight: '600' }}>{cust.name}</td>
                    <td>{cust.address}</td>
                    <td style={{ fontWeight: '600', color: 'var(--brand-aia-blue)' }}>
                      {formatLKR(cust.policyAmount)}
                    </td>
                    <td>
                      <div>
                        <strong>{cust.assignedAdvisor?.name || 'Unassigned'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {cust.assignedAdvisor?.email}
                        </div>
                      </div>
                    </td>
                    <td>{new Date(cust.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          onClick={() => openEditModal(cust)}
                          title="Edit Customer"
                        >
                          <Edit2 size={14} />
                        </button>
                        {isZonalManager && (
                          <button 
                            className="btn btn-danger btn-icon" 
                            onClick={() => handleDelete(cust._id)}
                            title="Delete Customer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
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
              <h2>{editingCustomer ? 'Edit Customer Details' : 'Register New Customer Policy'}</h2>
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
                <label htmlFor="nic">Customer NIC</label>
                <input 
                  type="text" 
                  id="nic" 
                  value={nic} 
                  onChange={e => setNic(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Customer Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input 
                  type="text" 
                  id="address" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="policyAmount">Policy Valuation Amount (LKR)</label>
                <input 
                  type="number" 
                  id="policyAmount" 
                  value={policyAmount} 
                  onChange={e => setPolicyAmount(e.target.value)} 
                  min="0"
                  required 
                />
              </div>

              {/* Advisor Assignment Selection */}
              {user.position !== 'Advisor' ? (
                <div className="form-group">
                  <label htmlFor="assignedAdvisor">Assigned Advisor (Agent who sold the policy)</label>
                  <select 
                    id="assignedAdvisor" 
                    value={assignedAdvisor} 
                    onChange={e => setAssignedAdvisor(e.target.value)}
                    required
                  >
                    <option value="">-- Select Selling Advisor --</option>
                    {advisors.map(adv => (
                      <option key={adv._id} value={adv._id}>{adv.name} ({adv.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ display: 'none' }}>
                  <input type="hidden" value={user._id} />
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}
              >
                {editingCustomer ? 'Save Changes' : 'Register Policy'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
