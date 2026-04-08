import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole } from '../api';
import './Staff.css';

const mapUser = (u, role, poste) => ({
  id: u.idu,
  nom: u.nom || '',
  prenom: u.prenom || '',
  poste,
  role,
  email: u.email || '',
  tel: u.tel || '-',
  dateEmbauche: '-',
  statut: 'Actif',
  competences: [],
  taches: [],
  formations: [],
});

const Staffav = () => {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getUsersByRole('SECRETAIRE'),
      getUsersByRole('STAGIAIRE'),
    ])
      .then(([secRes, stagRes]) => {
        const secretaires = secRes.data.map(u => mapUser(u, 'Secrétaire', 'Secrétaire juridique'));
        const stagiaires = stagRes.data.map(u => mapUser(u, 'Stagiaire', 'Stagiaire avocat'));
        setStaff([...secretaires, ...stagiaires]);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger le personnel');
        setLoading(false);
      });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [openSections, setOpenSections] = useState({});

  const filteredStaff = staff.filter(membre => {
    const fullName = `${membre.prenom} ${membre.nom}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      membre.poste.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membre.tel.includes(searchTerm);
    const matchesStatus = statusFilter === '' || membre.statut.toLowerCase() === statusFilter.toLowerCase();
    const matchesRole = roleFilter === '' || membre.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleOpenModal = (membre) => {
    setSelectedStaff(membre);
    setOpenSections({});
  };

  const handleCloseModal = () => {
    setSelectedStaff(null);
    setOpenSections({});
  };

  const handleViewDetail = (staffId) => {
    navigate(`/secretaire/staff/${staffId}`);
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusClass = (status) => {
    const classes = { Actif: 'status-actif', Inactif: 'status-inactif' };
    return classes[status] || '';
  };

  const getRoleColor = (role) => {
    const colors = {
      'Secrétaire': '#3b82f6',
      'Stagiaire':  '#10b981',
      'Comptable':  '#f59e0b',
      'Assistante': '#8b5cf6',
      'Archiviste': '#64748b',
    };
    return colors[role] || '#64748b';
  };

  const stats = {
    total:      staff.length,
    actifs:     staff.filter(s => s.statut === 'Actif').length,
    stagiaires: staff.filter(s => s.role === 'Stagiaire').length,
    taches:     staff.reduce((acc, s) => acc + s.taches.filter(t => t.statut === 'En cours').length, 0),
  };

  if (loading) return <div className="staff-page"><p style={{padding:'2rem'}}>Chargement...</p></div>;
  if (error) return <div className="staff-page"><p style={{padding:'2rem',color:'red'}}>{error}</p></div>;

  return (
    <div className="staff-page">

      {/* ── Header ── */}
      <div className="staff-header">
        <div>
          <h1 className="page-title">Gestion du Staff</h1>
          <p className="page-description">Équipe administrative et collaborateurs du cabinet</p>
        </div>
        <button className="btn-add-client">
          <i className="fas fa-user-plus"></i> Ajouter un membre
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="staff-kpi">
        <div className="kpi-item kpi-total">
          <i className="fas fa-users"></i>
          <div><span>{stats.total}</span><p>Total</p></div>
        </div>
        <div className="kpi-item kpi-actif">
          <i className="fas fa-user-check"></i>
          <div><span>{stats.actifs}</span><p>Actifs</p></div>
        </div>
        <div className="kpi-item kpi-stagiaires">
          <i className="fas fa-user-graduate"></i>
          <div><span>{stats.stagiaires}</span><p>Stagiaires</p></div>
        </div>
        <div className="kpi-item kpi-taches">
          <i className="fas fa-tasks"></i>
          <div><span>{stats.taches}</span><p>Tâches</p></div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="staff-toolbar">
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par nom, poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="filter-wrap">
          <i className="fas fa-filter"></i>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
        <div className="filter-wrap">
          <i className="fas fa-briefcase"></i>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les rôles</option>
            <option value="Secrétaire">Secrétaire</option>
            <option value="Stagiaire">Stagiaire</option>
            <option value="Comptable">Comptable</option>
            <option value="Assistante">Assistante</option>
            <option value="Archiviste">Archiviste</option>
          </select>
        </div>
        <span className="results-count">{filteredStaff.length} membre{filteredStaff.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Staff Grid ── */}
      {filteredStaff.length > 0 ? (
        <div className="staff-grid">
          {filteredStaff.map(membre => (
            <div key={membre.id} className="staff-card">
              {/* Card Top */}
              <div className="scard-top">
                <div className="scard-avatar">
                  {membre.prenom.charAt(0)}{membre.nom.charAt(0)}
                </div>
                <div className="scard-identity">
                  <h3>{membre.prenom} {membre.nom}</h3>
                  <span className={`scard-status ${getStatusClass(membre.statut)}`}>
                    {membre.statut}
                  </span>
                </div>
              </div>

              {/* Card Poste */}
              <div className="scard-poste" style={{ color: getRoleColor(membre.role) }}>
                <i className="fas fa-briefcase"></i> {membre.poste}
              </div>

              {/* Card Info */}
              <div className="scard-info">
                <div className="sinfo-row">
                  <i className="fas fa-tag"></i>
                  <span>{membre.role}</span>
                </div>
                <div className="sinfo-row">
                  <i className="fas fa-phone"></i>
                  <span>{membre.tel}</span>
                </div>
                <div className="sinfo-row">
                  <i className="fas fa-envelope"></i>
                  <span>{membre.email}</span>
                </div>
                <div className="sinfo-row">
                  <i className="fas fa-tasks"></i>
                  <span>{membre.taches.filter(t => t.statut === 'En cours').length} tâche(s) en cours</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="scard-actions">
                <button
                  className="scard-btn scard-btn-primary"
                  onClick={() => handleViewDetail(membre.id)}
                >
                  <i className="fas fa-eye"></i> Détails
                </button>
                <button
                  className="scard-btn scard-btn-secondary"
                  onClick={() => handleOpenModal(membre)}
                >
                  <i className="fas fa-info-circle"></i> Aperçu
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>Aucun membre trouvé</p>
          <small>Essayez de modifier vos filtres de recherche</small>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL APERÇU RAPIDE
      ══════════════════════════════ */}
      {selectedStaff && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div
              className="modal-hero"
              style={{ background: `linear-gradient(135deg, ${getRoleColor(selectedStaff.role)}, ${getRoleColor(selectedStaff.role)}cc)` }}
            >
              <div className="modal-avatar">
                {selectedStaff.prenom.charAt(0)}{selectedStaff.nom.charAt(0)}
              </div>
              <div className="modal-identity">
                <h2>{selectedStaff.prenom} {selectedStaff.nom}</h2>
                <span className={`scard-status ${getStatusClass(selectedStaff.statut)}`}>
                  {selectedStaff.statut}
                </span>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-scroll">

              {/* ── Informations personnelles ── */}
              <div className="modal-info-grid">
                <div className="minfo-item">
                  <i className="fas fa-briefcase"></i>
                  <div>
                    <label>Poste</label>
                    <p>{selectedStaff.poste}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-tag"></i>
                  <div>
                    <label>Rôle</label>
                    <p style={{ color: getRoleColor(selectedStaff.role) }}>{selectedStaff.role}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-calendar-plus"></i>
                  <div>
                    <label>Date d'embauche</label>
                    <p>{selectedStaff.dateEmbauche}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <label>Téléphone</label>
                    <p>{selectedStaff.tel}</p>
                  </div>
                </div>
                <div className="minfo-item minfo-full">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <label>Email</label>
                    <p>{selectedStaff.email}</p>
                  </div>
                </div>
              </div>

              {/* ── Compétences ── */}
              <div className="competences-section">
                <h3><i className="fas fa-star"></i> Compétences</h3>
                <div className="competences-tags">
                  {selectedStaff.competences.map((comp, i) => (
                    <span key={i} className="competence-tag">{comp}</span>
                  ))}
                </div>
              </div>

              {/* ── Tâches en cours ── */}
              <div className="history-section">
                <button
                  className={`history-header ${openSections.taches ? 'is-open' : ''}`}
                  onClick={() => toggleSection('taches')}
                >
                  <div className="history-icon" style={{ background: 'linear-gradient(135deg, #dbeafe, #93c5fd)', color: '#1e3a8a' }}>
                    <i className="fas fa-tasks"></i>
                  </div>
                  <h3>Tâches</h3>
                  <span className="history-badge">{selectedStaff.taches.length}</span>
                  <i className={`fas fa-chevron-${openSections.taches ? 'up' : 'down'} chevron-icon`}></i>
                </button>

                {openSections.taches && (
                  <div className="history-content">
                    {selectedStaff.taches.length === 0 ? (
                      <div className="history-empty">
                        <i className="fas fa-tasks"></i>
                        <p>Aucune tâche assignée</p>
                      </div>
                    ) : (
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Tâche</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStaff.taches.map((tache, i) => (
                            <tr key={i} className={tache.statut === 'En cours' ? 'highlight-row' : ''}>
                              <td>{tache.titre}</td>
                              <td>
                                <span className={`status-pill ${tache.statut === 'En cours' ? 'badge-progress' : tache.statut === 'Terminé' ? 'badge-closed' : 'badge-upcoming'}`}>
                                  {tache.statut}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* ── Formations ── */}
              <div className="history-section">
                <button
                  className={`history-header ${openSections.formations ? 'is-open' : ''}`}
                  onClick={() => toggleSection('formations')}
                >
                  <div className="history-icon" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' }}>
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <h3>Formations</h3>
                  <span className="history-badge">{selectedStaff.formations.length}</span>
                  <i className={`fas fa-chevron-${openSections.formations ? 'up' : 'down'} chevron-icon`}></i>
                </button>

                {openSections.formations && (
                  <div className="history-content">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Formation</th>
                          <th>Organisme</th>
                          <th>Année</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaff.formations.map((formation, i) => (
                          <tr key={i}>
                            <td>{formation.titre}</td>
                            <td>{formation.organisme}</td>
                            <td>{formation.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button className="mfooter-btn mfooter-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i> Fermer
              </button>
              <button
                className="mfooter-btn mfooter-email"
                onClick={() => { handleCloseModal(); handleViewDetail(selectedStaff.id); }}
              >
                <i className="fas fa-arrow-right"></i> Page complète
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staffav;
