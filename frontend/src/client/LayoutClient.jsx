import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Home, FolderOpen, CalendarCheck, CalendarPlus,
  MessageSquare, Bell, UserCircle, LogOut, Menu, X,
} from 'lucide-react';
import { LogoIcon } from '../components/Logo';
import ChatWidget from '../components/chat/ChatWidget';
import './LayoutClient.css';

const LayoutClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'accueil',           label: 'Accueil',       Icon: Home,          path: '/client/accueil' },
    { id: 'dossiers',          label: 'Mes Dossiers',  Icon: FolderOpen,    path: '/client/dossiers' },
    { id: 'rendez-vous',       label: 'Rendez-vous',   Icon: CalendarCheck, path: '/client/rendez-vous' },
    { id: 'rendez-vous-agenda',label: 'Prendre RDV',   Icon: CalendarPlus,  path: '/client/rendez-vous-agenda' },
    { id: 'messages',          label: 'Messagerie',    Icon: MessageSquare, path: '/client/messages' },
    { id: 'notifications',     label: 'Notifications', Icon: Bell,          path: '/client/notifications' },
    { id: 'profile',           label: 'Mon Profil',    Icon: UserCircle,    path: '/client/profile' },
  ];

  const prenom = user?.prenom || '';
  const nom = user?.nom || '';
  const avatar = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || 'CL';
  const fullName = `${prenom} ${nom}`.trim() || 'Client';

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-client">
      {/* Mobile toggle */}
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar-client ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <LogoIcon size={18} />
            </div>
            <span className="sidebar-logo-text">JurisHub</span>
          </div>
          <div className="sidebar-role-label">Espace Client</div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.Icon size={18} />
              <span className="link-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-avatar">{avatar}</div>
          <div className="user-info">
            <div className="user-name">{fullName}</div>
            <div className="user-role">Client</div>
          </div>
          <button className="logout-btn" title="Se déconnecter" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  );
};

export default LayoutClient;
