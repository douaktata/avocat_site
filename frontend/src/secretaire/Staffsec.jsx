import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole } from '../api';
import './staff.css';

const API_BASE = 'http://localhost:8081';

const getRoleColor = (role) => {
  const colors = { 'Secrétaire': '#3b82f6', 'Stagiaire': '#10b981', 'Avocat': '#8b5cf6' };
  return colors[role] || '#64748b';
};

const getStatusClass = (status) => ({ Actif: 'status-actif', Inactif: 'status-inactif' }[status] || '');

const mapUser = (roleLabel, poste) => (u) => ({
  id: u.idu,
  nom: u.nom || '',
  prenom: u.prenom || '',
  poste,
  role: roleLabel,
  email: u.email || '',
  tel: u.tel || '—',
  adresse: u.adresse || '—',
  statut: u.statut || 'Actif',
  photoUrl: u.photo_url ? `${API_BASE}${u.photo_url}` : null,
});

const Staffsec = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [avocats, setAvocats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    Promise.all([
      getUsersByRole('SECRETAIRE'),
      getUsersByRole('STAGIAIRE'),
      getUsersByRole('AVOCAT'),
    ])
      .then(([secRes, stagRes, avocatRes]) => {
        setStaff([
          ...secRes.data.map(mapUser('Secrétaire', 'Secrétaire juridique')),
          ...stagRes.data.map(mapUser('Stagiaire', 'Stagiaire avocat')),
        ]);
        setAvocats(avocatRes.data.map(mapUser('Avocat', 'Avocat')));
        setLoading(false);
      })
      .catch(() => { setError('Impossible de charger l\'équipe'); setLoading(false); });
  }, []);

  const currentList = activeTab === 'staff' ? staff : avocats;

  const filtered = currentList.filter(m => {
    const full = `${m.prenom} ${m.nom}`.toLowerCase();
    const matchSearch = full.includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()) || m.tel.includes(searchTerm);
    const matchStatus = statusFilter === '' || m.statut.toLowerCase() === statusFilter.toLowerCase();
    const matchRole = roleFilter === '' || m.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const stats = {
    totalStaff: staff.length,
    actifStaff: staff.filter(s => s.statut === 'Actif').length,
    stagiaires: staff.filter(s => s.role === 'Stagiaire').length,
    totalAvocats: avocats.length,
    actifsAvocats: avocats.filter(a => a.statut === 'Actif').length,
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setStatusFilter('');
    setRoleFilter('');
  };

  if (loading) return <div className="staff-page"><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error)   return <div className="staff-page"><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="staff-page">

      {/* ── Header ── */}
      <div className="staff-header">
        <div>
          <h1 className="page-title">Équipe du cabinet</h1>
          <p className="page-description">Avocats, collaborateurs et stagiaires</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="staff-tabs">
        <button
          className={`staff-tab ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => handleTabChange('staff')}
        >
          <i className="fas fa-users-cog"></i>
          Staff administratif
          <span className="staff-tab-badge">{staff.length}</span>
        </button>
        <button
          className={`staff-tab ${activeTab === 'avocats' ? 'active' : ''}`}
          onClick={() => handleTabChange('avocats')}
        >
          <i className="fas fa-gavel"></i>
          Avocats
          <span className="staff-tab-badge">{avocats.length}</span>
        </button>
      </div>

      {/* ── KPI Row ── */}
      {activeTab === 'staff' ? (
        <div className="staff-kpi">
          <div className="kpi-item kpi-total"><i className="fas fa-users"></i><div><span>{stats.totalStaff}</span><p>Total</p></div></div>
          <div className="kpi-item kpi-actif"><i className="fas fa-user-check"></i><div><span>{stats.actifStaff}</span><p>Actifs</p></div></div>
          <div className="kpi-item kpi-stagiaires"><i className="fas fa-user-graduate"></i><div><span>{stats.stagiaires}</span><p>Stagiaires</p></div></div>
        </div>
      ) : (
        <div className="staff-kpi">
          <div className="kpi-item kpi-total"><i className="fas fa-gavel"></i><div><span>{stats.totalAvocats}</span><p>Total</p></div></div>
          <div className="kpi-item kpi-actif"><i className="fas fa-user-check"></i><div><span>{stats.actifsAvocats}</span><p>Actifs</p></div></div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="staff-toolbar">
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && <button className="clear-btn" onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>}
        </div>
        <div className="filter-wrap">
          <i className="fas fa-filter"></i>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
        {activeTab === 'staff' && (
          <div className="filter-wrap">
            <i className="fas fa-briefcase"></i>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">Tous les rôles</option>
              <option value="Secrétaire">Secrétaire</option>
              <option value="Stagiaire">Stagiaire</option>
            </select>
          </div>
        )}
        <span className="results-count">{filtered.length} membre{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <div className="staff-grid">
          {filtered.map(membre => (
            <div key={membre.id} className="staff-card">
              <div className="scard-top">
                <div className="scard-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  {membre.photoUrl
                    ? <img src={membre.photoUrl} alt={`${membre.prenom} ${membre.nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                    : <>{membre.prenom.charAt(0)}{membre.nom.charAt(0)}</>
                  }
                </div>
                <div className="scard-identity">
                  <h3>{membre.prenom} {membre.nom}</h3>
                  <span className={`scard-status ${getStatusClass(membre.statut)}`}>{membre.statut}</span>
                </div>
              </div>
              <div className="scard-poste" style={{ color: getRoleColor(membre.role) }}>
                <i className="fas fa-briefcase"></i> {membre.poste}
              </div>
              <div className="scard-info">
                <div className="sinfo-row"><i className="fas fa-phone"></i><span>{membre.tel}</span></div>
                <div className="sinfo-row"><i className="fas fa-envelope"></i><span>{membre.email}</span></div>
                {activeTab === 'avocats' && membre.adresse !== '—' && (
                  <div className="sinfo-row"><i className="fas fa-map-marker-alt"></i><span>{membre.adresse}</span></div>
                )}
              </div>
              {activeTab === 'staff' && (
                <div className="scard-actions">
                  <button className="scard-btn scard-btn-primary" onClick={() => navigate(`/secretaire/staff/${membre.id}`)}>
                    <i className="fas fa-eye"></i> Voir le profil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>Aucun membre trouvé</p>
          <small>Essayez de modifier vos filtres</small>
        </div>
      )}
    </div>
  );
};

export default Staffsec;
