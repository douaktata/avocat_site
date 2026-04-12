import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getUser } from '../api';
import {
  LayoutDashboard, Building2, CalendarClock, CalendarDays,
  UserRound, FolderOpen, Users, CheckSquare, MessageSquare,
  UserCircle, LogOut, Menu, X, Scale as ScaleIcon,
} from 'lucide-react';
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

  const close = () => setSidebarActive(false);

  const handleDeconnexion = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
        {/* Logo */}
        <div className="logo">
          <ScaleIcon size={18} className="sidebar-brand-icon" />
          <span className="logo-name">JurisHub</span>
        </div>

        <nav className="nav-container">
          <ul className="nav-links">
            {/* Principal */}
            <div className="nav-section-label">Principal</div>
            <li className="nav-item">
              <NavLink to="/secretaire/dashboard" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <LayoutDashboard size={16} /><span>Tableau de bord</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/bureau" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <Building2 size={16} /><span>Gestion du bureau</span>
              </NavLink>
            </li>

            <div className="nav-divider" />

            {/* Agenda */}
            <div className="nav-section-label">Agenda</div>
            <li className="nav-item">
              <NavLink to="/secretaire/agenda" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <CalendarClock size={16} /><span>Créneaux</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/calendrier" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <CalendarDays size={16} /><span>Calendrier</span>
              </NavLink>
            </li>

            <div className="nav-divider" />

            {/* Répertoire */}
            <div className="nav-section-label">Répertoire</div>
            <li className="nav-item">
              <NavLink to="/secretaire/clients" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <UserRound size={16} /><span>Clients</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/dossiers" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <FolderOpen size={16} /><span>Dossiers</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/staff" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <Users size={16} /><span>Équipe</span>
              </NavLink>
            </li>

            <div className="nav-divider" />

            {/* Outils */}
            <div className="nav-section-label">Outils</div>
            <li className="nav-item">
              <NavLink to="/secretaire/taches" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <CheckSquare size={16} /><span>Tâches</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/messages" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <MessageSquare size={16} /><span>Messagerie</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/secretaire/profile" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={close}>
                <UserCircle size={16} /><span>Mon profil</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {photoUrl
                ? <img src={photoUrl} alt="profil" />
                : <UserCircle size={18} />
              }
            </div>
            <div className="user-info">
              <div className="user-name">{user?.prenom} {user?.nom}</div>
              <div className="user-role">Secrétaire</div>
            </div>
          </div>
          <button className="btn-deconnexion" onClick={handleDeconnexion}>
            <LogOut size={14} /><span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <button className="mobile-toggle" onClick={() => setSidebarActive(!sidebarActive)}>
        {sidebarActive ? <X size={18} /> : <Menu size={18} />}
      </button>

      <main className="main-content">
        <Outlet />
      </main>

      {sidebarActive && (
        <div className="sidebar-overlay" onClick={close} aria-hidden="true" />
      )}
    </div>
  );
};

export default LayoutSecretaire;
