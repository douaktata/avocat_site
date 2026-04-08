import { useAuth } from '../AuthContext';
import BackgroundCircles from '../components/BackgroundCircles';
import Logo from '../components/Logo';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];

  return (
    <div className="dashboard-layout">
      <BackgroundCircles />
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <Logo />
        <p className="welcome-text">
          Bienvenue, <span>{user.prenom} {user.nom}</span>
        </p>

        <div>
          {roles.map((role) => (
            <span key={role} className="role-badge">{role}</span>
          ))}
        </div>

        <div className="info-card">
          <div className="info-row">
            <span className="label">Email</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Statut</span>
            <span className="value" style={{ color: '#86efac' }}>Connecté</span>
          </div>
          <div className="token-section">
            <strong style={{ color: 'rgba(255,255,255,0.55)' }}>JWT Token:</strong><br />
            {user.token}
          </div>
        </div>

        <button className="btn-logout" onClick={logout}>Se déconnecter</button>
      </div>
    </div>
  );
}
