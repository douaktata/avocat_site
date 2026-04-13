import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Mail, Phone, MapPin, Scale,
  Building2, Hash, Check, UserX, Sparkles, X,
  BadgeCheck, Globe,
} from 'lucide-react';
import { getLawyer, updateUser, updateLawyer } from '../api';
import './Membredetail.css';

const API_BASE = 'http://localhost:8081';

export default function MembreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membre,     setMembre]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showEdit,   setShowEdit]   = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getLawyer(id)
      .then(res => {
        const l = res.data;
        setMembre({
          idl:        l.idl,
          userId:     l.user_id,
          nom:        l.nom        || '',
          prenom:     l.prenom     || '',
          email:      l.email      || '',
          tel:        l.tel        || '—',
          adresse:    l.adresse    || '—',
          statut:     l.statut     || 'Actif',
          specialite: l.specialite || '—',
          barreau:    l.bureau     || '—',
          region:     l.region     || '—',
          numBarreau: l.bar_registration_num || '—',
          telBureau:  l.tel_bureau || '—',
          photoUrl:   l.photo_url ? `${API_BASE}${l.photo_url}` : null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    setEditForm({
      nom:        membre.nom,
      prenom:     membre.prenom,
      email:      membre.email,
      tel:        membre.tel        === '—' ? '' : membre.tel,
      adresse:    membre.adresse    === '—' ? '' : membre.adresse,
      specialite: membre.specialite === '—' ? '' : membre.specialite,
      barreau:    membre.barreau    === '—' ? '' : membre.barreau,
      region:     membre.region     === '—' ? '' : membre.region,
      numBarreau: membre.numBarreau === '—' ? '' : membre.numBarreau,
      telBureau:  membre.telBureau  === '—' ? '' : membre.telBureau,
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setEditSaving(true);
    try {
      if (membre.userId) {
        await updateUser(membre.userId, {
          nom: editForm.nom, prenom: editForm.prenom,
          email: editForm.email, tel: editForm.tel, adresse: editForm.adresse,
        });
      }
      await updateLawyer(id, {
        specialite:        editForm.specialite,
        bureau:            editForm.barreau,
        region:            editForm.region,
        bar_registration_num: editForm.numBarreau,
        tel_bureau:        editForm.telBureau,
      });
      setMembre(prev => ({
        ...prev,
        nom:        editForm.nom        || prev.nom,
        prenom:     editForm.prenom     || prev.prenom,
        email:      editForm.email      || prev.email,
        tel:        editForm.tel        || prev.tel,
        adresse:    editForm.adresse    || prev.adresse,
        specialite: editForm.specialite || prev.specialite,
        barreau:    editForm.barreau    || prev.barreau,
        region:     editForm.region     || prev.region,
        numBarreau: editForm.numBarreau || prev.numBarreau,
        telBureau:  editForm.telBureau  || prev.telBureau,
      }));
      setShowEdit(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="md">
      <div className="md-loading">
        <div className="md-spinner" />
        <span>Chargement du profil…</span>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!membre) return (
    <div className="md">
      <div className="md-notfound">
        <div className="md-notfound-icon"><UserX size={28} /></div>
        <h2>Membre non trouvé</h2>
        <button className="md-btn-back" onClick={() => navigate('/secretaire/barreau')}>
          <ArrowLeft size={14} /> Retour
        </button>
      </div>
    </div>
  );

  const isActif = membre.statut === 'Actif';
  const ini     = `${(membre.prenom||'?')[0]}${(membre.nom||'?')[0]}`.toUpperCase();

  return (
    <div className="md">

      {/* ── BACK ── */}
      <button className="md-btn-back" onClick={() => navigate('/secretaire/barreau')}>
        <ArrowLeft size={14} /> Retour aux membres
      </button>

      {/* ── PROFILE BANNER ── */}
      <div className="md-banner">
        <div className="md-banner-blob" />
        <div className="md-banner-left">
          <div className="md-avatar">
            {membre.photoUrl ? <img src={membre.photoUrl} alt="" /> : ini}
          </div>
          <div className="md-banner-info">
            <div className="md-eyebrow"><Sparkles size={11} /> Membre du Barreau</div>
            <h1 className="md-name">Me. {membre.prenom} {membre.nom}</h1>
            <div className="md-banner-chips">
              <span className="md-spec-chip">
                {membre.specialite !== '—' ? membre.specialite : 'Avocat'}
              </span>
              <span className={`md-status ${isActif ? 'md-status-on' : 'md-status-off'}`}>
                {membre.statut}
              </span>
            </div>
          </div>
        </div>
        <div className="md-banner-actions">
          <a href={`mailto:${membre.email}`} className="md-btn md-btn-outline">
            <Mail size={14} /> Email
          </a>
          <button className="md-btn md-btn-primary" onClick={openEdit}>
            <Edit2 size={14} /> Modifier
          </button>
        </div>
      </div>

      {/* ── INFO CARDS ── */}
      <div className="md-content">

        {/* Professional info */}
        <div className="md-card">
          <div className="md-card-head">
            <h2 className="md-card-title">Informations professionnelles</h2>
          </div>
          <div className="md-info-grid">
            <div className="md-info-item">
              <div className="md-info-ic"><Scale size={14} /></div>
              <div>
                <label>Spécialité</label>
                <p>{membre.specialite}</p>
              </div>
            </div>
            <div className="md-info-item">
              <div className="md-info-ic"><Building2 size={14} /></div>
              <div>
                <label>Barreau</label>
                <p>{membre.barreau}</p>
              </div>
            </div>
            <div className="md-info-item">
              <div className="md-info-ic"><Hash size={14} /></div>
              <div>
                <label>N° Barreau</label>
                <p>{membre.numBarreau}</p>
              </div>
            </div>
            <div className="md-info-item">
              <div className="md-info-ic"><Globe size={14} /></div>
              <div>
                <label>Région</label>
                <p>{membre.region}</p>
              </div>
            </div>
            <div className="md-info-item">
              <div className="md-info-ic"><Phone size={14} /></div>
              <div>
                <label>Téléphone</label>
                <p>{membre.tel}</p>
              </div>
            </div>
            <div className="md-info-item">
              <div className="md-info-ic"><Phone size={14} /></div>
              <div>
                <label>Tél. bureau</label>
                <p>{membre.telBureau}</p>
              </div>
            </div>
            <div className="md-info-item md-info-full">
              <div className="md-info-ic"><Mail size={14} /></div>
              <div>
                <label>Email</label>
                <p>{membre.email}</p>
              </div>
            </div>
            {membre.adresse !== '—' && (
              <div className="md-info-item md-info-full">
                <div className="md-info-ic"><MapPin size={14} /></div>
                <div>
                  <label>Adresse</label>
                  <p>{membre.adresse}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Badge card */}
        <div className="md-card md-card-badge-panel">
          <div className="md-badge-hero">
            <div className="md-badge-avatar">
              {membre.photoUrl ? <img src={membre.photoUrl} alt="" /> : ini}
            </div>
            <div className="md-badge-name">Me. {membre.prenom} {membre.nom}</div>
            <div className="md-badge-spec">{membre.specialite !== '—' ? membre.specialite : 'Avocat'}</div>
            {membre.numBarreau !== '—' && (
              <div className="md-badge-num">
                <BadgeCheck size={13} /> {membre.numBarreau}
              </div>
            )}
            <span className={`md-status ${isActif ? 'md-status-on' : 'md-status-off'}`}>
              {membre.statut}
            </span>
          </div>
          {membre.barreau !== '—' && (
            <div className="md-badge-footer">
              <Building2 size={12} />
              <span>Barreau de {membre.barreau}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {showEdit && createPortal(
        <div className="md-scrim" onClick={() => setShowEdit(false)}>
          <div className="md-modal" onClick={e => e.stopPropagation()}>
            <div className="md-modal-head">
              <div className="md-modal-head-icon">
                <Edit2 size={18} />
              </div>
              <div className="md-modal-head-text">
                <h2>Modifier le profil</h2>
                <p>Me. {membre.prenom} {membre.nom}</p>
              </div>
              <button className="md-modal-close" onClick={() => setShowEdit(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="md-modal-body">
                <p className="md-modal-section-label">Informations personnelles</p>
                {[
                  ['prenom',  'Prénom',    false],
                  ['nom',     'Nom',       false],
                  ['email',   'Email',     true ],
                  ['tel',     'Téléphone', true ],
                  ['adresse', 'Adresse',   true ],
                ].map(([field, label, full]) => (
                  <div key={field} className={`md-field${full ? ' md-field-full' : ''}`}>
                    <label>{label}</label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={editForm[field] || ''}
                      onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={label}
                    />
                  </div>
                ))}

                <p className="md-modal-section-label" style={{ marginTop: '.75rem' }}>Informations avocat</p>
                {[
                  ['specialite', 'Spécialité',  false],
                  ['barreau',    'Barreau',      false],
                  ['numBarreau', 'N° Barreau',   false],
                  ['region',     'Région',       false],
                  ['telBureau',  'Tél. bureau',  true ],
                ].map(([field, label, full]) => (
                  <div key={field} className={`md-field${full ? ' md-field-full' : ''}`}>
                    <label>{label}</label>
                    <input
                      type="text"
                      value={editForm[field] || ''}
                      onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div className="md-modal-ft">
                <button type="button" className="md-btn-cancel" onClick={() => setShowEdit(false)}>Annuler</button>
                <button type="submit" className="md-btn-save" disabled={editSaving}>
                  {editSaving ? 'Enregistrement…' : <><Check size={13} /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
