import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Home, FolderOpen, CalendarDays, CheckSquare,
  FileText, MessageSquare, UserCircle, LogOut, Menu, X,
} from 'lucide-react';
import { LogoIcon } from '../components/Logo';
import './LayoutStagiaire.css';

const API_BASE = 'http://localhost:8081';

const LayoutStagiaire = () => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const { user, logout } = useAuth();

  const photoSrc = user?.photo_url ? `${API_BASE}${user.photo_url}` : null;
  const initials = `${(user?.prenom || '')[0] || ''}${(user?.nom || '')[0] || ''}`.toUpperCase() || 'S';
  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Stagiaire';

  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
        <div className="logo">
          <LogoIcon size={22} className="logo-icon" />
          <span>JurisHub</span>
          <span className="role-badge">Stagiaire</span>
        </div>
        <nav className="nav-container">
          <ul className="nav-links">
            <li><NavLink to="/stagiaire/dashboard" className="nav-link" onClick={() => setSidebarActive(false)}>
              <Home size={18} /><span>Accueil</span>
            </NavLink></li>
            <li><NavLink to="/stagiaire/dossiers" className="nav-link" onClick={() => setSidebarActive(false)}>
              <FolderOpen size={18} /><span>Dossiers</span>
            </NavLink></li>
            <li><NavLink to="/stagiaire/calendrier" className="nav-link" onClick={() => setSidebarActive(false)}>
              <CalendarDays size={18} /><span>Calendrier</span>
            </NavLink></li>
            <li><NavLink to="/stagiaire/taches" className="nav-link" onClick={() => setSidebarActive(false)}>
              <CheckSquare size={18} /><span>Tâches</span>
            </NavLink></li>
            <li><NavLink to="/stagiaire/documents" className="nav-link" onClick={() => setSidebarActive(false)}>
              <FileText size={18} /><span>Documents</span>
            </NavLink></li>
            <li><NavLink to="/stagiaire/messages" className="nav-link" onClick={() => setSidebarActive(false)}>
              <MessageSquare size={18} /><span>Messagerie</span>
            </NavLink></li>
            <li><NavLink to="/stagiaire/profile" className="nav-link" onClick={() => setSidebarActive(false)}>
              <UserCircle size={18} /><span>Mon Profil</span>
            </NavLink></li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photoSrc
                ? <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                : <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{initials}</span>}
            </div>
            <div className="user-info">
              <div className="user-name">{fullName}</div>
              <div className="user-role">En formation</div>
            </div>
          </div>
          <button className="btn-deconnexion" onClick={logout}>
            <LogOut size={16} /><span>Déconnexion</span>
          </button>
        </div>
      </aside>
      <button className="mobile-toggle" onClick={() => setSidebarActive(!sidebarActive)}>
        {sidebarActive ? <X size={20} /> : <Menu size={20} />}
      </button>
      <main className="main-content"><Outlet /></main>
      {sidebarActive && <div className="sidebar-overlay" onClick={() => setSidebarActive(false)} aria-hidden="true" />}
    </div>
  );
};

export default LayoutStagiaire;
