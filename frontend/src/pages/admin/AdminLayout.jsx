import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Logo from '../../components/Logo';
import './Admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menu = [
    { path: '/admin', label: 'Tableau de bord', icon: 'fa-chart-line' },
    { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'fa-users' },
    { path: '/admin/dossiers', label: 'Tous les dossiers', icon: 'fa-folder-open' },
    { path: '/admin/comptabilite', label: 'Comptabilité', icon: 'fa-calculator' },
    { path: '/admin/parametres', label: 'Paramètres', icon: 'fa-cog' },
  ];

  return (
    <div className="admin-container">
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Logo />
            {sidebarOpen && <span>JurisHub Admin</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menu.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <i className={`fas ${item.icon}`}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-block">
            <div className="user-avatar">{`${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()}</div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">{user.prenom} {user.nom}</div>
                <div className="user-role">ADMINISTRATEUR</div>
              </div>
            )}
          </div>
          <button className="btn-logout" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
