import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getUser } from '../api';
import {
  Home, Building2, CalendarCheck, CalendarDays, Layers,
  Search, User, FolderOpen, Users, CheckSquare, Mail,
  UserCircle, Briefcase, LogOut, Menu, X,
} from 'lucide-react';
import { LogoIcon } from '../components/Logo';
import './LayoutSecretaire.css';

const API_BASE = 'http://localhost:8081';

const LayoutSecretaire = () => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.idu) {
      getUser(user.idu)
        .then(r => { if (r.data?.photo_url) setPhotoUrl(`${API_BASE}${r.data.photo_url}`); })
        .catch(() => {});
    }
  }, [user?.idu]);

  const handleDeconnexion = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
        <div className="logo">
          <LogoIcon size={22} className="logo-icon" />
          <span>JurisHub</span>
          <span className="role-badge">Secrétaire</span>
        </div>

        <nav className="nav-container">
          <ul className="nav-links">
            <li className="nav-item">
              <NavLink to="/secretaire/dashboard" className="nav-link" onClick={() => setSidebarActive(false)}>
                <Home size={18} /><span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/bureau" className="nav-link" onClick={() => setSidebarActive(false)}>
                <Building2 size={18} /><span>Gestion du bureau</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/agenda" className="nav-link" onClick={() => setSidebarActive(false)}>
                <CalendarCheck size={18} /><span>Créneaux</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/calendrier" className="nav-link" onClick={() => setSidebarActive(false)}>
                <CalendarDays size={18} /><span>Calendrier</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/agenda-partage" className="nav-link" onClick={() => setSidebarActive(false)}>
                <Layers size={18} /><span>Agenda Partagé</span>
              </NavLink>
            </li>
            <li className="nav-item nav-parent">
              <NavLink to="/secretaire/recherche" className="nav-link" onClick={() => setSidebarActive(false)}>
                <Search size={18} /><span>Recherche</span>
              </NavLink>
              <ul className="nav-sublinks">
                <li>
                  <NavLink to="/secretaire/clients" className="nav-link" onClick={() => setSidebarActive(false)}>
                    <User size={16} /><span>Clients</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/secretaire/dossiers" className="nav-link" onClick={() => setSidebarActive(false)}>
                    <FolderOpen size={16} /><span>Dossiers</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/secretaire/staff" className="nav-link" onClick={() => setSidebarActive(false)}>
                    <Users size={16} /><span>Équipe</span>
                  </NavLink>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/taches" className="nav-link" onClick={() => setSidebarActive(false)}>
                <CheckSquare size={18} /><span>To-Do Liste</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/messages" className="nav-link" onClick={() => setSidebarActive(false)}>
                <Mail size={18} /><span>Messagerie</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/profile" className="nav-link" onClick={() => setSidebarActive(false)}>
                <UserCircle size={18} /><span>Mon Profil</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photoUrl
                ? <img src={photoUrl} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                : <Briefcase size={18} />
              }
            </div>
            <div className="user-info">
              <div className="user-name">{user?.prenom} {user?.nom}</div>
              <div className="user-role">Secrétaire</div>
            </div>
          </div>
          <button className="btn-deconnexion" onClick={handleDeconnexion}>
            <LogOut size={16} /><span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button className="mobile-toggle" onClick={() => setSidebarActive(!sidebarActive)}>
        {sidebarActive ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Sidebar Overlay */}
      {sidebarActive && (
        <div className="sidebar-overlay" onClick={() => setSidebarActive(false)} aria-hidden="true" />
      )}
    </div>
  );
};

export default LayoutSecretaire;
