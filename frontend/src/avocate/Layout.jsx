import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Home, CalendarDays, Clock, Calendar, Handshake,
  Search, Users, FolderOpen, FileText, Building2, BookOpen,
  CheckSquare, GraduationCap, CheckCircle, Key, Landmark,
  MessageSquare, TrendingUp, UserCircle, Briefcase, LogOut,
  ChevronDown, X, Menu,
} from 'lucide-react';
import { LogoIcon } from '../components/Logo';
import './Layout.css';

const Layout = () => {
  const { logout } = useAuth();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isDropdownActive = (paths) => paths.some(p => location.pathname.startsWith(p));

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeSidebar = () => setSidebarActive(false);

  const navStructure = [
    {
      type: 'link',
      path: '/avocat/dashboard',
      icon: Home,
      label: 'Accueil',
    },
    {
      type: 'dropdown',
      name: 'agenda',
      icon: CalendarDays,
      label: 'Gestion Agenda',
      children: [
        { path: '/avocat/agendaav',            icon: Clock,      label: 'Créneaux' },
        { path: '/avocat/calendrier',           icon: Calendar,   label: 'Calendrier' },
        { path: '/avocat/DemandesRendezVous',   icon: Handshake,  label: 'Demande de rendez-vous' },
      ],
    },
    {
      type: 'dropdown',
      name: 'recherche',
      icon: Search,
      label: 'Recherche',
      children: [
        { path: '/avocat/clients',    icon: Users,       label: 'Clients' },
        { path: '/avocat/membre',     icon: Users,       label: 'Membres' },
        { path: '/avocat/affjud',     icon: FolderOpen,  label: 'Dossiers' },
      ],
    },
    {
      type: 'dropdown',
      name: 'facturation',
      icon: FileText,
      label: 'Facturation',
      children: [
        { path: '/avocat/factures',   icon: FileText,  label: 'Factures' },
      ],
    },
    {
      type: 'dropdown',
      name: 'bureau',
      icon: Building2,
      label: 'Gestion du bureau',
      children: [
        { path: '/avocat/gestion', icon: BookOpen,    label: 'Journal' },
        { path: '/avocat/tdl',     icon: CheckSquare, label: 'Tâches' },
      ],
    },
    {
      type: 'dropdown',
      name: 'stagiaire',
      icon: GraduationCap,
      label: 'Stagiaire',
      children: [
        { path: '/avocat/validation-travaux', icon: CheckCircle, label: 'Validation' },
        { path: '/avocat/gestion-acces',      icon: Key,         label: 'Autorisation et accès' },
      ],
    },
    {
      type: 'link',
      path: '/avocat/tribunaux',
      icon: Landmark,
      label: 'Tribunaux',
    },
    {
      type: 'link',
      path: '/avocat/msg',
      icon: MessageSquare,
      label: 'Messagerie',
    },
    {
      type: 'link',
      path: '/avocat/stat',
      icon: TrendingUp,
      label: 'Statistiques',
    },
    {
      type: 'link',
      path: '/avocat/profile',
      icon: UserCircle,
      label: 'Mon Profil',
    },
  ];

  return (
    <div className="app-container">

      {/* ── Overlay mobile ── */}
      {sidebarActive && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>

        {/* Logo */}
        <div className="logo">
          <Link to="/avocat/dashboard" onClick={closeSidebar}>
            <LogoIcon size={24} className="logo-icon" />
            <span>JurisHub</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="nav-container">
          <ul className="nav-links">
            {navStructure.map((item) => {

              if (item.type === 'link') {
                const Icon = item.icon;
                return (
                  <li key={item.path} className="nav-item">
                    <Link
                      to={item.path}
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      onClick={closeSidebar}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              }

              const childPaths = item.children.map(c => c.path);
              const dropdownActive = isDropdownActive(childPaths);
              const isOpen = openDropdown === item.name || dropdownActive;
              const DropIcon = item.icon;

              return (
                <li key={item.name} className={`nav-item has-dropdown ${isOpen ? 'dropdown-open' : ''}`}>
                  <button
                    className={`nav-link dropdown-toggle ${dropdownActive ? 'active' : ''}`}
                    onClick={() => toggleDropdown(item.name)}
                  >
                    <DropIcon size={18} />
                    <span>{item.label}</span>
                    <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="dropdown-content">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={isActive(child.path) ? 'active' : ''}
                            onClick={closeSidebar}
                          >
                            <ChildIcon size={16} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <Briefcase size={20} />
            </div>
            <div className="user-info">
              <div className="user-name">Maître Hajaij</div>
              <div className="user-role">Avocate</div>
            </div>
          </div>
          <button className="btn-deconnexion" onClick={logout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Mobile Toggle ── */}
      <button
        className="floating-btn"
        onClick={() => setSidebarActive(!sidebarActive)}
        aria-label="Toggle Menu"
      >
        {sidebarActive ? <X size={22} /> : <Menu size={22} />}
      </button>

    </div>
  );
};

export default Layout;