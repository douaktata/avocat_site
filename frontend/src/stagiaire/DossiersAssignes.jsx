import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases } from '../api';
import './DossiersAssignes.css';

const STATUS_MAP = { OPEN: 'en_cours', PENDING: 'en_attente', CLOSED: 'ferme' };
const STATUS_LABEL = { en_cours: 'En cours', en_attente: 'En attente', ferme: 'Ferme' };
const STATUS_CLASS = { en_cours: 'status-progress', en_attente: 'status-waiting', ferme: 'status-pending' };

const DossiersAssignes = () => {
  const navigate = useNavigate();

  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getCases()
      .then(res => setDossiers(res.data))
      .catch(() => setError('Impossible de charger les dossiers'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: dossiers.length,
    enCours: dossiers.filter(d => d.status === 'OPEN').length,
    urgents: 0,
  };

  const getStatutLocal = (status) => STATUS_MAP[status] || 'en_cours';

  const handleViewDossier = (dossier) => {
    setSelectedDossier(dossier);
    setShowModal(true);
  };

  const handleAccessDocuments = () => {
    navigate(`/stagiaire/dossiers/${selectedDossier.idc}/documents`, {
      state: { dossier: selectedDossier },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (loading) return <div><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="fas fa-folder-open"></i> Mes Dossiers Assignes</h1>
          <p className="page-description">Dossiers du cabinet - Acces supervise</p>
        </div>
      </div>

      <div className="access-info">
        <div className="info-icon"><i className="fas fa-shield-alt"></i></div>
        <div className="info-content">
          <h4>Acces limite aux dossiers assignes</h4>
          <p>Vous pouvez consulter les informations, documents et effectuer les taches qui vous sont confiees. Toute action importante necessite la validation de l'avocate responsable.</p>
        </div>
      </div>

      <div className="dossiers-stats">
        <div className="stat-box stat-total">
          <div className="stat-icon"><i className="fas fa-folder"></i></div>
          <div className="stat-info"><h3>{stats.total}</h3><p>Dossiers assignes</p></div>
        </div>
        <div className="stat-box stat-progress">
          <div className="stat-icon"><i className="fas fa-spinner"></i></div>
          <div className="stat-info"><h3>{stats.enCours}</h3><p>En cours</p></div>
        </div>
        <div className="stat-box stat-urgent">
          <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
          <div className="stat-info"><h3>{stats.urgents}</h3><p>Urgents</p></div>
        </div>
      </div>

      {dossiers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-folder-open"></i>
          <p>Aucun dossier trouve</p>
        </div>
      ) : (
        <div className="dossiers-grid">
          {dossiers.map(dossier => {
            const statutLocal = getStatutLocal(dossier.status);
            return (
              <div key={dossier.idc} className="dossier-card">
                <div className="card-header">
                  <div className="dossier-number">
                    <i className="fas fa-file-alt"></i>
                    <span>{dossier.case_number}</span>
                  </div>
                  <span className="type-badge">{dossier.case_type || '-'}</span>
                </div>
                <div className="card-body">
                  <h3>{dossier.client_full_name || '-'}</h3>
                  <div className="dossier-meta">
                    <div className="meta-item">
                      <i className="fas fa-calendar-plus"></i>
                      <span>Ouvert le {formatDate(dossier.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className={`status-badge ${STATUS_CLASS[statutLocal] || ''}`}>
                    {STATUS_LABEL[statutLocal] || statutLocal}
                  </span>
                  <button className="btn-view" onClick={() => handleViewDossier(dossier)}>
                    <i className="fas fa-eye"></i> Consulter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedDossier && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-folder-open"></i> {selectedDossier.case_number}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="supervised-banner">
                <i className="fas fa-user-shield"></i>
                <span>Consultation supervisee - Acces stagiaire</span>
              </div>
              <div className="dossier-details">
                <div className="detail-section">
                  <h4>Informations generales</h4>
                  <div className="detail-grid">
                    <div className="detail-item"><label>Numero:</label><p>{selectedDossier.case_number}</p></div>
                    <div className="detail-item"><label>Client:</label><p>{selectedDossier.client_full_name || '-'}</p></div>
                    <div className="detail-item"><label>Type:</label><p>{selectedDossier.case_type || '-'}</p></div>
                    <div className="detail-item">
                      <label>Statut:</label>
                      <span className={`status-badge ${STATUS_CLASS[getStatutLocal(selectedDossier.status)] || ''}`}>
                        {STATUS_LABEL[getStatutLocal(selectedDossier.status)] || selectedDossier.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="detail-section">
                  <h4>Dates</h4>
                  <p>Ouvert le {formatDate(selectedDossier.created_at)}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
              <button className="btn btn-primary" onClick={handleAccessDocuments}>
                <i className="fas fa-folder-open"></i> Acceder aux documents
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DossiersAssignes;
