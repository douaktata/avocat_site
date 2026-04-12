import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { login, register, forgotPassword } from '../api';
import DatePicker from '../components/DatePicker';
import {
  Scale, ArrowLeft, Mail, Lock, User, Phone, CreditCard,
  MapPin, Calendar, Eye, EyeOff, AlertCircle, CheckCircle,
} from 'lucide-react';
import justiceBg from '../assets/justice-bg.png';
import './AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { loginUser } = useAuth();

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd,  setShowLoginPwd]  = useState(false);

  const [showForgot,  setShowForgot]  = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [regForm, setRegForm] = useState({
    nom: '', prenom: '', email: '', password: '',
    tel: '', CIN: '', adresse: '', date_naissance: '',
  });
  const [showRegPwd, setShowRegPwd] = useState(false);

  const switchTab = (t) => { setTab(t); setMessage(null); setShowForgot(false); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { data } = await login(loginEmail, loginPassword);
      loginUser(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Email ou mot de passe incorrect' });
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await register({ ...regForm, date_naissance: regForm.date_naissance || null });
      setMessage({ type: 'success', text: 'Inscription réussie ! Vous pouvez vous connecter.' });
      setTimeout(() => switchTab('login'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || "Erreur lors de l'inscription" });
    } finally { setLoading(false); }
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
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la réinitialisation' });
    } finally { setLoading(false); }
  };

  const updateReg = (field, value) => setRegForm(prev => ({ ...prev, [field]: value }));

  const heading = showForgot
    ? { title: 'Mot de passe oublié', sub: 'Recevez un nouveau mot de passe par email' }
    : tab === 'login'
      ? { title: 'Bon retour !',       sub: 'Connectez-vous à votre espace personnel' }
      : { title: 'Créer un compte',    sub: 'Rejoignez l\'espace client du Cabinet Hajaij' };

  return (
    <div className="auth-layout" style={{ backgroundImage: `url(${justiceBg})` }}>

      {/* Back to landing */}
      <button className="auth-back" onClick={() => navigate('/')}>
        <ArrowLeft size={13} /> Retour à l'accueil
      </button>

      <div className="auth-card">

        {/* Logo */}
        <div className="auth-card-header">
          <div className="auth-logo">
            <Scale size={18} />
            <span>JurisHub</span>
          </div>
          <h1 className="auth-card-title">{heading.title}</h1>
          <p className="auth-card-sub">{heading.sub}</p>
        </div>

        {/* Tabs — hidden on forgot password */}
        {!showForgot && (
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
              Connexion
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
              Inscription
            </button>
          </div>
        )}

        {/* Alert */}
        {message && (
          <div className={`auth-alert auth-alert-${message.type}`}>
            {message.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
            {message.text}
          </div>
        )}

        {/* ── Login ── */}
        {tab === 'login' && !showForgot && (
          <form onSubmit={handleLogin} className="auth-form" key="login">
            <div className="auth-field">
              <label>Adresse email</label>
              <div className="auth-input-wrap">
                <Mail size={14} className="auth-input-ic" />
                <input type="email" required placeholder="votre@email.com"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
            </div>

            <div className="auth-field">
              <label>Mot de passe</label>
              <div className="auth-input-wrap">
                <Lock size={14} className="auth-input-ic" />
                <input type={showLoginPwd ? 'text' : 'password'} required placeholder="Votre mot de passe"
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                <button type="button" className="auth-eye" onClick={() => setShowLoginPwd(s => !s)}>
                  {showLoginPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="auth-forgot-row">
              <button type="button" className="auth-link"
                onClick={() => { setShowForgot(true); setMessage(null); }}>
                Mot de passe oublié ?
              </button>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Connexion…</> : 'Se connecter'}
            </button>
          </form>
        )}

        {/* ── Forgot password ── */}
        {tab === 'login' && showForgot && (
          <form onSubmit={handleForgotPassword} className="auth-form" key="forgot">
            <div className="auth-field">
              <label>Adresse email</label>
              <div className="auth-input-wrap">
                <Mail size={14} className="auth-input-ic" />
                <input type="email" required placeholder="votre@email.com"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Envoi…</> : 'Envoyer le lien'}
            </button>

            <button type="button" className="auth-ghost"
              onClick={() => { setShowForgot(false); setMessage(null); }}>
              <ArrowLeft size={13} /> Retour à la connexion
            </button>
          </form>
        )}

        {/* ── Register ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="auth-form" key="register">
            <div className="auth-row">
              <div className="auth-field">
                <label>Prénom</label>
                <div className="auth-input-wrap">
                  <User size={14} className="auth-input-ic" />
                  <input type="text" required placeholder="Prénom"
                    value={regForm.prenom} onChange={e => updateReg('prenom', e.target.value)} />
                </div>
              </div>
              <div className="auth-field">
                <label>Nom</label>
                <div className="auth-input-wrap">
                  <User size={14} className="auth-input-ic" />
                  <input type="text" required placeholder="Nom"
                    value={regForm.nom} onChange={e => updateReg('nom', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrap">
                <Mail size={14} className="auth-input-ic" />
                <input type="email" required placeholder="votre@email.com"
                  value={regForm.email} onChange={e => updateReg('email', e.target.value)} />
              </div>
            </div>

            <div className="auth-field">
              <label>Mot de passe</label>
              <div className="auth-input-wrap">
                <Lock size={14} className="auth-input-ic" />
                <input type={showRegPwd ? 'text' : 'password'} required minLength={6}
                  placeholder="Minimum 6 caractères"
                  value={regForm.password} onChange={e => updateReg('password', e.target.value)} />
                <button type="button" className="auth-eye" onClick={() => setShowRegPwd(s => !s)}>
                  {showRegPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Téléphone</label>
                <div className="auth-input-wrap">
                  <Phone size={14} className="auth-input-ic" />
                  <input type="text" placeholder="+216 XX XXX XXX"
                    value={regForm.tel} onChange={e => updateReg('tel', e.target.value)} />
                </div>
              </div>
              <div className="auth-field">
                <label>CIN</label>
                <div className="auth-input-wrap">
                  <CreditCard size={14} className="auth-input-ic" />
                  <input type="text" placeholder="Numéro CIN"
                    value={regForm.CIN} onChange={e => updateReg('CIN', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label>Adresse</label>
              <div className="auth-input-wrap">
                <MapPin size={14} className="auth-input-ic" />
                <input type="text" placeholder="Votre adresse"
                  value={regForm.adresse} onChange={e => updateReg('adresse', e.target.value)} />
              </div>
            </div>

            <div className="auth-field">
              <label>Date de naissance</label>
              <div className="auth-input-wrap">
                <Calendar size={14} className="auth-input-ic" />
                <DatePicker value={regForm.date_naissance} onChange={v => updateReg('date_naissance', v)} />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Inscription…</> : 'Créer mon compte'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
