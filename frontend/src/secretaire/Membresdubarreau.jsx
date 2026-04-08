import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole } from '../api';
import './Membresdubarreau.css';

const MembresDuBarreau = () => {
  const navigate = useNavigate();

  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsersByRole('AVOCAT')
      .then(res => {
        setMembres(res.data.map(u => ({
          id: u.idu,
          nom: u.nom || '',
          prenom: u.prenom || '',
          titre: `Maître ${u.prenom || ''} ${u.nom || ''}`.trim(),
          specialite: '—',
          barreau: '—',
          anneeInscription: '—',
          email: u.email || '',
          tel: u.tel || '—',
          adresse: u.adresse || '—',
          statut: u.statut || 'Actif',
          affairesEnCours: [],
          audiences: [],
          formations: [],
        })));
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les membres du barreau');
        setLoading(false);
      });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMembre, setSelectedMembre] = useState(null);
  const [openSections, setOpenSections] = useState({});

  const filteredMembres = membres.filter(membre => {
    const fullName = `${membre.prenom} ${membre.nom}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (membre.specialite && membre.specialite.toLowerCase().includes(searchTerm.toLowerCase())) ||
      membre.tel.includes(searchTerm);
    const matchesStatus = statusFilter === '' || membre.statut.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (membre) => {
    setSelectedMembre(membre);
    setOpenSections({});
  };

  const handleCloseModal = () => {
    setSelectedMembre(null);
    setOpenSections({});
  };

  const handleViewDetail = (membreId) => {
    navigate(`/secretaire/barreau/${membreId}`);
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusClass = (status) => {
    const classes = { Actif: 'status-actif', Inactif: 'status-inactif' };
    return classes[status] || '';
  };

  const stats = {
    total: membres.length,
    actifs: membres.filter(m => m.statut === 'Actif').length,
    affaires: 0,
    audiences: 0,
  };

  if (loading) return <div className="barreau-page"><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div className="barreau-page"><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="barreau-page">

      {/* ── Header ── */}
      <div className="barreau-header">
        <div>
          <h1 className="page-title">Membres du Barreau</h1>
          <p className="page-description">Annuaire des avocats et confrères du barreau</p>
        </div>
        <button className="btn-add-client">
          <i className="fas fa-user-plus"></i> Ajouter un membre
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="barreau-kpi">
        <div className="kpi-item kpi-total">
          <i className="fas fa-gavel"></i>
          <div><span>{stats.total}</span><p>Total</p></div>
        </div>
        <div className="kpi-item kpi-actif">
          <i className="fas fa-user-check"></i>
          <div><span>{stats.actifs}</span><p>Actifs</p></div>
        </div>
        <div className="kpi-item kpi-affaires">
          <i className="fas fa-folder-open"></i>
          <div><span>{stats.affaires}</span><p>Affaires</p></div>
        </div>
        <div className="kpi-item kpi-audiences">
          <i className="fas fa-calendar-alt"></i>
          <div><span>{stats.audiences}</span><p>Audiences</p></div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="barreau-toolbar">
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par nom..."
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
        <span className="results-count">{filteredMembres.length} membre{filteredMembres.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Membres Grid ── */}
      {filteredMembres.length > 0 ? (
        <div className="barreau-grid">
          {filteredMembres.map(membre => (
            <div key={membre.id} className="membre-card">
              <div className="mcard-top">
                <div className="mcard-avatar">
                  {membre.prenom.charAt(0)}{membre.nom.charAt(0)}
                </div>
                <div className="mcard-identity">
                  <h3>{membre.titre}</h3>
                  <span className={`mcard-status ${getStatusClass(membre.statut)}`}>
                    {membre.statut}
                  </span>
                </div>
              </div>

              <div className="minfo-row" style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                <i className="fas fa-balance-scale"></i> <span>{membre.specialite}</span>
              </div>

              <div className="mcard-info">
                <div className="minfo-row">
                  <i className="fas fa-envelope"></i>
                  <span>{membre.email}</span>
                </div>
                <div className="minfo-row">
                  <i className="fas fa-phone"></i>
                  <span>{membre.tel}</span>
                </div>
              </div>

              <div className="mcard-actions">
                <button
                  className="mcard-btn mcard-btn-primary"
                  onClick={() => handleViewDetail(membre.id)}
                >
                  <i className="fas fa-eye"></i> Détails
                </button>
                <button
                  className="mcard-btn mcard-btn-secondary"
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

      {/* ── Modal aperçu rapide ── */}
      {selectedMembre && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>

            <div className="modal-hero">
              <div className="modal-avatar">
                {selectedMembre.prenom.charAt(0)}{selectedMembre.nom.charAt(0)}
              </div>
              <div className="modal-identity">
                <h2>{selectedMembre.titre}</h2>
                <span className={`mcard-status ${getStatusClass(selectedMembre.statut)}`}>
                  {selectedMembre.statut}
                </span>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-scroll">
              <div className="modal-info-grid">
                <div className="minfo-item">
                  <i className="fas fa-phone"></i>
                  <div><label>Téléphone</label><p>{selectedMembre.tel}</p></div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-envelope"></i>
                  <div><label>Email</label><p>{selectedMembre.email}</p></div>
                </div>
                <div className="minfo-item minfo-full">
                  <i className="fas fa-map-marker-alt"></i>
                  <div><label>Adresse</label><p>{selectedMembre.adresse}</p></div>
                </div>
              </div>

              <div className="history-section">
                <button
                  className={`history-header ${openSections.affaires ? 'is-open' : ''}`}
                  onClick={() => toggleSection('affaires')}
                >
                  <div className="history-icon" style={{ background: 'linear-gradient(135deg, #dbeafe, #93c5fd)', color: '#1e3a8a' }}>
                    <i className="fas fa-folder-open"></i>
                  </div>
                  <h3>Affaires en cours</h3>
                  <span className="history-badge">0</span>
                  <i className={`fas fa-chevron-${openSections.affaires ? 'up' : 'down'} chevron-icon`}></i>
                </button>
                {openSections.affaires && (
                  <div className="history-content">
                    <div className="history-empty">
                      <i className="fas fa-folder"></i>
                      <p>Aucune affaire en cours</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="mfooter-btn mfooter-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i> Fermer
              </button>
              <button
                className="mfooter-btn mfooter-email"
                onClick={() => { handleCloseModal(); handleViewDetail(selectedMembre.id); }}
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

export default MembresDuBarreau;
