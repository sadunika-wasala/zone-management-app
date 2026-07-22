import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  KanbanSquare, 
  LogOut, 
  ShieldAlert 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo">
        <ShieldAlert size={28} color="#e11b22" />
        <span className="logo-text">AIA Zonal</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="sidebar-menu">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/employees" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Employees</span>
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/customers" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <UserSquare2 size={20} />
              <span>Customers</span>
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/tasks" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
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
  );
};

export default Sidebar;
