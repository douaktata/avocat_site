import { useAuth } from '../AuthContext';
import BackgroundCircles from '../components/BackgroundCircles';
import Logo from '../components/Logo';

export default function ClientDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <BackgroundCircles />
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <Logo />
        <p className="welcome-text">
          Bienvenue, <span>{user.prenom} {user.nom}</span>
        </p>
        <span className="role-badge">CLIENT</span>

        <div className="info-card" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
          <div className="info-row">
            <span className="label">Email</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Statut</span>
            <span className="value" style={{ color: '#86efac' }}>Connecté</span>
          </div>
        </div>

        <div className="info-card" style={{ textAlign: 'left', marginTop: '1rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem', fontWeight: 600 }}>
            Mon espace
          </p>
          {['Mes dossiers', 'Mes rendez-vous', 'Mes documents', 'Mes paiements'].map((item) => (
            <div key={item} className="info-row" style={{ cursor: 'pointer' }}>
              <span className="value">→ {item}</span>
            </div>
          ))}
        </div>

        <button className="btn-logout" onClick={logout}>Se déconnecter</button>
      </div>
    </div>
  );
}
