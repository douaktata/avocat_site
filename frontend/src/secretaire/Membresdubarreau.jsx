import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Gavel, Search, X, Phone, Mail, MapPin, Eye, UserX, Sparkles,
  Scale, Building2, BadgeCheck, Hash,
} from 'lucide-react';
import { getLawyers } from '../api';
import './Membresdubarreau.css';

const API_BASE = 'http://localhost:8081';

const mapLawyer = l => ({
  id:               l.idl,
  nom:              l.nom    || '',
  prenom:           l.prenom || '',
  email:            l.email  || '',
  tel:              l.tel    || '—',
  adresse:          l.adresse || '—',
  statut:           l.statut  || 'Actif',
  specialite:       l.specialite        || '—',
  barreau:          l.bureau            || '—',
  region:           l.region            || '—',
  numBarreau:       l.bar_registration_num || '—',
  telBureau:        l.tel_bureau        || '—',
  photoUrl:         l.photo_url ? `${API_BASE}${l.photo_url}` : null,
});

export default function MembresDuBarreau() {
  const navigate = useNavigate();
  const [membres,      setMembres]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [preview,      setPreview]      = useState(null);

  useEffect(() => {
    getLawyers()
      .then(res => setMembres((res.data || []).map(mapLawyer)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = membres.filter(m => {
    const full = `${m.prenom} ${m.nom}`.toLowerCase();
    const matchSearch =
      full.includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tel.includes(searchTerm);
    const matchStatus = !statusFilter || m.statut.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:   membres.length,
    actifs:  membres.filter(m => m.statut === 'Actif').length,
    regions: new Set(membres.map(m => m.region).filter(r => r !== '—')).size,
  };

  const ini = m => `${(m.prenom||'?')[0]}${(m.nom||'?')[0]}`.toUpperCase();

  return (
    <div className="mb">

      {/* ── HEADER BANNER ── */}
      <div className="mb-header">
        <div className="mb-header-blob" />
        <div className="mb-header-top">
          <div className="mb-eyebrow"><Sparkles size={11} /> Annuaire du Barreau</div>
          <h1 className="mb-title">Membres <em>du Barreau</em></h1>
          <p className="mb-subtitle">Avocats inscrits et confrères du cabinet</p>
        </div>
        <div className="mb-header-divider" />
        <div className="mb-header-stats">
          <div className="mb-hstat">
            <span className="mb-hstat-number">{stats.total}</span>
            <span className="mb-hstat-label">Total</span>
          </div>
          <div className="mb-hstat-sep" />
          <div className="mb-hstat">
            <span className="mb-hstat-number mb-hstat-green">{stats.actifs}</span>
            <span className="mb-hstat-label">Actifs</span>
          </div>
          <div className="mb-hstat-sep" />
          <div className="mb-hstat">
            <span className="mb-hstat-number mb-hstat-violet">{stats.regions}</span>
            <span className="mb-hstat-label">Régions</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="mb-toolbar">
        <div className="mb-search">
          <Search size={15} className="mb-search-ic" />
          <input
            type="text"
            placeholder="Rechercher par nom, spécialité…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="mb-clear" onClick={() => setSearchTerm('')}><X size={14} /></button>
          )}
        </div>

        <select className="mb-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>

        <span className="mb-count">{filtered.length} membre{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="mb-loading">
          <div className="mb-spinner" />
          <span>Chargement des membres…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mb-empty">
          <div className="mb-empty-icon"><UserX size={28} /></div>
          <p className="mb-empty-title">Aucun membre trouvé</p>
          <p className="mb-empty-sub">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="mb-grid">
          {filtered.map(m => {
            const isActif = m.statut === 'Actif';
            return (
              <div key={m.id} className="mb-card">
                <div className="mb-card-bar" />
                <div className="mb-card-body">

                  <div className="mb-card-top">
                    <div className="mb-avatar">
                      {m.photoUrl ? <img src={m.photoUrl} alt="" /> : ini(m)}
                    </div>
                    <div className="mb-card-id">
                      <div className="mb-name">Me. {m.prenom} {m.nom}</div>
                      <div className="mb-card-badges">
                        <span className="mb-spec-chip">{m.specialite !== '—' ? m.specialite : 'Avocat'}</span>
                        <span className={`mb-status${isActif ? ' mb-status-on' : ' mb-status-off'}`}>
                          {m.statut}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-info">
                    {m.barreau !== '—' && (
                      <div className="mb-info-row"><Building2 size={12} /><span>{m.barreau}</span></div>
                    )}
                    <div className="mb-info-row"><Phone size={12} /><span>{m.tel}</span></div>
                    <div className="mb-info-row"><Mail size={12} /><span className="mb-email">{m.email}</span></div>
                  </div>

                  <div className="mb-card-footer">
                    <button className="mb-btn-ghost" onClick={() => setPreview(m)}>
                      <Eye size={13} /> Aperçu
                    </button>
                    <button className="mb-btn-primary" onClick={() => navigate(`/secretaire/barreau/${m.id}`)}>
                      Voir le profil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {preview && createPortal(
        <div className="mb-scrim" onClick={() => setPreview(null)}>
          <div className="mb-modal" onClick={e => e.stopPropagation()}>
            <div className="mb-modal-head">
              <div className="mb-modal-head-icon">
                <Gavel size={18} />
              </div>
              <div className="mb-modal-head-text">
                <h2>Me. {preview.prenom} {preview.nom}</h2>
                <p>{preview.specialite !== '—' ? preview.specialite : 'Avocat'}</p>
              </div>
              <button className="mb-modal-close" onClick={() => setPreview(null)}><X size={14} /></button>
            </div>
            <div className="mb-modal-body">
              <div className="mb-preview-grid">
                {[
                  [Scale,      'Spécialité',  preview.specialite],
                  [Building2,  'Barreau',     preview.barreau],
                  [Hash,       'N° Barreau',  preview.numBarreau],
                  [Phone,      'Téléphone',   preview.tel],
                  [Phone,      'Tél. bureau', preview.telBureau],
                  [MapPin,     'Région',      preview.region],
                ].map(([Icon, label, val]) => val !== '—' && (
                  <div key={label} className="mb-preview-item">
                    <div className="mb-preview-ic"><Icon size={13} /></div>
                    <div>
                      <label>{label}</label>
                      <p>{val}</p>
                    </div>
                  </div>
                ))}
                <div className="mb-preview-item mb-preview-full">
                  <div className="mb-preview-ic"><Mail size={13} /></div>
                  <div>
                    <label>Email</label>
                    <p>{preview.email}</p>
                  </div>
                </div>
                {preview.adresse !== '—' && (
                  <div className="mb-preview-item mb-preview-full">
                    <div className="mb-preview-ic"><MapPin size={13} /></div>
                    <div>
                      <label>Adresse</label>
                      <p>{preview.adresse}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-modal-ft">
              <button className="mb-btn-cancel" onClick={() => setPreview(null)}>Fermer</button>
              <button
                className="mb-btn-save"
                onClick={() => { setPreview(null); navigate(`/secretaire/barreau/${preview.id}`); }}
              >
                <BadgeCheck size={13} /> Page complète
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
