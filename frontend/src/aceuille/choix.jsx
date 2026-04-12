import { Scale, UserCircle, Briefcase, GraduationCap, Users, ArrowRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './choix.css';

const roles = [
  {
    id: 'secretaire',
    titre: 'Secrétaire',
    description: 'Gestion administrative et organisation du cabinet',
    icon: UserCircle,
    path: '/secretaire/dashboard',
    accent: 'terracotta',
  },
  {
    id: 'avocate',
    titre: 'Avocate',
    description: 'Accès complet aux dossiers et consultations juridiques',
    icon: Briefcase,
    path: '/avocat/dashboard',
    accent: 'indigo',
  },
  {
    id: 'stagiaire',
    titre: 'Stagiaire',
    description: 'Formation, assistance et suivi des dossiers en cours',
    icon: GraduationCap,
    path: '/stagiaire/dashboard',
    accent: 'violet',
  },
  {
    id: 'client',
    titre: 'Client',
    description: 'Suivi de vos dossiers, rendez-vous et documents',
    icon: Users,
    path: '/client/dashboard',
    accent: 'terracotta',
  },
];

export default function LoginSelection() {
  const navigate = useNavigate();

  return (
    <div className="cx-page">

      {/* ── LEFT BRAND PANEL ── */}
      <aside className="cx-brand">
        <a href="/" className="cx-back">
          <ChevronLeft /> Retour à l'accueil
        </a>

        <div className="cx-brand-body">
          <div className="cx-brand-logo">
            <Scale />
            <span>JuriSHub</span>
          </div>

          <div className="cx-brand-divider" />

          <h2 className="cx-brand-name">Cabinet d'Avocat<br />Maître Ghofrane Hajaij</h2>
          <p className="cx-brand-address">Hammamet Nord · Nabeul · Tunisie</p>

          <ul className="cx-brand-values">
            <li><span className="cx-dot" />Excellence juridique</li>
            <li><span className="cx-dot" />Écoute &amp; proximité</li>
            <li><span className="cx-dot" />Confidentialité absolue</li>
          </ul>
        </div>

        <p className="cx-brand-copy">&copy; 2026 JuriSHub · Tous droits réservés</p>
      </aside>

      {/* ── RIGHT SELECTION PANEL ── */}
      <main className="cx-main">
        <div className="cx-main-inner">
          <div className="cx-tag">Connexion sécurisée</div>
          <h1 className="cx-title">Quel est votre profil ?</h1>
          <div className="cx-accent-bar" />
          <p className="cx-sub">Sélectionnez votre espace pour accéder à la plateforme JuriSHub</p>

          <div className="cx-grid">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => navigate(role.path)}
                  className={`cx-card cx-card--${role.accent}`}
                >
                  <div className="cx-card-icon">
                    <Icon />
                  </div>
                  <div className="cx-card-body">
                    <h3 className="cx-card-title">{role.titre}</h3>
                    <p className="cx-card-desc">{role.description}</p>
                  </div>
                  <div className="cx-card-arrow">
                    <ArrowRight />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="cx-info">
            <p>
              Besoin d'aide ?&ensp;
              <a href="tel:+21672282755">+216 72 282 755</a>
              &ensp;·&ensp;
              <a href="mailto:cabinet.maitre.hajaij@gmail.com">cabinet.maitre.hajaij@gmail.com</a>
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}
