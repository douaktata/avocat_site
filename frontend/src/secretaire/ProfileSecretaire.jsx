import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, CreditCard, MapPin, Calendar,
  Lock, Key, Eye, EyeOff, Save, ShieldCheck, Camera,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getUser, updateUser, changePassword, uploadPhoto } from '../api';
import './ProfileSecretaire.css';

const API_BASE = 'http://localhost:8081';

export default function ProfileSecretaire() {
  const { user: authUser, loginUser } = useAuth();
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [msgPwd,     setMsgPwd]     = useState(null);
  const fileRef = useRef();

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', tel: '', adresse: '', CIN: '', date_naissance: '',
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ currentPassword: false, newPassword: false, confirm: false });

  useEffect(() => {
    if (!authUser?.idu) return;
    getUser(authUser.idu)
      .then(({ data }) => {
        setProfile(data);
        setForm({
          nom:            data.nom            || '',
          prenom:         data.prenom         || '',
          email:          data.email          || '',
          tel:            data.tel            || '',
          adresse:        data.adresse        || '',
          CIN:            data.CIN            || '',
          date_naissance: data.date_naissance || '',
        });
      })
      .catch(() => flash(setMsg, 'error', 'Erreur lors du chargement du profil.'))
      .finally(() => setLoading(false));
  }, [authUser?.idu]);

  const flash = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4500);
  };

  const handleSaveInfo = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateUser(authUser.idu, form);
      setProfile(data);
      loginUser({ ...authUser, nom: data.nom, prenom: data.prenom, email: data.email });
      flash(setMsg, 'success', 'Informations mises à jour avec succès.');
    } catch {
      flash(setMsg, 'error', 'Erreur lors de la mise à jour.');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) {
      flash(setMsgPwd, 'error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      flash(setMsgPwd, 'error', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setSavingPwd(true);
    try {
      const { data } = await changePassword(authUser.idu, pwdForm.currentPassword, pwdForm.newPassword);
      flash(setMsgPwd, 'success', data.message);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      flash(setMsgPwd, 'error', err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally { setSavingPwd(false); }
  };

  const handlePhotoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash(setMsg, 'error', 'Veuillez sélectionner une image.'); return; }
    if (file.size > 5 * 1024 * 1024) { flash(setMsg, 'error', 'Image trop grande (max 5 Mo).'); return; }
    setSaving(true);
    try {
      const { data } = await uploadPhoto(authUser.idu, file);
      setProfile(p => ({ ...p, photo_url: data.photo_url }));
      flash(setMsg, 'success', 'Photo mise à jour.');
    } catch {
      flash(setMsg, 'error', "Erreur lors de l'upload de la photo.");
    } finally { setSaving(false); }
  };

  const photoSrc  = profile?.photo_url ? `${API_BASE}${profile.photo_url}?t=${Date.now()}` : null;
  const initials  = `${(profile?.prenom || '')[0] || ''}${(profile?.nom || '')[0] || ''}`.toUpperCase() || '?';
  const fullName  = `${profile?.prenom || ''} ${profile?.nom || ''}`.trim() || 'Utilisateur';
  const roleName  = [...(profile?.roles || [])].join(', ') || '';

  if (loading) return <div className="pf-loading">Chargement…</div>;

  return (
    <div className="pf">

      {/* Header */}
      <div className="pf-header">
        <div>
          <h1 className="pf-title">Mon profil</h1>
          <p className="pf-sub">Gérez vos informations personnelles et votre sécurité</p>
        </div>
      </div>

      {/* Identity banner */}
      <div className="pf-identity">
        <div className="pf-avatar-wrap" onClick={() => fileRef.current.click()} title="Changer la photo">
          <div className="pf-avatar">
            {photoSrc
              ? <img src={photoSrc} alt="avatar" />
              : <span>{initials}</span>
            }
          </div>
          <div className="pf-avatar-cam"><Camera size={13} /></div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>
        <div className="pf-identity-text">
          <div className="pf-identity-name">{fullName}</div>
          {roleName && <div className="pf-identity-role">{roleName}</div>}
        </div>
      </div>

      <div className="pf-cards">

        {/* Personal info */}
        <div className="pf-card">
          <div className="pf-card-head">
            <div className="pf-card-ic pf-ic-blue"><User size={16} /></div>
            <div>
              <div className="pf-card-title">Informations personnelles</div>
              <div className="pf-card-sub">Modifiez vos coordonnées et informations de contact</div>
            </div>
          </div>
          <div className="pf-card-body">
            {msg && (
              <div className={`pf-alert pf-alert-${msg.type}`}>
                {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {msg.text}
              </div>
            )}
            <form onSubmit={handleSaveInfo}>
              <div className="pf-grid">
                <div className="pf-field">
                  <label>Prénom</label>
                  <div className="pf-input-wrap">
                    <User size={14} className="pf-input-ic" />
                    <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Votre prénom" />
                  </div>
                </div>
                <div className="pf-field">
                  <label>Nom</label>
                  <div className="pf-input-wrap">
                    <User size={14} className="pf-input-ic" />
                    <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Votre nom" />
                  </div>
                </div>
                <div className="pf-field pf-span2">
                  <label>Adresse email</label>
                  <div className="pf-input-wrap">
                    <Mail size={14} className="pf-input-ic" />
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="votre@email.com" />
                  </div>
                </div>
                <div className="pf-field">
                  <label>Téléphone</label>
                  <div className="pf-input-wrap">
                    <Phone size={14} className="pf-input-ic" />
                    <input value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="+216 XX XXX XXX" />
                  </div>
                </div>
                <div className="pf-field">
                  <label>CIN</label>
                  <div className="pf-input-wrap">
                    <CreditCard size={14} className="pf-input-ic" />
                    <input value={form.CIN} onChange={e => setForm(f => ({ ...f, CIN: e.target.value }))} placeholder="Numéro CIN" />
                  </div>
                </div>
                <div className="pf-field pf-span2">
                  <label>Adresse</label>
                  <div className="pf-input-wrap">
                    <MapPin size={14} className="pf-input-ic" />
                    <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Votre adresse" />
                  </div>
                </div>
                <div className="pf-field">
                  <label>Date de naissance</label>
                  <div className="pf-input-wrap">
                    <Calendar size={14} className="pf-input-ic" />
                    <input type="date" value={form.date_naissance} onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="pf-form-actions">
                <button type="submit" className="pf-btn-save" disabled={saving}>
                  {saving ? 'Enregistrement…' : <><Save size={14} /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password */}
        <div className="pf-card">
          <div className="pf-card-head">
            <div className="pf-card-ic pf-ic-violet"><Lock size={16} /></div>
            <div>
              <div className="pf-card-title">Sécurité du compte</div>
              <div className="pf-card-sub">Changez votre mot de passe pour sécuriser votre compte</div>
            </div>
          </div>
          <div className="pf-card-body">
            {msgPwd && (
              <div className={`pf-alert pf-alert-${msgPwd.type}`}>
                {msgPwd.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {msgPwd.text}
              </div>
            )}
            <form onSubmit={handleChangePassword}>
              <div className="pf-pwd-fields">
                {[
                  { key: 'currentPassword', label: 'Mot de passe actuel',         Icon: Lock,  placeholder: 'Votre mot de passe actuel' },
                  { key: 'newPassword',     label: 'Nouveau mot de passe',         Icon: Key,   placeholder: 'Minimum 6 caractères' },
                  { key: 'confirm',         label: 'Confirmer le nouveau mot de passe', Icon: ShieldCheck, placeholder: 'Répéter le nouveau mot de passe' },
                ].map(({ key, label, Icon, placeholder }) => (
                  <div className="pf-field" key={key}>
                    <label>{label}</label>
                    <div className="pf-input-wrap">
                      <Icon size={14} className="pf-input-ic" />
                      <input
                        type={showPwd[key] ? 'text' : 'password'}
                        value={pwdForm[key]}
                        onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        required
                        minLength={key !== 'currentPassword' ? 6 : undefined}
                      />
                      <button
                        type="button"
                        className="pf-eye"
                        onClick={() => setShowPwd(s => ({ ...s, [key]: !s[key] }))}
                      >
                        {showPwd[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pf-form-actions">
                <button type="submit" className="pf-btn-save" disabled={savingPwd}>
                  {savingPwd ? 'Modification…' : <><ShieldCheck size={14} /> Changer le mot de passe</>}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
