import React from 'react';
import { Scale, UserCircle, Briefcase, GraduationCap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './choix.css';

export default function LoginSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'secretaire',
      titre: 'Secrétaire',
      description: 'Gestion administrative et organisation du cabinet',
      icon: UserCircle,
      path: '/secretaire/dashboard'
    },
    {
      id: 'avocate',
      titre: 'Avocate',
      description: 'Accès complet aux dossiers et consultations',
      icon: Briefcase,
      path: '/avocat/dashboard'
    },
    {
      id: 'stagiaire',
      titre: 'Stagiaire',
      description: 'Formation et assistance juridique',
      icon: GraduationCap,
      path: '/stagiaire/dashboard'
    },
    {
      id: 'client',
      titre: 'Client',
      description: 'Suivi de vos dossiers et rendez-vous',
      icon: Users,
      path: '/client/dashboard'
    }
  ];

  const handleRoleSelection = (path) => {
    navigate(path);
  };

  return (
    <div className="choix-page">
      {/* Header */}
      <header className="choix-header">
        <nav className="choix-nav">
          <div className="choix-nav-inner">
            <div className="choix-logo">
              <Scale className="choix-logo-icon" />
              <span>JuriSHub</span>
            </div>
            <a href="/" className="choix-back-link">
              ← Retour à l'accueil
            </a>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="choix-content">
        <div className="choix-title-section">
          <h1 className="choix-title">Bienvenue sur JuriSHub</h1>
          <p className="choix-subtitle">
            Sélectionnez votre profil pour accéder à votre espace personnel
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="choix-grid">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => handleRoleSelection(role.path)}
                className="choix-card"
              >
                <div className="choix-card-icon">
                  <IconComponent className="choix-icon-svg" />
                </div>
                <h3 className="choix-card-title">{role.titre}</h3>
                <p className="choix-card-desc">{role.description}</p>
                <div className="choix-card-link">Accéder →</div>
              </button>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="choix-info">
          <div className="choix-info-box">
            <p>
              <strong>Besoin d'aide ?</strong> Contactez notre support technique au{' '}
              <span className="choix-bold">+216 71 234 567</span> ou par email à{' '}
              <span className="choix-bold">support@jurishub.tn</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="choix-footer">
        <p>
          &copy; 2026 JuriSHub - Cabinet d'Avocat Maître Ghofrane Hajaij - Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
