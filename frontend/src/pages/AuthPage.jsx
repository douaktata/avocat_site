import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { login, register, forgotPassword } from '../api';
import BackgroundCircles from '../components/BackgroundCircles';
import Logo from '../components/Logo';
import DatePicker from '../components/DatePicker';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { loginUser } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Register state
  const [regForm, setRegForm] = useState({
    nom: '', prenom: '', email: '', password: '',
    tel: '', CIN: '', adresse: '', date_naissance: '',
  });

  const switchTab = (t) => {
    setTab(t);
    setMessage(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { data } = await login(loginEmail, loginPassword);
      loginUser(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await register({
        ...regForm,
        date_naissance: regForm.date_naissance || null,
      });
      setMessage({ type: 'success', text: 'Inscription réussie ! Vous pouvez vous connecter.' });
      setTimeout(() => switchTab('login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'inscription";
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const updateReg = (field, value) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { data } = await forgotPassword(forgotEmail);
      setMessage({ type: 'success', text: data.message });
      setShowForgot(false);
      setForgotEmail('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la réinitialisation';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <BackgroundCircles />
      <div className="glass-card">
        <Logo />
        <h1 className="app-title">JurisHub</h1>
        <p className="app-subtitle">Cabinet d'Avocats - Plateforme de Gestion</p>

        <div className="tabs">
          <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
            Connexion
          </button>
          <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
            Inscription
          </button>
        </div>

        {tab === 'login' && !showForgot && (
          <form onSubmit={handleLogin} className="form-enter" key="login">
            <div className="form-group">
              <label>Email</label>
              <input type="email" required placeholder="votre@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input type="password" required placeholder="Votre mot de passe" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.875rem' }}>
              <button type="button" onClick={() => { setShowForgot(true); setMessage(null); }}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }}>
                Mot de passe oublié ?
              </button>
            </p>
          </form>
        )}

        {tab === 'login' && showForgot && (
          <form onSubmit={handleForgotPassword} className="form-enter" key="forgot">
            <p style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#64748b' }}>
              Entrez votre email pour recevoir un nouveau mot de passe temporaire.
            </p>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required placeholder="votre@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Envoi...' : 'Envoyer le nouveau mot de passe'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.875rem' }}>
              <button type="button" onClick={() => { setShowForgot(false); setMessage(null); }}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }}>
                ← Retour à la connexion
              </button>
            </p>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="form-enter" key="register">
            <div className="row">
              <div className="form-group">
                <label>Nom</label>
                <input type="text" required placeholder="Nom" value={regForm.nom} onChange={(e) => updateReg('nom', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Prénom</label>
                <input type="text" required placeholder="Prénom" value={regForm.prenom} onChange={(e) => updateReg('prenom', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required placeholder="votre@email.com" value={regForm.email} onChange={(e) => updateReg('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input type="password" required minLength={6} placeholder="Min. 6 caractères" value={regForm.password} onChange={(e) => updateReg('password', e.target.value)} />
            </div>
            <div className="row">
              <div className="form-group">
                <label>Téléphone</label>
                <input type="text" placeholder="Téléphone" value={regForm.tel} onChange={(e) => updateReg('tel', e.target.value)} />
              </div>
              <div className="form-group">
                <label>CIN</label>
                <input type="text" placeholder="CIN" value={regForm.CIN} onChange={(e) => updateReg('CIN', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Adresse</label>
              <input type="text" placeholder="Adresse" value={regForm.adresse} onChange={(e) => updateReg('adresse', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <DatePicker value={regForm.date_naissance} onChange={(v) => updateReg('date_naissance', v)} />
            </div>
            <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>
        )}

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
      </div>
    </div>
  );
}
