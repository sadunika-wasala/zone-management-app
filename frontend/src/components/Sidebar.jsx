import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  KanbanSquare, 
  LogOut, 
  ShieldAlert,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={closeSidebar}></div>
      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={28} color="#e11b22" />
            <span className="logo-text">AIA Zonal</span>
          </div>
          <button className="btn-icon mobile-only" onClick={closeSidebar} style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none' }}>
            <X size={24} />
          </button>
        </div>

      <nav style={{ flex: 1 }}>
        <ul className="sidebar-menu">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/employees" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <Users size={20} />
              <span>Employees</span>
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/customers" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <UserSquare2 size={20} />
              <span>Customers</span>
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/tasks" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <KanbanSquare size={20} />
              <span>Task Board</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{user.position}</span>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
