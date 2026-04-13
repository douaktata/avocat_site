import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, GraduationCap, Gavel,
  Search, X, Phone, Mail, MapPin, Eye, UserX, Sparkles,
} from 'lucide-react';
import { getUsersByRole } from '../api';
import './staff.css';

const API_BASE = 'http://localhost:8081';

const ROLE_CONFIG = {
  'Secrétaire': { color: '#2563eb', bg: '#eff6ff', bar: '#2563eb' },
  'Stagiaire':  { color: '#16a34a', bg: '#f0fdf4', bar: '#16a34a' },
  'Avocat':     { color: '#7c3aed', bg: '#f5f3ff', bar: '#7c3aed' },
};

const mapUser = (roleLabel, poste) => u => ({
  id:       u.idu,
  nom:      u.nom    || '',
  prenom:   u.prenom || '',
  poste,
  role:     roleLabel,
  email:    u.email   || '',
  tel:      u.tel     || '—',
  adresse:  u.adresse || '—',
  statut:   u.statut  || 'Actif',
  photoUrl: u.photo_url ? `${API_BASE}${u.photo_url}` : null,
});

export default function Staffsec() {
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState('staff');
  const [staff,        setStaff]        = useState([]);
  const [avocats,      setAvocats]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');

  useEffect(() => {
    Promise.all([
      getUsersByRole('SECRETAIRE'),
      getUsersByRole('STAGIAIRE'),
      getUsersByRole('AVOCAT'),
    ]).then(([secRes, stagRes, avocatRes]) => {
      setStaff([
        ...secRes.data.map(mapUser('Secrétaire', 'Secrétaire juridique')),
        ...stagRes.data.map(mapUser('Stagiaire',  'Stagiaire avocat')),
      ]);
      setAvocats(avocatRes.data.map(mapUser('Avocat', 'Avocat')));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const currentList = activeTab === 'staff' ? staff : avocats;

  const filtered = currentList.filter(m => {
    const full = `${m.prenom} ${m.nom}`.toLowerCase();
    const matchSearch = full.includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tel.includes(searchTerm);
    const matchStatus = !statusFilter || m.statut.toLowerCase() === statusFilter;
    const matchRole   = !roleFilter   || m.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const stats = {
    total:       staff.length + avocats.length,
    avocats:     avocats.length,
    secretaires: staff.filter(s => s.role === 'Secrétaire').length,
    stagiaires:  staff.filter(s => s.role === 'Stagiaire').length,
  };

  const switchTab = tab => {
    setActiveTab(tab);
    setSearchTerm('');
    setStatusFilter('');
    setRoleFilter('');
  };

  const initials = m =>
    `${(m.prenom || '?').charAt(0)}${(m.nom || '?').charAt(0)}`.toUpperCase();

  return (
    <div className="sf">

      {/* ── HEADER BANNER ── */}
      <div className="sf-header">
        <div className="sf-header-blob" />
        <div className="sf-header-top">
          <div className="sf-eyebrow"><Sparkles size={11} /> Gestion de l'équipe</div>
          <h1 className="sf-title">Équipe <em>du cabinet</em></h1>
          <p className="sf-subtitle">Avocats, collaborateurs et stagiaires</p>
        </div>
        <div className="sf-header-divider" />
        <div className="sf-header-stats">
          <div className="sf-hstat">
            <span className="sf-hstat-number">{stats.total}</span>
            <span className="sf-hstat-label">Total</span>
          </div>
          <div className="sf-hstat-sep" />
          <div className="sf-hstat">
            <span className="sf-hstat-number sf-hstat-violet">{stats.avocats}</span>
            <span className="sf-hstat-label">Avocats</span>
          </div>
          <div className="sf-hstat-sep" />
          <div className="sf-hstat">
            <span className="sf-hstat-number sf-hstat-blue">{stats.secretaires}</span>
            <span className="sf-hstat-label">Secrétaires</span>
          </div>
          <div className="sf-hstat-sep" />
          <div className="sf-hstat">
            <span className="sf-hstat-number sf-hstat-green">{stats.stagiaires}</span>
            <span className="sf-hstat-label">Stagiaires</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="sf-tabs">
        <button
          className={`sf-tab${activeTab === 'staff' ? ' active' : ''}`}
          onClick={() => switchTab('staff')}
        >
          <Users size={14} />
          Staff administratif
          <span className="sf-tab-badge">{staff.length}</span>
        </button>
        <button
          className={`sf-tab${activeTab === 'avocats' ? ' active' : ''}`}
          onClick={() => switchTab('avocats')}
        >
          <Gavel size={14} />
          Avocats
          <span className="sf-tab-badge">{avocats.length}</span>
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="sf-toolbar">
        <div className="sf-search">
          <Search size={15} className="sf-search-ic" />
          <input
            type="text"
            placeholder="Rechercher par nom, email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="sf-clear" onClick={() => setSearchTerm('')}><X size={14} /></button>
          )}
        </div>

        <select className="sf-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>

        {activeTab === 'staff' && (
          <select className="sf-sel" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Tous les rôles</option>
            <option value="Secrétaire">Secrétaire</option>
            <option value="Stagiaire">Stagiaire</option>
          </select>
        )}

        <span className="sf-count">{filtered.length} membre{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="sf-loading">
          <div className="sf-spinner" />
          <span>Chargement de l'équipe…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="sf-empty">
          <div className="sf-empty-icon"><UserX size={28} /></div>
          <p className="sf-empty-title">Aucun membre trouvé</p>
          <p className="sf-empty-sub">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="sf-grid">
          {filtered.map(m => {
            const cfg    = ROLE_CONFIG[m.role] || { color: '#64748b', bg: '#f1f5f9', bar: '#94a3b8' };
            const isActif = m.statut === 'Actif';
            return (
              <div key={m.id} className="sf-card">
                <div className="sf-card-bar" style={{ background: cfg.bar }} />
                <div className="sf-card-body">

                  {/* Top: avatar + name + status */}
                  <div className="sf-card-top">
                    <div className="sf-avatar" style={{ background: cfg.bg, color: cfg.color }}>
                      {m.photoUrl
                        ? <img src={m.photoUrl} alt="" />
                        : initials(m)
                      }
                    </div>
                    <div className="sf-card-id">
                      <div className="sf-name">{m.prenom} {m.nom}</div>
                      <div className="sf-card-badges">
                        <span className="sf-role-chip" style={{ background: cfg.bg, color: cfg.color }}>
                          {m.role}
                        </span>
                        <span className={`sf-status${isActif ? ' sf-status-on' : ' sf-status-off'}`}>
                          {m.statut}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="sf-info">
                    <div className="sf-info-row"><Phone size={12} /><span>{m.tel}</span></div>
                    <div className="sf-info-row"><Mail size={12} /><span className="sf-email">{m.email}</span></div>
                    {activeTab === 'avocats' && m.adresse !== '—' && (
                      <div className="sf-info-row"><MapPin size={12} /><span>{m.adresse}</span></div>
                    )}
                  </div>

                  {/* Footer */}
                  {activeTab === 'staff' && (
                    <div className="sf-card-footer">
                      <button className="sf-btn-ghost" onClick={() => navigate(`/secretaire/staff/${m.id}`)}>
                        <Eye size={13} /> Voir le profil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
