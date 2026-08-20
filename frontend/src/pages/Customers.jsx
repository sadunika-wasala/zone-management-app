import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { API_BASE_URL } from '../api'; // Adjust relative import path if needed

const Customers = () => {
  const { user, isZonalManager } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [advisors, setEmployeeListUnderUser] = useState([]);
  
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
  const [policyStartDate, setPolicyStartDate] = useState('');
  const [policyType, setPolicyType] = useState('Health Plan');
  const [paymentFrequency, setPaymentFrequency] = useState('Monthly');
  const [assignedAdvisor, setAssignedAdvisor] = useState('');

  // Filtering State
  const [filterPolicyType, setFilterPolicyType] = useState('');
  const [filterPaymentFrequency, setFilterPaymentFrequency] = useState('');
  const [filterRegistrationMonth, setFilterRegistrationMonth] = useState('');
  const [filterOwnerAgent, setFilterOwnerAgent] = useState('');

  //Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      
        console.error('user.position ', user.position);
        const empRes = await fetch(`${API_BASE_URL}/api/employees`, { headers });
        const empData = await empRes.json();
        console.error('usempData ', empData);
        if (empRes.ok) {
          if(user.position == 'Zonal Manager'){
            setEmployeeListUnderUser(empData);
          }
          
          if (user.position === 'Branch Manager') {
            const activeMembers = empData.filter(e => {
              // Check if e.manager is populated object OR a direct string ID
              const managerId = e.manager?._id || e.manager;
              return managerId === user._id && e.status === 'Active';
            });
          
            console.log('activeMembers ', activeMembers);
          
            const isUserIncluded = activeMembers.some(e => e._id === user._id);
            setEmployeeListUnderUser(isUserIncluded ? activeMembers : [user, ...activeMembers]);
          }

          if (user.position === 'Unit Leader') {
            const activeMembers = empData.filter(e => {
              // Check if e.manager is populated object OR a direct string ID
              const leaderId = e.leader?._id || e.leader;
              return leaderId === user._id && e.status === 'Active';
            });
            const isUserIncluded = activeMembers.some(e => e._id === user._id);
            
            setEmployeeListUnderUser(isUserIncluded ? activeMembers : [user, ...activeMembers]);
          }

          if (user.position === 'Advisor') {
            setEmployeeListUnderUser([user]);
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

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPolicyType, filterPaymentFrequency, filterRegistrationMonth, filterOwnerAgent]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setNic('');
    setName('');
    setAddress('');
    setPolicyAmount('');
    setPolicyStartDate(new Date().toISOString().split('T')[0]);
    setPolicyType('Health Plan');
    setPaymentFrequency('Monthly');
    setAssignedAdvisor('');
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
    setPolicyStartDate(cust.policyStartDate ? new Date(cust.policyStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setPolicyType(cust.policyType || 'Health Plan');
    setPaymentFrequency(cust.paymentFrequency || 'Monthly');
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
      policyStartDate,
      policyType,
      paymentFrequency,
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
        const msg = editingCustomer ? 'Customer policy updated successfully!' : 'Customer policy registered successfully!';
        setSuccess(msg);
        alert(msg); // Give clear browser alert as requested
        fetchData();
        setModalOpen(false); // Close immediately on success
      } else {
        const errMsg = data.message || 'Action failed';
        setError(errMsg);
        alert(`Error: ${errMsg}`); // Show error clearly
      }
    } catch (err) {
      setError('Network error. Please try again.');
      alert('Network error. Please try again.');
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
      maximumFractionDigits: 2, // Changed from 0 to 2 to show cents
    }).format(amount);
  };

  
  const filteredCustomers = customers.filter(cust => {
    let matchType = true;
    let matchPayment = true;
    let matchMonth = true;
    let matchAgent = true;

    if (filterPolicyType) {
      matchType = cust.policyType === filterPolicyType;
    }
    if (filterPaymentFrequency) {
      matchPayment = cust.paymentFrequency === filterPaymentFrequency;
    }
    if (filterRegistrationMonth) {
      const custDate = new Date(cust.policyStartDate);
      const custMonthStr = `${custDate.getFullYear()}-${String(custDate.getMonth() + 1).padStart(2, '0')}`;
      matchMonth = custMonthStr === filterRegistrationMonth;
    }
    if (filterOwnerAgent) {
      console.error('filterOwnerAgent ', filterOwnerAgent);
      matchAgent = cust.assignedAdvisor._id === filterOwnerAgent;
      console.error('matchAgent ', matchAgent);
      console.error('cust ', cust);
      console.error('cust.assignedAdvisor ', cust.assignedAdvisor);
    }
    return matchType && matchPayment && matchMonth && matchAgent;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate total policy valuation for filtered customers
const totalPolicyValuation = filteredCustomers.reduce(
  (sum, cust) => sum + (Number(cust.policyAmount) || 0), 
  0
);

  return (
    <div>
      <div className="header-action" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div className="page-header" style={{ marginBottom: 0 }}>
    <h1>Customers</h1>
    <p>Register and view customer policy details sold by the team.</p>
  </div>
  
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    {/* Total Valuation Tag */}
    <div 
      className="glass-panel" 
      style={{ 
        padding: '0.5rem 1rem', 
        borderRadius: '8px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-end',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Total Policy Value
      </span>
      <strong style={{ fontSize: '1.1rem', color: 'var(--brand-aia-blue)' }}>
        {formatLKR(totalPolicyValuation)}
      </strong>
    </div>

    {/* New Customer Button */}
    <button className="btn btn-primary" onClick={openCreateModal}>
      <Plus size={16} />
      <span>New Customer</span>
    </button>
  </div>
</div>

      <div className="filters-container glass-panel" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Agent who sold the policy:</label>
          <select value={filterOwnerAgent} onChange={e => setFilterOwnerAgent(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', minWidth: '150px' }}>
          <option value="">All Agents</option>
            {advisors.map(agent => (
              <option key={agent._id} value={agent._id}>
                {agent.name} {agent._id === user._id ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Policy Type:</label>
          <select value={filterPolicyType} onChange={e => setFilterPolicyType(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', minWidth: '150px' }}>
            <option value="">All Types</option>
            <option value="Health Plan">Health Plan</option>
            <option value="Retirement Plan">Retirement Plan</option>
            <option value="Education Plan">Education Plan</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Payment Freq:</label>
          <select value={filterPaymentFrequency} onChange={e => setFilterPaymentFrequency(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', minWidth: '150px' }}>
            <option value="">All Frequencies</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Reg. Month:</label>
          <input 
            type="month" 
            value={filterRegistrationMonth} 
            onChange={e => setFilterRegistrationMonth(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px' }}
          />
        </div>

        {(filterPolicyType || filterPaymentFrequency || filterRegistrationMonth || filterOwnerAgent) && (
          <button 
            className="btn btn-secondary" 
            onClick={() => { setFilterPolicyType(''); setFilterPaymentFrequency(''); setFilterRegistrationMonth(''); setFilterOwnerAgent('');}}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ marginTop: '2rem' }}>Loading customers...</p>
      ) : (
        <div className="table-container glass-panel">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Type of Policy</th>
                <th>Payment Freq.</th>
                <th>Policy Val.</th>
                <th>Sold By (Advisor)</th>
                <th>Policy Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {currentCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customer records accessible or matching filters.
                </td>
              </tr>
              ) : (
                currentCustomers.map(cust => (
                  <tr key={cust._id}>
                    <td style={{ fontWeight: '600' }}>{cust.name}</td>
                    <td>{cust.address}</td>
                    <td>{cust.policyType || 'N/A'}</td>
                    <td>{cust.paymentFrequency || 'N/A'}</td>
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
                    <td>{new Date(cust.policyStartDate).toLocaleDateString()}</td>
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
        {/* Pagination Bar */}
  {filteredCustomers.length > itemsPerPage && (
    <div 
      className="pagination-container" 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem', 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
      </span>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        >
          Previous
        </button>

        <span style={{ fontSize: '0.85rem', fontWeight: '600', padding: '0 0.5rem' }}>
          {currentPage} / {totalPages}
        </span>

        <button
          className="btn btn-secondary"
          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        >
          Next
        </button>
      </div>
    </div>
  )}
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
                  step="any"
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="policyStartDate">Policy Started Date</label>
                <input 
                  type="date" 
                  id="policyStartDate" 
                  value={policyStartDate} 
                  onChange={e => setPolicyStartDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="policyType">Type of Policy</label>
                <select 
                  id="policyType" 
                  value={policyType} 
                  onChange={e => setPolicyType(e.target.value)} 
                  required
                >
                  <option value="Health Plan">Health Plan</option>
                  <option value="Retirement Plan">Retirement Plan</option>
                  <option value="Education Plan">Education Plan</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="paymentFrequency">Payment Doing</label>
                <select 
                  id="paymentFrequency" 
                  value={paymentFrequency} 
                  onChange={e => setPaymentFrequency(e.target.value)} 
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
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
