import React, { useState, useEffect } from 'react';
import { getCases, getTrialsByCase, getDocumentsByCase } from '../api';
import './Affairesjuridiques.css';

const STATUS_MAP = {
  OPEN:    { label: 'En cours',   cls: 'status-encours' },
  CLOSED:  { label: 'Clôturé',   cls: 'status-cloture' },
  PENDING: { label: 'En attente', cls: 'status-encours' },
};

const getStatutLabel = (status) => STATUS_MAP[status]?.label || status;
const getStatutClass = (status) => STATUS_MAP[status]?.cls || '';

const getTypeColor = (type) => {
  const colors = {
    'Famille':    '#10b981',
    'Commercial': '#3b82f6',
    'Immobilier': '#f59e0b',
    'Travail':    '#8b5cf6',
    'Civil':      '#64748b',
    'Penal':      '#ef4444',
  };
  return colors[type] || '#64748b';
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const AffairesJuridiques = () => {
  const [affaires, setAffaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedAffaire, setSelectedAffaire] = useState(null);
  const [openSections, setOpenSections] = useState({});

  // Modal lazy data
  const [modalTrials, setModalTrials] = useState([]);
  const [modalDocs, setModalDocs] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    getCases()
      .then(res => setAffaires(res.data))
      .catch(() => setError('Impossible de charger les affaires'))
      .finally(() => setLoading(false));
  }, []);

  const filteredAffaires = affaires.filter(a => {
    const matchesSearch =
      (a.case_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.case_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.client_full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || a.status === statusFilter;
    const matchesType = typeFilter === '' || a.case_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleOpenModal = (affaire) => {
    setSelectedAffaire(affaire);
    setOpenSections({});
    setModalTrials([]);
    setModalDocs([]);
    setModalLoading(true);
    Promise.all([
      getTrialsByCase(affaire.idc).catch(() => ({ data: [] })),
      getDocumentsByCase(affaire.idc).catch(() => ({ data: [] })),
    ]).then(([trialsRes, docsRes]) => {
      setModalTrials(trialsRes.data || []);
      setModalDocs(docsRes.data || []);
    }).finally(() => setModalLoading(false));
  };

  const handleCloseModal = () => {
    setSelectedAffaire(null);
    setOpenSections({});
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const types = [...new Set(affaires.map(a => a.case_type).filter(Boolean))];

  const stats = {
    total:    affaires.length,
    enCours:  affaires.filter(a => a.status === 'OPEN').length,
    clotures: affaires.filter(a => a.status === 'CLOSED').length,
    pending:  affaires.filter(a => a.status === 'PENDING').length,
  };

  if (loading) return <div className="affaires-page"><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error)   return <div className="affaires-page"><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="affaires-page">

      {/* ── Header ── */}
      <div className="affaires-header">
        <div>
          <h1 className="page-title">Affaires Juridiques</h1>
          <p className="page-description">Gérez l'ensemble des dossiers et affaires du cabinet</p>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="affaires-kpi">
        <div className="kpi-item kpi-total">
          <i className="fas fa-folder-open"></i>
          <div><span>{stats.total}</span><p>Total</p></div>
        </div>
        <div className="kpi-item kpi-encours">
          <i className="fas fa-spinner"></i>
          <div><span>{stats.enCours}</span><p>En cours</p></div>
        </div>
        <div className="kpi-item kpi-clotures">
          <i className="fas fa-check-circle"></i>
          <div><span>{stats.clotures}</span><p>Clôturés</p></div>
        </div>
        <div className="kpi-item kpi-audiences">
          <i className="fas fa-clock"></i>
          <div><span>{stats.pending}</span><p>En attente</p></div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="affaires-toolbar">
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par numéro, type ou client..."
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
            <option value="OPEN">En cours</option>
            <option value="CLOSED">Clôturé</option>
            <option value="PENDING">En attente</option>
          </select>
        </div>
        <div className="filter-wrap">
          <i className="fas fa-tag"></i>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tous les types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <span className="results-count">{filteredAffaires.length} affaire{filteredAffaires.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Affaires Grid ── */}
      {filteredAffaires.length > 0 ? (
        <div className="affaires-grid">
          {filteredAffaires.map(affaire => (
            <div key={affaire.idc} className="affaire-card">
              <div className="acard-top">
                <div className="acard-numero" style={{ borderColor: getTypeColor(affaire.case_type) }}>
                  {affaire.case_number}
                </div>
                <span className={`acard-status ${getStatutClass(affaire.status)}`}>
                  {getStatutLabel(affaire.status)}
                </span>
              </div>

              <h3 className="acard-title">{affaire.case_number}</h3>

              <div className="acard-type" style={{ color: getTypeColor(affaire.case_type) }}>
                <i className="fas fa-tag"></i> {affaire.case_type || '—'}
              </div>

              <div className="acard-info">
                <div className="ainfo-row">
                  <i className="fas fa-user"></i>
                  <span>{affaire.client_full_name || '—'}</span>
                </div>
                <div className="ainfo-row">
                  <i className="fas fa-calendar"></i>
                  <span>Ouverture : {formatDate(affaire.created_at)}</span>
                </div>
                {affaire.priority && (
                  <div className="ainfo-row">
                    <i className="fas fa-flag"></i>
                    <span>Priorité : {affaire.priority}</span>
                  </div>
                )}
              </div>

              <div className="acard-actions">
                <button
                  className="acard-btn acard-btn-primary"
                  onClick={() => handleOpenModal(affaire)}
                >
                  <i className="fas fa-eye"></i> Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>Aucune affaire trouvée</p>
          <small>Essayez de modifier vos filtres de recherche</small>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL DÉTAILS AFFAIRE
      ══════════════════════════════ */}
      {selectedAffaire && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="modal-hero" style={{ background: `linear-gradient(135deg, ${getTypeColor(selectedAffaire.case_type)}, ${getTypeColor(selectedAffaire.case_type)}dd)` }}>
              <div className="modal-numero">{selectedAffaire.case_number}</div>
              <div className="modal-identity">
                <h2>{selectedAffaire.case_number}</h2>
                <span className={`acard-status ${getStatutClass(selectedAffaire.status)}`}>
                  {getStatutLabel(selectedAffaire.status)}
                </span>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-scroll">

              {/* ── Informations générales ── */}
              <div className="modal-info-grid">
                <div className="minfo-item">
                  <i className="fas fa-tag"></i>
                  <div>
                    <label>Type d'affaire</label>
                    <p style={{ color: getTypeColor(selectedAffaire.case_type) }}>{selectedAffaire.case_type || '—'}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-user"></i>
                  <div>
                    <label>Client</label>
                    <p>{selectedAffaire.client_full_name || '—'}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-flag"></i>
                  <div>
                    <label>Priorité</label>
                    <p>{selectedAffaire.priority || '—'}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-calendar-plus"></i>
                  <div>
                    <label>Date d'ouverture</label>
                    <p>{formatDate(selectedAffaire.created_at)}</p>
                  </div>
                </div>
                {selectedAffaire.tribunalName && (
                  <div className="minfo-item">
                    <i className="fas fa-landmark"></i>
                    <div>
                      <label>Tribunal</label>
                      <p>{selectedAffaire.tribunalName}</p>
                    </div>
                  </div>
                )}
                {selectedAffaire.judgeAssigned && (
                  <div className="minfo-item">
                    <i className="fas fa-gavel"></i>
                    <div>
                      <label>Juge assigné</label>
                      <p>{selectedAffaire.judgeAssigned}</p>
                    </div>
                  </div>
                )}
              </div>

              {modalLoading && <p style={{ padding: '1rem', color: '#6b7280' }}>Chargement des détails...</p>}

              {/* ── Audiences (Trials) ── */}
              {!modalLoading && (
                <div className="history-section">
                  <button
                    className={`history-header ${openSections.audiences ? 'is-open' : ''}`}
                    onClick={() => toggleSection('audiences')}
                  >
                    <div className="history-icon" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }}>
                      <i className="fas fa-gavel"></i>
                    </div>
                    <h3>Audiences</h3>
                    <span className="history-badge">{modalTrials.length}</span>
                    <i className={`fas fa-chevron-${openSections.audiences ? 'up' : 'down'} chevron-icon`}></i>
                  </button>

                  {openSections.audiences && (
                    <div className="history-content">
                      {modalTrials.length === 0 ? (
                        <div className="history-empty">
                          <i className="fas fa-gavel"></i>
                          <p>Aucune audience programmée</p>
                        </div>
                      ) : (
                        <table className="history-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Lieu</th>
                              <th>Avocat</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalTrials.map((trial) => (
                              <tr key={trial.idt}>
                                <td>{formatDate(trial.hearing_date)}</td>
                                <td>{trial.location || '—'}</td>
                                <td>{trial.assigned_lawyer_name || '—'}</td>
                                <td>
                                  <span className={`status-pill ${trial.status === 'SCHEDULED' ? 'badge-upcoming' : 'badge-done'}`}>
                                    {trial.status === 'SCHEDULED' ? 'Planifiée' : trial.status === 'COMPLETED' ? 'Effectuée' : trial.status}
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
              )}

              {/* ── Documents ── */}
              {!modalLoading && (
                <div className="history-section">
                  <button
                    className={`history-header ${openSections.documents ? 'is-open' : ''}`}
                    onClick={() => toggleSection('documents')}
                  >
                    <div className="history-icon" style={{ background: 'linear-gradient(135deg, #dbeafe, #93c5fd)', color: '#1e3a8a' }}>
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <h3>Documents</h3>
                    <span className="history-badge">{modalDocs.length}</span>
                    <i className={`fas fa-chevron-${openSections.documents ? 'up' : 'down'} chevron-icon`}></i>
                  </button>

                  {openSections.documents && (
                    <div className="history-content">
                      {modalDocs.length === 0 ? (
                        <div className="history-empty">
                          <i className="fas fa-file-alt"></i>
                          <p>Aucun document</p>
                        </div>
                      ) : (
                        <table className="history-table">
                          <thead>
                            <tr>
                              <th>Nom du fichier</th>
                              <th>Type</th>
                              <th>Ajouté par</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalDocs.map((doc) => (
                              <tr key={doc.idd}>
                                <td>{doc.file_name}</td>
                                <td>{doc.file_type || '—'}</td>
                                <td>{doc.uploaded_by_name || '—'}</td>
                                <td>{formatDate(doc.uploaded_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button className="mfooter-btn mfooter-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffairesJuridiques;
