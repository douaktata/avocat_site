import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Mail, Phone, MapPin, Briefcase,
  Calendar, CheckSquare, Play, Check, UserX, Sparkles, User, X,
} from 'lucide-react';
import { getUser, getTasksByAssignee, updateUser } from '../api';
import './Staffdetail.css';

const API_BASE = 'http://localhost:8081';

const ROLE_CONFIG = {
  'Secrétaire': { color: '#2563eb', bg: '#dbeafe', bar: '#2563eb' },
  'Stagiaire':  { color: '#16a34a', bg: '#dcfce7', bar: '#16a34a' },
};

const STATUS_BADGE = {
  PENDING:     { label: 'À faire',  cls: 'sd-badge-gray'  },
  IN_PROGRESS: { label: 'En cours', cls: 'sd-badge-blue'  },
  COMPLETED:   { label: 'Terminé',  cls: 'sd-badge-green' },
};

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membre,     setMembre]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showEdit,   setShowEdit]   = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getUser(id),
      getTasksByAssignee(id).catch(() => ({ data: [] })),
    ]).then(([userRes, tasksRes]) => {
      const u = userRes.data;
      const roles = u.roles || [];
      const isStage  = roles.includes('STAGIAIRE');
      const roleLabel = isStage ? 'Stagiaire' : 'Secrétaire';

      setMembre({
        id:          u.idu,
        nom:         u.nom    || '',
        prenom:      u.prenom || '',
        poste:       isStage  ? 'Stagiaire avocat' : 'Secrétaire juridique',
        role:        roleLabel,
        email:       u.email   || '',
        tel:         u.tel     || '—',
        adresse:     u.adresse || '—',
        statut:      u.statut  || 'Actif',
        photoUrl:    u.photo_url ? `${API_BASE}${u.photo_url}` : null,
        dateEmbauche: u.created_at
          ? new Date(u.created_at).toLocaleDateString('fr-FR')
          : '—',
        taches: (tasksRes.data || []).map(t => ({
          id:     t.id,
          titre:  t.title,
          statut: t.status,
        })),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    setEditForm({
      nom:     membre.nom,
      prenom:  membre.prenom,
      email:   membre.email,
      tel:     membre.tel === '—' ? '' : membre.tel,
      adresse: membre.adresse === '—' ? '' : membre.adresse,
    });
    setShowEdit(true);
  };

  const handleEditSubmit = e => {
    e.preventDefault();
    setEditSaving(true);
    updateUser(id, editForm)
      .then(res => {
        const u = res.data;
        setMembre(prev => ({
          ...prev,
          nom:     u.nom     || prev.nom,
          prenom:  u.prenom  || prev.prenom,
          email:   u.email   || prev.email,
          tel:     u.tel     || prev.tel,
          adresse: u.adresse || prev.adresse,
        }));
        setShowEdit(false);
      })
      .catch(err => alert(err.response?.data?.message || 'Erreur'))
      .finally(() => setEditSaving(false));
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="sd">
      <div className="sd-loading">
        <div className="sd-spinner" />
        <span>Chargement du profil…</span>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!membre) return (
    <div className="sd">
      <div className="sd-notfound">
        <div className="sd-notfound-icon"><UserX size={28} /></div>
        <h2>Membre non trouvé</h2>
        <button className="sd-btn-back" onClick={() => navigate('/secretaire/staff')}>
          <ArrowLeft size={14} /> Retour
        </button>
      </div>
    </div>
  );

  const cfg     = ROLE_CONFIG[membre.role] || { color: '#64748b', bg: '#f1f5f9' };
  const isActif = membre.statut === 'Actif';
  const ini     = `${(membre.prenom||'?')[0]}${(membre.nom||'?')[0]}`.toUpperCase();

  const taskStats = {
    total:      membre.taches.length,
    enCours:    membre.taches.filter(t => t.statut === 'IN_PROGRESS').length,
    terminees:  membre.taches.filter(t => t.statut === 'COMPLETED').length,
    aFaire:     membre.taches.filter(t => t.statut === 'PENDING').length,
  };

  return (
    <div className="sd">

      {/* ── BACK ── */}
      <button className="sd-btn-back" onClick={() => navigate('/secretaire/staff')}>
        <ArrowLeft size={14} /> Retour à l'équipe
      </button>

      {/* ── PROFILE BANNER ── */}
      <div className="sd-banner">
        <div className="sd-banner-blob" />
        <div className="sd-banner-left">
          <div className="sd-avatar" style={{ background: cfg.bg, color: cfg.color }}>
            {membre.photoUrl
              ? <img src={membre.photoUrl} alt="" />
              : ini
            }
          </div>
          <div className="sd-banner-info">
            <div className="sd-eyebrow"><Sparkles size={11} /> {membre.poste}</div>
            <h1 className="sd-name">{membre.prenom} {membre.nom}</h1>
            <div className="sd-banner-chips">
              <span className="sd-role-chip" style={{ background: cfg.bg, color: cfg.color }}>
                {membre.role}
              </span>
              <span className={`sd-status ${isActif ? 'sd-status-on' : 'sd-status-off'}`}>
                {membre.statut}
              </span>
            </div>
          </div>
        </div>
        <div className="sd-banner-actions">
          <a href={`mailto:${membre.email}`} className="sd-btn sd-btn-outline">
            <Mail size={14} /> Email
          </a>
          <button className="sd-btn sd-btn-primary" onClick={openEdit}>
            <Edit2 size={14} /> Modifier
          </button>
        </div>
      </div>

      {/* ── KPIS ── */}
      <div className="sd-kpis">
        <div className="sd-kpi sd-kpi-blue">
          <div className="sd-kpi-ic"><CheckSquare size={17} /></div>
          <div>
            <div className="sd-kpi-n">{taskStats.total}</div>
            <div className="sd-kpi-l">Total tâches</div>
          </div>
        </div>
        <div className="sd-kpi sd-kpi-amber">
          <div className="sd-kpi-ic"><Play size={17} /></div>
          <div>
            <div className="sd-kpi-n">{taskStats.enCours}</div>
            <div className="sd-kpi-l">En cours</div>
          </div>
        </div>
        <div className="sd-kpi sd-kpi-green">
          <div className="sd-kpi-ic"><Check size={17} /></div>
          <div>
            <div className="sd-kpi-n">{taskStats.terminees}</div>
            <div className="sd-kpi-l">Terminées</div>
          </div>
        </div>
        <div className="sd-kpi sd-kpi-gray">
          <div className="sd-kpi-ic"><Calendar size={17} /></div>
          <div>
            <div className="sd-kpi-n">{membre.dateEmbauche}</div>
            <div className="sd-kpi-l">Date d'embauche</div>
          </div>
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="sd-content">

        {/* Info card */}
        <div className="sd-card">
          <div className="sd-card-head">
            <h2 className="sd-card-title">Informations</h2>
          </div>
          <div className="sd-info-grid">
            <div className="sd-info-item">
              <div className="sd-info-ic"><Briefcase size={14} /></div>
              <div>
                <label>Poste</label>
                <p>{membre.poste}</p>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-ic"><User size={14} /></div>
              <div>
                <label>Rôle</label>
                <p style={{ color: cfg.color, fontWeight: 700 }}>{membre.role}</p>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-ic"><Phone size={14} /></div>
              <div>
                <label>Téléphone</label>
                <p>{membre.tel}</p>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-ic"><Calendar size={14} /></div>
              <div>
                <label>Membre depuis</label>
                <p>{membre.dateEmbauche}</p>
              </div>
            </div>
            <div className="sd-info-item sd-info-full">
              <div className="sd-info-ic"><Mail size={14} /></div>
              <div>
                <label>Email</label>
                <p>{membre.email}</p>
              </div>
            </div>
            {membre.adresse !== '—' && (
              <div className="sd-info-item sd-info-full">
                <div className="sd-info-ic"><MapPin size={14} /></div>
                <div>
                  <label>Adresse</label>
                  <p>{membre.adresse}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks card */}
        <div className="sd-card">
          <div className="sd-card-head">
            <h2 className="sd-card-title">Tâches assignées</h2>
            <span className="sd-card-badge">{membre.taches.length}</span>
          </div>
          {membre.taches.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty-icon"><CheckSquare size={24} /></div>
              <p>Aucune tâche assignée</p>
            </div>
          ) : (
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {membre.taches.map(t => {
                    const b = STATUS_BADGE[t.statut] || { label: t.statut, cls: 'sd-badge-gray' };
                    return (
                      <tr key={t.id}>
                        <td className="sd-td-title">{t.titre}</td>
                        <td><span className={`sd-badge ${b.cls}`}>{b.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {showEdit && createPortal(
        <div className="sd-scrim" onClick={() => setShowEdit(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-head">
              <div className="sd-modal-head-icon" style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` }}>
                <Edit2 size={18} />
              </div>
              <div className="sd-modal-head-text">
                <h2>Modifier le profil</h2>
                <p>{membre.prenom} {membre.nom}</p>
              </div>
              <button className="sd-modal-close" onClick={() => setShowEdit(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="sd-modal-body">
                {[
                  ['prenom', 'Prénom', false],
                  ['nom',    'Nom',    false],
                  ['email',  'Email',  true ],
                  ['tel',    'Téléphone', true],
                  ['adresse','Adresse',   true],
                ].map(([field, label, full]) => (
                  <div key={field} className={`sd-field${full ? ' sd-field-full' : ''}`}>
                    <label>{label}</label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={editForm[field] || ''}
                      onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div className="sd-modal-ft">
                <button type="button" className="sd-btn-cancel" onClick={() => setShowEdit(false)}>Annuler</button>
                <button type="submit" className="sd-btn-save" disabled={editSaving}>
                  {editSaving ? 'Enregistrement…' : <><Check size={13}/> Enregistrer</>}
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
