import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getUser, updateUser, changePassword, uploadPhoto } from './api';
import './Profile.css';

const API_BASE = 'http://localhost:8081';

export default function Profile() {
  const { user: authUser, loginUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgPwd, setMsgPwd] = useState(null);
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
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          tel: data.tel || '',
          adresse: data.adresse || '',
          CIN: data.CIN || '',
          date_naissance: data.date_naissance || '',
        });
      })
      .catch(() => setMsg({ type: 'error', text: 'Erreur lors du chargement du profil.' }))
      .finally(() => setLoading(false));
  }, [authUser?.idu]);

  const flash = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4500);
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateUser(authUser.idu, form);
      setProfile(data);
      loginUser({ ...authUser, nom: data.nom, prenom: data.prenom, email: data.email });
      flash(setMsg, 'success', 'Informations mises à jour avec succès.');
    } catch {
      flash(setMsg, 'error', 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
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
    } finally {
      setSavingPwd(false);
    }
  };

  const handlePhotoChange = async (e) => {
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
    } finally {
      setSaving(false);
    }
  };

  const photoSrc = profile?.photo_url
    ? `${API_BASE}${profile.photo_url}?t=${Date.now()}`
    : null;

  const initials = `${(profile?.prenom || '')[0] || ''}${(profile?.nom || '')[0] || ''}`.toUpperCase() || '?';
  const fullName = `${profile?.prenom || ''} ${profile?.nom || ''}`.trim() || 'Utilisateur';
  const roleName = [...(profile?.roles || [])].join(', ') || '';

  if (loading) return <div className="profile-loading"><div className="profile-spinner" /></div>;

  return (
    <div className="profile-page">

      {/* Cover */}
      <div className="profile-hero">
        <div className="profile-hero-pattern" />
      </div>

      {/* Identity */}
      <div className="profile-identity">
        <div className="profile-avatar-wrap" onClick={() => fileRef.current.click()}>
          <div className="profile-avatar-ring">
            {photoSrc
              ? <img src={photoSrc} alt="avatar" />
              : <span className="profile-avatar-initials">{initials}</span>
            }
          </div>
          <div className="profile-avatar-cam"><i className="fas fa-camera" /></div>
          <input ref={fileRef} type="file" accept="image/*" className="profile-file-input" onChange={handlePhotoChange} />
        </div>
        <div className="profile-identity-text">
          <div className="profile-identity-name">{fullName}</div>
          {roleName && (
            <div className="profile-identity-role">
              <i className="fas fa-shield-alt" />
              {roleName}
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="profile-content">

        {/* Personal Info Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon purple">
              <i className="fas fa-id-card" />
            </div>
            <div>
              <div className="profile-card-title">Informations personnelles</div>
              <div className="profile-card-subtitle">Modifiez vos coordonnées et informations de contact</div>
            </div>
          </div>
          <div className="profile-card-body">
            {msg && (
              <div className={`profile-alert ${msg.type}`}>
                <i className={`fas fa-${msg.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
                {msg.text}
              </div>
            )}
            <form onSubmit={handleSaveInfo}>
              <div className="profile-grid">
                <div className="profile-field">
                  <label>Prénom</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-user" />
                    <input
                      value={form.prenom}
                      onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>
                <div className="profile-field">
                  <label>Nom</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-user" />
                    <input
                      value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div className="profile-field span-2">
                  <label>Adresse email</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-envelope" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
                <div className="profile-field">
                  <label>Téléphone</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-phone" />
                    <input
                      value={form.tel}
                      onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                </div>
                <div className="profile-field">
                  <label>CIN</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-id-badge" />
                    <input
                      value={form.CIN}
                      onChange={e => setForm(f => ({ ...f, CIN: e.target.value }))}
                      placeholder="Numéro CIN"
                    />
                  </div>
                </div>
                <div className="profile-field span-2">
                  <label>Adresse</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-map-marker-alt" />
                    <input
                      value={form.adresse}
                      onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                      placeholder="Votre adresse"
                    />
                  </div>
                </div>
                <div className="profile-field">
                  <label>Date de naissance</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-calendar" />
                    <input
                      type="date"
                      value={form.date_naissance}
                      onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="profile-form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="profile-spinner-sm" /> Enregistrement...</>
                    : <><i className="fas fa-save" /> Enregistrer les modifications</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon blue">
              <i className="fas fa-lock" />
            </div>
            <div>
              <div className="profile-card-title">Sécurité du compte</div>
              <div className="profile-card-subtitle">Changez votre mot de passe pour sécuriser votre compte</div>
            </div>
          </div>
          <div className="profile-card-body">
            {msgPwd && (
              <div className={`profile-alert ${msgPwd.type}`}>
                <i className={`fas fa-${msgPwd.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
                {msgPwd.text}
              </div>
            )}
            <form onSubmit={handleChangePassword}>
              <div className="pwd-fields">
                <div className="profile-field">
                  <label>Mot de passe actuel</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-lock" />
                    <input
                      type={showPwd.currentPassword ? 'text' : 'password'}
                      value={pwdForm.currentPassword}
                      onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="Votre mot de passe actuel"
                      required
                    />
                    <button type="button" className="profile-pwd-toggle" onClick={() => setShowPwd(s => ({ ...s, currentPassword: !s.currentPassword }))}>
                      <i className={`fas fa-eye${showPwd.currentPassword ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="profile-field">
                  <label>Nouveau mot de passe</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-key" />
                    <input
                      type={showPwd.newPassword ? 'text' : 'password'}
                      value={pwdForm.newPassword}
                      onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="Minimum 6 caractères"
                      required
                      minLength={6}
                    />
                    <button type="button" className="profile-pwd-toggle" onClick={() => setShowPwd(s => ({ ...s, newPassword: !s.newPassword }))}>
                      <i className={`fas fa-eye${showPwd.newPassword ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="profile-field">
                  <label>Confirmer le nouveau mot de passe</label>
                  <div className="profile-input-wrap">
                    <i className="fas fa-check-double" />
                    <input
                      type={showPwd.confirm ? 'text' : 'password'}
                      value={pwdForm.confirm}
                      onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder="Répéter le nouveau mot de passe"
                      required
                    />
                    <button type="button" className="profile-pwd-toggle" onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}>
                      <i className={`fas fa-eye${showPwd.confirm ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="profile-form-actions">
                <button type="submit" className="btn-primary" disabled={savingPwd}>
                  {savingPwd
                    ? <><span className="profile-spinner-sm" /> Modification...</>
                    : <><i className="fas fa-shield-alt" /> Changer le mot de passe</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
