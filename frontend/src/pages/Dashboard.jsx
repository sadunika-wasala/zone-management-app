import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  User,
  Activity
} from 'lucide-react';
import { API_BASE_URL } from '../api'; // Adjust relative import path if needed

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPolicyAmount: 0,
    activeEmployees: 0,
    pendingTasks: 0,
  });
  const [hierarchyData, setHierarchyData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${user.token}`,
        };

        // 1. Fetch Customers
        const custRes = await fetch(`${API_BASE_URL}/api/customers`, { headers });
        const customers = await custRes.json();

        // 2. Fetch Employees
        const empRes = await fetch(`${API_BASE_URL}/api/employees`, { headers });
        const employees = await empRes.json();

        // 3. Fetch Tasks
        const taskRes = await fetch(`${API_BASE_URL}/api/tasks`, { headers });
        const tasksData = await taskRes.json();

        // 4. Fetch Hierarchy Tree
        const treeRes = await fetch(`${API_BASE_URL}/api/employees/hierarchy/tree`, { headers });
        const treeData = await treeRes.json();

        // Calculate statistics
        const activeEmp = employees.filter(e => e.status === 'Active').length;
        const totalPolicy = customers.reduce((sum, c) => sum + (c.policyAmount || 0), 0);
        const openTasks = tasksData.filter(t => t.status !== 'Done').length;

        setStats({
          totalCustomers: customers.length,
          totalPolicyAmount: totalPolicy,
          activeEmployees: activeEmp,
          pendingTasks: openTasks,
        });

        // Filter hierarchy tree based on user's role to only show what they are allowed to see
        let filteredTree = treeData;
        if (user.position === 'Branch Manager') {
          filteredTree = treeData.filter(node => node._id === user._id);
        } else if (user.position === 'Unit Leader') {
          // Flatten to find this leader's tree
          filteredTree = [];
          treeData.forEach(bm => {
            const ul = bm.leaders.find(l => l._id === user._id);
            if (ul) {
              // Wrap leader in a mock node or just return leader hierarchy
              filteredTree.push({
                _id: bm._id,
                name: bm.name,
                position: bm.position,
                leaders: [ul],
                customerCount: ul.customerCount
              });
            }
          });
        } else if (user.position === 'Advisor') {
          filteredTree = [];
          treeData.forEach(bm => {
            bm.leaders.forEach(ul => {
              const adv = ul.advisors.find(a => a._id === user._id);
              if (adv) {
                filteredTree.push({
                  _id: bm._id,
                  name: bm.name,
                  position: bm.position,
                  leaders: [{
                    _id: ul._id,
                    name: ul.name,
                    position: ul.position,
                    advisors: [adv],
                    customerCount: adv.customerCount
                  }],
                  customerCount: adv.customerCount
                });
              }
            });
          });
        }

        setHierarchyData(filteredTree);
        setTasks(tasksData.slice(0, 5)); // Show top 5 tasks
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const formatLKR = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user.name}. Here is your AIA Insurance zonal overview.</p>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Total Customers</span>
            <Users size={20} color="var(--brand-aia-blue)" />
          </div>
          <div className="stat-value">{stats.totalCustomers}</div>
          <div className="stat-desc">Registered policies</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Total Valuations</span>
            <TrendingUp size={20} color="var(--color-success)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{formatLKR(stats.totalPolicyAmount)}</div>
          <div className="stat-desc">Accumulated policy value</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Active Team Members</span>
            <Layers size={20} color="var(--brand-aia-red)" />
          </div>
          <div className="stat-value">{stats.activeEmployees}</div>
          <div className="stat-desc">Zonal hierarchy depth</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Assigned Tasks</span>
            <CheckCircle2 size={20} color="var(--color-warning)" />
          </div>
          <div className="stat-value">{stats.pendingTasks}</div>
          <div className="stat-desc">Remaining active tasks</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Hierarchy Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>Team Organizational Structure</h2>
          <p style={{ marginBottom: '1.5rem' }}>Expand nodes to view leaders, advisors, and customer coverage counts.</p>
          
          <div className="tree-container">
            {hierarchyData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No hierarchy records found.</p>
            ) : (
              hierarchyData.map(bm => {
                const bmExpanded = expandedNodes[bm._id];
                return (
                  <div key={bm._id} className="bm-node">
                    <div className="node-header" onClick={() => toggleNode(bm._id)}>
                      <div className="node-title-group">
                        {bmExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <User size={18} color="var(--brand-aia-red)" />
                        <div>
                          <div className="node-title">{bm.name}</div>
                          <div className="node-subtitle">{bm.position}</div>
                        </div>
                      </div>
                      <div className="node-details">
                        <span className="node-count">{bm.customerCount} Customers</span>
                      </div>
                    </div>

                    {bmExpanded && bm.leaders && (
                      <div className="node-content">
                        {bm.leaders.map(ul => {
                          const ulExpanded = expandedNodes[ul._id];
                          return (
                            <div key={ul._id} className="ul-node">
                              <div className="node-header" onClick={() => toggleNode(ul._id)}>
                                <div className="node-title-group">
                                  {ulExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  <User size={16} color="var(--brand-aia-blue)" />
                                  <div>
                                    <div className="node-title" style={{ fontSize: '0.95rem' }}>{ul.name}</div>
                                    <div className="node-subtitle">Unit Leader</div>
                                  </div>
                                </div>
                                <div className="node-details">
                                  <span className="node-count" style={{ fontSize: '0.75rem' }}>{ul.customerCount} Customers</span>
                                </div>
                              </div>

                              {ulExpanded && ul.advisors && (
                                <div className="adv-node-list">
                                  {ul.advisors.length === 0 ? (
                                    <p style={{ gridColumn: '1/-1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No advisors registered.</p>
                                  ) : (
                                    ul.advisors.map(adv => (
                                      <div key={adv._id} className="adv-card">
                                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{adv.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Advisor</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--brand-aia-blue)', marginTop: '0.25rem' }}>
                                          {adv.customerCount} Customers
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {bm.leaders && bm.leaders.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No unit leaders registered under this Branch Manager.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Task Summary Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>Task Summary</h2>
          <p style={{ marginBottom: '1.5rem' }}>Tasks currently in queue.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks assigned.</p>
            ) : (
              tasks.map(task => {
                let badgeClass = 'badge-warning';
                if (task.status === 'Done') badgeClass = 'badge-success';
                else if (task.status === 'To Do') badgeClass = 'badge-info';

                return (
                  <div key={task._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{task.title}</span>
                      <span className={`badge ${badgeClass}`}>{task.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Assigned to: {task.assignedTo?.name || 'Unassigned'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Activity size={12} />
                      Due by: {new Date(task.endDate).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
