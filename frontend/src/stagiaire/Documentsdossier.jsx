import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getCase,
  getTasksByAssignee,
  updateTask,
  getDocumentsByCase,
  getDocumentsByUser,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '../api';
import './DocumentsDossier.css';

const STATUS_TO_LOCAL = { PENDING: 'a_faire', IN_PROGRESS: 'en_cours', COMPLETED: 'termine' };
const PRIORITY_TO_LOCAL = { HIGH: 'urgente', MEDIUM: 'haute', LOW: 'normale' };
const LOCAL_STATUS_TO_API = { a_faire: 'PENDING', en_cours: 'IN_PROGRESS', termine: 'COMPLETED' };

const mapTask = (t) => ({
  id: t.id,
  titre: t.title,
  description: t.description,
  assignePar: t.createdByName || '-',
  priorite: PRIORITY_TO_LOCAL[t.priority] || 'normale',
  statut: STATUS_TO_LOCAL[t.status] || 'a_faire',
  echeance: t.deadline ? t.deadline.split('T')[0] : null,
  createdById: t.createdById,
  feedback: t.feedback || null,
  _raw: t,
});

const Documentsdossier = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dossierId } = useParams();
  const { user } = useAuth();

  const [dossier, setDossier] = useState(location.state?.dossier || null);
  const [taches, setTaches] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('taches');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadAll = useCallback(() => {
    if (!user?.idu || !dossierId) return;
    setLoading(true);
    const casePromise = dossier ? Promise.resolve({ data: dossier }) : getCase(dossierId);
    Promise.all([
      casePromise,
      getTasksByAssignee(user.idu),
      getDocumentsByCase(dossierId),
      getDocumentsByUser(user.idu),
    ])
      .then(([caseRes, tasksRes, docsRes, contribRes]) => {
        if (!dossier) setDossier(caseRes.data);
        const allTasks = tasksRes.data.map(mapTask);
        setTaches(allTasks.filter(t => t.createdById !== user.idu));
        setDocuments(docsRes.data);
        setContributions(contribRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dossierId, user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleChangeStatut = (tacheId, nouveauStatut) => {
    const tache = taches.find(t => t.id === tacheId);
    if (!tache) return;
    const payload = {
      ...tache._raw,
      status: LOCAL_STATUS_TO_API[nouveauStatut],
      assignedTo: tache._raw.assignedToId ? { idu: tache._raw.assignedToId } : null,
      createdBy: tache._raw.createdById ? { idu: tache._raw.createdById } : null,
    };
    updateTask(tacheId, payload)
      .then(() => setTaches(prev => prev.map(t =>
        t.id === tacheId ? { ...t, statut: nouveauStatut } : t
      )))
      .catch(console.error);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !user?.idu) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadedBy', user.idu);
    formData.append('caseId', dossierId);
    try {
      await uploadDocument(formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      loadAll();
      setActiveTab('contributions');
    } catch {
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await downloadDocument(doc.idd);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger le document');
    }
  };

  const handleDeleteContrib = async (idd) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await deleteDocument(idd);
      setContributions(prev => prev.filter(d => d.idd !== idd));
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const getPriorityClass = (p) =>
    ({ urgente: 'priority-urgent', haute: 'priority-high', normale: 'priority-normal' }[p] || 'priority-normal');

  const getStatusClass = (s) =>
    ({ a_faire: 'status-todo', en_cours: 'status-progress', termine: 'status-done' }[s] || 'status-todo');

  const getFileIcon = (type) => {
    const icons = {
      PDF: { icon: 'fas fa-file-pdf', color: '#ef4444' },
      DOCX: { icon: 'fas fa-file-word', color: '#3b82f6' },
      XLSX: { icon: 'fas fa-file-excel', color: '#10b981' },
    };
    return icons[(type || '').toUpperCase()] || { icon: 'fas fa-file', color: '#6b7280' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getJoursRestants = (echeance) => {
    if (!echeance) return null;
    return Math.ceil((new Date(echeance) - new Date()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  if (!dossier) {
    return (
      <div className="error-page">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Dossier non trouvé</h2>
        <button className="btn-back" onClick={() => navigate('/stagiaire/dossiers')}>
          <i className="fas fa-arrow-left"></i> Retour aux dossiers
        </button>
      </div>
    );
  }

  const tachesEnCours = taches.filter(t => t.statut !== 'termine').length;

  return (
    <div className="dossier-work-page">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-btn" onClick={() => navigate('/stagiaire/dossiers')}>
          <i className="fas fa-folder-open"></i> Mes dossiers
        </button>
        <i className="fas fa-chevron-right"></i>
        <span className="breadcrumb-current">{dossier.case_number || dossier.numero}</span>
      </div>

      {/* Header */}
      <div className="work-header">
        <div className="dossier-badge"><i className="fas fa-briefcase"></i></div>
        <div className="dossier-info-header">
          <h1>{dossier.case_number || dossier.numero} — {dossier.client_full_name || dossier.client}</h1>
          <div className="dossier-meta-header">
            <span className="meta-tag"><i className="fas fa-tag"></i> {dossier.case_type || dossier.type || '-'}</span>
            <span className="meta-tag"><i className="fas fa-calendar-alt"></i> Ouvert le {formatDate(dossier.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="work-stats">
        <div className="wstat-item">
          <div className="wstat-icon wstat-tasks"><i className="fas fa-tasks"></i></div>
          <div><span>{taches.length}</span><p>Tâches assignées</p></div>
        </div>
        <div className="wstat-item">
          <div className="wstat-icon wstat-progress"><i className="fas fa-spinner"></i></div>
          <div><span>{tachesEnCours}</span><p>En cours</p></div>
        </div>
        <div className="wstat-item">
          <div className="wstat-icon wstat-docs"><i className="fas fa-file-alt"></i></div>
          <div><span>{documents.length}</span><p>Documents accessibles</p></div>
        </div>
        <div className="wstat-item">
          <div className="wstat-icon wstat-validated"><i className="fas fa-cloud-upload-alt"></i></div>
          <div><span>{contributions.length}</span><p>Mes contributions</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'taches' ? 'active' : ''}`} onClick={() => setActiveTab('taches')}>
          <i className="fas fa-tasks"></i> Mes tâches ({taches.length})
        </button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
          <i className="fas fa-folder-open"></i> Documents du dossier ({documents.length})
        </button>
        <button className={`tab-btn ${activeTab === 'contributions' ? 'active' : ''}`} onClick={() => setActiveTab('contributions')}>
          <i className="fas fa-upload"></i> Mes contributions ({contributions.length})
        </button>
      </div>

      <div className="tab-content">

        {/* TAB: TACHES */}
        {activeTab === 'taches' && (
          <div className="taches-section">
            <div className="section-header">
              <h2><i className="fas fa-clipboard-list"></i> Tâches assignées par le cabinet</h2>
              <span className="count-badge">{taches.length} tâches</span>
            </div>

            {taches.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-clipboard-check"></i>
                <p>Aucune tâche assignée pour le moment</p>
                <small>Les tâches assignées par l'avocat apparaîtront ici</small>
              </div>
            ) : (
              <div className="taches-list">
                {taches.map(tache => {
                  const joursRestants = getJoursRestants(tache.echeance);
                  return (
                    <div key={tache.id} className={`tache-card ${getStatusClass(tache.statut)}`}>
                      <div className="tache-header">
                        <div className="tache-left">
                          <h3>{tache.titre}</h3>
                          <p className="tache-desc">{tache.description}</p>
                        </div>
                        <div className="tache-badges">
                          <span className={`priority-badge ${getPriorityClass(tache.priorite)}`}>
                            {tache.priorite === 'urgente' ? 'Urgente' : tache.priorite === 'haute' ? 'Haute' : 'Normale'}
                          </span>
                          <span className={`status-badge ${getStatusClass(tache.statut)}`}>
                            {tache.statut === 'a_faire' ? 'À faire' : tache.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                          </span>
                        </div>
                      </div>

                      <div className="tache-meta">
                        <span className="meta-item">
                          <i className="fas fa-user-tie"></i> Assignée par {tache.assignePar}
                        </span>
                        {tache.echeance && (
                          <span className={`meta-item ${joursRestants !== null && joursRestants <= 2 ? 'urgent' : ''}`}>
                            <i className="fas fa-calendar-alt"></i>
                            {joursRestants === 0 ? "Échéance aujourd'hui" :
                             joursRestants === 1 ? 'Échéance demain' :
                             joursRestants < 0 ? `En retard de ${Math.abs(joursRestants)} jour(s)` :
                             `Échéance dans ${joursRestants} jours (${formatDate(tache.echeance)})`}
                          </span>
                        )}
                      </div>

                      {tache.feedback && (
                        <div className="tache-feedback">
                          <div className="feedback-label">
                            <i className="fas fa-user-tie"></i> Feedback de l'avocat
                            {tache.statut === 'en_cours' && (
                              <span className="feedback-badge-revoir">À revoir</span>
                            )}
                            {tache.statut === 'termine' && (
                              <span className="feedback-badge-valide">Validé</span>
                            )}
                          </div>
                          <p className="feedback-text">{tache.feedback}</p>
                        </div>
                      )}

                      <div className="tache-actions">
                        <div className="statut-controls">
                          <label>Statut :</label>
                          <div className="statut-buttons">
                            {[['a_faire', 'À faire'], ['en_cours', 'En cours'], ['termine', 'Terminé']].map(([val, label]) => (
                              <button
                                key={val}
                                className={`statut-btn ${tache.statut === val ? 'active' : ''}`}
                                onClick={() => handleChangeStatut(tache.id, val)}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="documents-section">
            <div className="section-header">
              <h2><i className="fas fa-folder-open"></i> Documents du dossier</h2>
              <span className="count-badge">{documents.length} documents</span>
            </div>

            {documents.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>Aucun document pour ce dossier</p>
              </div>
            ) : (
              <div className="docs-grid">
                {documents.map(doc => {
                  const fileIcon = getFileIcon(doc.file_type);
                  return (
                    <div key={doc.idd} className="doc-card-consult">
                      <div className="doc-icon" style={{ color: fileIcon.color }}>
                        <i className={fileIcon.icon}></i>
                      </div>
                      <div className="doc-info">
                        <h4>{doc.file_name}</h4>
                        <div className="doc-meta">
                          <span className="doc-cat-badge">{doc.file_type || 'AUTRE'}</span>
                        </div>
                        <div className="doc-author">
                          Ajouté le {formatDate(doc.uploaded_at)}
                        </div>
                      </div>
                      <button className="btn-download" onClick={() => handleDownload(doc)}>
                        <i className="fas fa-download"></i> Télécharger
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: CONTRIBUTIONS */}
        {activeTab === 'contributions' && (
          <div className="contributions-section">
            <div className="section-header">
              <h2><i className="fas fa-cloud-upload-alt"></i> Mes contributions uploadées</h2>
              <button className="btn-upload-main" onClick={() => setShowUploadModal(true)}>
                <i className="fas fa-upload"></i> Uploader un document
              </button>
            </div>

            {contributions.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>Aucune contribution uploadée</p>
                <small>Uploadez vos travaux pour les soumettre à l'avocat</small>
              </div>
            ) : (
              <div className="contributions-list">
                {contributions.map(doc => {
                  const fileIcon = getFileIcon(doc.file_type);
                  return (
                    <div key={doc.idd} className="contrib-card">
                      <div className="contrib-icon" style={{ color: fileIcon.color }}>
                        <i className={fileIcon.icon}></i>
                      </div>
                      <div className="contrib-info">
                        <h4>{doc.file_name}</h4>
                        <div className="contrib-meta">
                          <span><i className="fas fa-calendar"></i> Uploadé le {formatDate(doc.uploaded_at)}</span>
                          <span className="doc-cat-badge">{doc.file_type || 'AUTRE'}</span>
                        </div>
                      </div>
                      <div className="contrib-actions">
                        <button className="doc-action-btn btn-download" onClick={() => handleDownload(doc)} title="Télécharger">
                          <i className="fas fa-download"></i>
                        </button>
                        <button className="doc-action-btn btn-delete" onClick={() => handleDeleteContrib(doc.idd)} title="Supprimer" style={{ color: '#ef4444' }}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-upload"></i> Uploader un document</h2>
              <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label><i className="fas fa-file"></i> Fichier *</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                      required
                    />
                    {selectedFile && (
                      <div className="selected-file">
                        <i className="fas fa-file"></i>
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  <small>Formats acceptés: PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  <i className="fas fa-upload"></i> {uploading ? 'Envoi...' : 'Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentsdossier;
