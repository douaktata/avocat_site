import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, GraduationCap, Gavel,
  Search, X, Phone, Mail, MapPin, Eye, UserX,
} from 'lucide-react';
import { getUsersByRole } from '../api';
import './staff.css';

const API_BASE = 'http://localhost:8081';

const ROLE_COLOR = {
  'Secrétaire': '#2563eb',
  'Stagiaire':  '#16a34a',
  'Avocat':     '#7c3aed',
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
    totalStaff:   staff.length,
    actifStaff:   staff.filter(s => s.statut === 'Actif').length,
    stagiaires:   staff.filter(s => s.role === 'Stagiaire').length,
    totalAvocats: avocats.length,
    actifsAvocats: avocats.filter(a => a.statut === 'Actif').length,
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

      {/* Header */}
      <div className="sf-header">
        <div>
          <h1 className="sf-title">Équipe du cabinet</h1>
          <p className="sf-sub">Avocats, collaborateurs et stagiaires</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sf-tabs">
        <button
          className={`sf-tab${activeTab === 'staff' ? ' active' : ''}`}
          onClick={() => switchTab('staff')}
        >
          <Users size={15} />
          Staff administratif
          <span className="sf-tab-badge">{staff.length}</span>
        </button>
        <button
          className={`sf-tab${activeTab === 'avocats' ? ' active' : ''}`}
          onClick={() => switchTab('avocats')}
        >
          <Gavel size={15} />
          Avocats
          <span className="sf-tab-badge">{avocats.length}</span>
        </button>
      </div>

      {/* KPIs */}
      {activeTab === 'staff' ? (
        <div className="sf-kpis">
          <div className="sf-kpi sf-kpi-blue">
            <div className="sf-kpi-ic"><Users size={18} /></div>
            <div><div className="sf-kpi-n">{stats.totalStaff}</div><div className="sf-kpi-l">Total</div></div>
          </div>
          <div className="sf-kpi sf-kpi-green">
            <div className="sf-kpi-ic"><UserCheck size={18} /></div>
            <div><div className="sf-kpi-n">{stats.actifStaff}</div><div className="sf-kpi-l">Actifs</div></div>
          </div>
          <div className="sf-kpi sf-kpi-teal">
            <div className="sf-kpi-ic"><GraduationCap size={18} /></div>
            <div><div className="sf-kpi-n">{stats.stagiaires}</div><div className="sf-kpi-l">Stagiaires</div></div>
          </div>
        </div>
      ) : (
        <div className="sf-kpis">
          <div className="sf-kpi sf-kpi-violet">
            <div className="sf-kpi-ic"><Gavel size={18} /></div>
            <div><div className="sf-kpi-n">{stats.totalAvocats}</div><div className="sf-kpi-l">Total avocats</div></div>
          </div>
          <div className="sf-kpi sf-kpi-green">
            <div className="sf-kpi-ic"><UserCheck size={18} /></div>
            <div><div className="sf-kpi-n">{stats.actifsAvocats}</div><div className="sf-kpi-l">Actifs</div></div>
          </div>
        </div>
      )}

      {/* Toolbar */}
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

        <span className="sf-count">
          {filtered.length} membre{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="sf-loading">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="sf-empty">
          <UserX size={40} className="sf-empty-ic" />
          <h3>Aucun membre trouvé</h3>
          <p>Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="sf-grid">
          {filtered.map(m => {
            const color = ROLE_COLOR[m.role] || '#64748b';
            const isActif = m.statut === 'Actif';
            return (
              <div key={m.id} className="sf-card">
                <div className="sf-card-top">
                  <div className="sf-avatar" style={{ background: color + '20', color }}>
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt="" />
                      : initials(m)
                    }
                  </div>
                  <div className="sf-card-id">
                    <div className="sf-name">{m.prenom} {m.nom}</div>
                    <span className={`sf-status${isActif ? ' sf-status-on' : ' sf-status-off'}`}>
                      {m.statut}
                    </span>
                  </div>
                </div>

                <div className="sf-poste" style={{ color }}>
                  {m.poste}
                </div>

                <div className="sf-info">
                  <div className="sf-info-row"><Phone size={13} /><span>{m.tel}</span></div>
                  <div className="sf-info-row"><Mail size={13} /><span>{m.email}</span></div>
                  {activeTab === 'avocats' && m.adresse !== '—' && (
                    <div className="sf-info-row"><MapPin size={13} /><span>{m.adresse}</span></div>
                  )}
                </div>

                {activeTab === 'staff' && (
                  <div className="sf-card-actions">
                    <button
                      className="sf-btn"
                      onClick={() => navigate(`/secretaire/staff/${m.id}`)}
                    >
                      <Eye size={14} /> Voir le profil
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
