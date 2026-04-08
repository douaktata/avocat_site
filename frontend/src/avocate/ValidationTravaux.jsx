import React, { useState, useEffect } from 'react';
import { getTasks, updateTask, getUsersByRole, getDocumentsByTask, downloadDocument } from '../api';
import './ValidationTravaux.css';

const PRIO_MAP = { HIGH: 'haute', MEDIUM: 'moyenne', LOW: 'basse' };

const API_BASE = 'http://localhost:8081';

// Determine display status from backend status + feedback field
const resolveStatut = (status, feedback) => {
  if (status === 'COMPLETED') return feedback ? 'valide' : 'soumis';
  if (status === 'IN_PROGRESS') return feedback ? 'a_revoir' : 'en_cours';
  return 'en_attente';
};

const mapTask = (t) => {
  const nameParts = (t.assignedToName || '').split(' ');
  const rawPhoto = t.assignedToPhotoUrl || '';
  return {
    id: t.id,
    stagiaireId: t.assignedToId,
    stagiaireNom: nameParts[0] || '-',
    stagiairePrenom: nameParts.slice(1).join(' ') || '',
    stagiairePhoto: rawPhoto
      ? rawPhoto.startsWith('http') ? rawPhoto : `${API_BASE}${rawPhoto}`
      : null,
    titre: t.title || '',
    dateEcheance: t.deadline ? t.deadline.split('T')[0] : '',
    dateEnvoi: t.deadline || new Date().toISOString(),
    statut: resolveStatut(t.status, t.feedback),
    priorite: PRIO_MAP[t.priority] || 'moyenne',
    description: t.description || '',
    feedback: t.feedback || null,
    rawPriority: t.priority || 'LOW',
  };
};

const getStatutInfo = (statut) => {
  switch (statut) {
    case 'soumis':
      return { class: 'statut-soumis', label: 'Soumis pour validation', icon: 'fas fa-paper-plane', color: '#8b5cf6' };
    case 'valide':
      return { class: 'statut-valide', label: 'Validé', icon: 'fas fa-check-circle', color: '#10b981' };
    case 'a_revoir':
      return { class: 'statut-revoir', label: 'À revoir', icon: 'fas fa-exclamation-triangle', color: '#f59e0b' };
    case 'en_cours':
      return { class: 'statut-encours', label: 'En cours', icon: 'fas fa-spinner', color: '#3b82f6' };
    default:
      return { class: 'statut-attente', label: 'En attente', icon: 'fas fa-clock', color: '#64748b' };
  }
};

const getPrioriteInfo = (priorite) => {
  switch (priorite) {
    case 'haute':   return { class: 'priorite-haute',   label: 'Haute',   icon: 'fas fa-arrow-up' };
    case 'moyenne': return { class: 'priorite-moyenne', label: 'Moyenne', icon: 'fas fa-minus' };
    default:        return { class: 'priorite-basse',   label: 'Basse',   icon: 'fas fa-arrow-down' };
  }
};

const ValidationTravaux = () => {
  const [travaux, setTravaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterStatut, setFilterStatut] = useState('');
  const [filterPriorite, setFilterPriorite] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTravail, setSelectedTravail] = useState(null);
  const [feedback, setFeedback] = useState({ action: '', commentaire: '', note: null, corrections: [] });
  const [newCorrection, setNewCorrection] = useState('');

  // Detail modal
  const [detailTravail, setDetailTravail] = useState(null);
  const [detailDocs, setDetailDocs] = useState([]);
  const [detailDocsLoading, setDetailDocsLoading] = useState(false);

  useEffect(() => {
    Promise.all([getTasks(), getUsersByRole('STAGIAIRE')])
      .then(([tasksRes, stagRes]) => {
        const stagiaireIds = new Set(stagRes.data.map(u => u.idu));
        const filtered = tasksRes.data
          .filter(t => stagiaireIds.has(t.assignedToId))
          .map(mapTask);
        setTravaux(filtered);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les travaux');
        setLoading(false);
      });
  }, []);

  const stats = {
    total: travaux.length,
    aValider: travaux.filter(t => t.statut === 'soumis').length,
    valides: travaux.filter(t => t.statut === 'valide').length,
    aRevoir: travaux.filter(t => t.statut === 'a_revoir').length,
  };

  const filteredTravaux = travaux.filter(travail => {
    const matchesSearch =
      travail.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${travail.stagiairePrenom} ${travail.stagiaireNom}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = filterStatut === '' || travail.statut === filterStatut;
    const matchesPriorite = filterPriorite === '' || travail.priorite === filterPriorite;
    return matchesSearch && matchesStatut && matchesPriorite;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const isUrgent = (dateEcheance) => {
    if (!dateEcheance) return false;
    const diff = new Date(dateEcheance) - new Date();
    return diff <= 24 * 60 * 60 * 1000 && diff > 0;
  };

  const handleOpenDetail = (travail) => {
    setDetailTravail(travail);
    setDetailDocs([]);
    setDetailDocsLoading(true);
    getDocumentsByTask(travail.id)
      .then(res => setDetailDocs(res.data))
      .catch(() => setDetailDocs([]))
      .finally(() => setDetailDocsLoading(false));
  };

  const handleDownloadDoc = async (doc) => {
    try {
      const res = await downloadDocument(doc.idd);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger le document');
    }
  };

  const getFileIcon = (type) => {
    const icons = { PDF: 'fa-file-pdf', DOCX: 'fa-file-word', XLSX: 'fa-file-excel', IMAGE: 'fa-file-image' };
    const colors = { PDF: '#ef4444', DOCX: '#3b82f6', XLSX: '#10b981', IMAGE: '#8b5cf6' };
    const t = (type || '').toUpperCase();
    return { icon: `fas ${icons[t] || 'fa-file'}`, color: colors[t] || '#64748b' };
  };

  const handleOpenFeedback = (travail, action) => {
    setSelectedTravail(travail);
    setFeedback({ action, commentaire: '', note: null, corrections: [] });
    setShowFeedbackModal(true);
  };

  const handleAddCorrection = () => {
    if (newCorrection.trim()) {
      setFeedback(f => ({ ...f, corrections: [...f.corrections, newCorrection.trim()] }));
      setNewCorrection('');
    }
  };

  const handleRemoveCorrection = (index) => {
    setFeedback(f => ({ ...f, corrections: f.corrections.filter((_, i) => i !== index) }));
  };

  const handleSubmitFeedback = () => {
    if (!feedback.commentaire.trim()) {
      alert('Veuillez ajouter un commentaire');
      return;
    }
    const newStatus = feedback.action === 'valider' ? 'COMPLETED' : 'IN_PROGRESS';
    const payload = {
      title: selectedTravail.titre,
      description: selectedTravail.description,
      deadline: selectedTravail.dateEcheance ? `${selectedTravail.dateEcheance}T00:00:00` : null,
      status: newStatus,
      priority: selectedTravail.rawPriority,
      assignedTo: selectedTravail.stagiaireId ? { idu: selectedTravail.stagiaireId } : null,
      createdBy: null,
      feedback: feedback.commentaire,
    };

    updateTask(selectedTravail.id, payload)
      .then(() => {
        const newStatut = feedback.action === 'valider' ? 'valide' : 'a_revoir';
        setTravaux(prev => prev.map(t => t.id === selectedTravail.id
          ? { ...t, statut: newStatut, feedback: feedback.commentaire }
          : t
        ));
        setShowFeedbackModal(false);
        setSelectedTravail(null);
      })
      .catch(() => alert('Erreur lors de la mise à jour du statut'));
  };

  if (loading) return <div className="validation-travaux"><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div className="validation-travaux"><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="validation-travaux">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Validation des Travaux</h1>
          <p className="page-description">Consultez et validez les travaux soumis par les stagiaires</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <i className="fas fa-paper-plane"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.aValider}</h3>
            <p>À valider</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.valides}</h3>
            <p>Validés</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.aRevoir}</h3>
            <p>Corrections demandées</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par titre ou stagiaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="filter-select">
          <option value="">Tous les statuts</option>
          <option value="soumis">Soumis pour validation</option>
          <option value="valide">Validé</option>
          <option value="a_revoir">À revoir</option>
          <option value="en_cours">En cours</option>
          <option value="en_attente">En attente</option>
        </select>
        <select value={filterPriorite} onChange={(e) => setFilterPriorite(e.target.value)} className="filter-select">
          <option value="">Toutes priorités</option>
          <option value="haute">Haute</option>
          <option value="moyenne">Moyenne</option>
          <option value="basse">Basse</option>
        </select>
      </div>

      {/* Travaux List */}
      <div className="travaux-grid">
        {filteredTravaux.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-check"></i>
            <p>Aucun travail trouvé</p>
          </div>
        ) : (
          filteredTravaux.map(travail => {
            const statutInfo = getStatutInfo(travail.statut);
            const prioriteInfo = getPrioriteInfo(travail.priorite);
            const urgent = isUrgent(travail.dateEcheance);
            const canReview = travail.statut === 'soumis';

            return (
              <div key={travail.id} className={`travail-card ${urgent ? 'urgent' : ''}`}>

                {/* Header */}
                <div className="travail-header">
                  <div className="travail-stagiaire">
                    <div className="stagiaire-avatar">
                      {travail.stagiairePhoto
                        ? <img src={travail.stagiairePhoto} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <>{travail.stagiairePrenom.charAt(0)}{travail.stagiaireNom.charAt(0)}</>
                      }
                    </div>
                    <div>
                      <h3>{travail.stagiairePrenom} {travail.stagiaireNom}</h3>
                      <span className="temps-ecoule">Échéance : {formatDate(travail.dateEcheance)}</span>
                    </div>
                  </div>
                  <div className="travail-badges">
                    <span className={`badge-priorite ${prioriteInfo.class}`}>
                      <i className={prioriteInfo.icon}></i>
                      {prioriteInfo.label}
                    </span>
                    <span className={`badge-statut ${statutInfo.class}`}>
                      <i className={statutInfo.icon}></i>
                      {statutInfo.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="travail-body">
                  <h2 className="travail-titre">{travail.titre}</h2>
                  {travail.description && <p className="travail-description">{travail.description}</p>}

                  {/* Previous feedback (corrections requested) */}
                  {travail.feedback && travail.statut === 'a_revoir' && (
                    <div className="feedback-avocate">
                      <div className="feedback-header">
                        <i className="fas fa-comment-dots"></i>
                        <span>Corrections demandées</span>
                      </div>
                      <p>{travail.feedback}</p>
                    </div>
                  )}

                  {/* Validated feedback */}
                  {travail.feedback && travail.statut === 'valide' && (
                    <div className="feedback-avocate feedback-valide">
                      <div className="feedback-header">
                        <i className="fas fa-check-circle"></i>
                        <span>Commentaire de validation</span>
                      </div>
                      <p>{travail.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="travail-actions">
                  <button
                    className="btn-action btn-details"
                    onClick={() => handleOpenDetail(travail)}
                  >
                    <i className="fas fa-eye"></i>
                    Voir la soumission
                  </button>
                  {canReview ? (
                    <>
                      <button
                        className="btn-action btn-valider"
                        onClick={() => handleOpenFeedback(travail, 'valider')}
                      >
                        <i className="fas fa-check"></i>
                        Valider
                      </button>
                      <button
                        className="btn-action btn-revoir"
                        onClick={() => handleOpenFeedback(travail, 'revoir')}
                      >
                        <i className="fas fa-redo"></i>
                        À revoir
                      </button>
                    </>
                  ) : (
                    <span className="no-action-label">
                      {travail.statut === 'valide' && <><i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> Travail validé</>}
                      {travail.statut === 'a_revoir' && <><i className="fas fa-hourglass-half" style={{ color: '#f59e0b' }}></i> En attente de corrections</>}
                      {travail.statut === 'en_cours' && <><i className="fas fa-spinner" style={{ color: '#3b82f6' }}></i> En cours de réalisation</>}
                      {travail.statut === 'en_attente' && <><i className="fas fa-clock" style={{ color: '#64748b' }}></i> Pas encore démarré</>}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {detailTravail && (
        <div className="modal-overlay" onClick={() => setDetailTravail(null)}>
          <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-clipboard-list"></i> Détail de la soumission</h2>
              <button className="btn-close" onClick={() => setDetailTravail(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Stagiaire info */}
              <div className="detail-stagiaire-row">
                <div className="stagiaire-avatar">
                  {detailTravail.stagiairePhoto
                    ? <img src={detailTravail.stagiairePhoto} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <>{detailTravail.stagiairePrenom.charAt(0)}{detailTravail.stagiaireNom.charAt(0)}</>
                  }
                </div>
                <div>
                  <strong>{detailTravail.stagiairePrenom} {detailTravail.stagiaireNom}</strong>
                  <span>Stagiaire</span>
                </div>
                <span className={`badge-statut ${getStatutInfo(detailTravail.statut).class}`} style={{ marginLeft: 'auto' }}>
                  <i className={getStatutInfo(detailTravail.statut).icon}></i>
                  {getStatutInfo(detailTravail.statut).label}
                </span>
              </div>

              {/* Task info */}
              <div className="detail-task-info">
                <h3>{detailTravail.titre}</h3>
                {detailTravail.description && <p>{detailTravail.description}</p>}
                <div className="detail-meta">
                  <span><i className="fas fa-calendar"></i> Échéance : {formatDate(detailTravail.dateEcheance)}</span>
                  <span><i className={getPrioriteInfo(detailTravail.priorite).icon}></i> Priorité : {getPrioriteInfo(detailTravail.priorite).label}</span>
                </div>
              </div>

              {/* Documents soumis */}
              <div className="detail-docs-section">
                <h4><i className="fas fa-paperclip"></i> Documents soumis par le stagiaire</h4>
                {detailDocsLoading ? (
                  <p className="detail-docs-loading"><i className="fas fa-spinner fa-spin"></i> Chargement...</p>
                ) : detailDocs.length === 0 ? (
                  <div className="detail-docs-empty">
                    <i className="fas fa-folder-open"></i>
                    <p>Aucun document soumis par ce stagiaire</p>
                  </div>
                ) : (
                  <ul className="detail-docs-list">
                    {detailDocs.map(doc => {
                      const fi = getFileIcon(doc.file_type);
                      return (
                        <li key={doc.idd} className="detail-doc-item">
                          <i className={fi.icon} style={{ color: fi.color, fontSize: '1.4rem', flexShrink: 0 }}></i>
                          <div className="detail-doc-info">
                            <span className="detail-doc-name">{doc.file_name}</span>
                            <span className="detail-doc-date">
                              {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </span>
                          </div>
                          <button
                            className="detail-doc-download"
                            onClick={() => handleDownloadDoc(doc)}
                            title="Télécharger"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Previous feedback if any */}
              {detailTravail.feedback && (
                <div className={`feedback-avocate ${detailTravail.statut === 'valide' ? 'feedback-valide' : ''}`}>
                  <div className="feedback-header">
                    <i className={detailTravail.statut === 'valide' ? 'fas fa-check-circle' : 'fas fa-comment-dots'}></i>
                    <span>{detailTravail.statut === 'valide' ? 'Commentaire de validation' : 'Corrections demandées'}</span>
                  </div>
                  <p>{detailTravail.feedback}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailTravail(null)}>
                Fermer
              </button>
              {detailTravail.statut === 'soumis' && (
                <>
                  <button
                    className="btn btn-warning"
                    onClick={() => { setDetailTravail(null); handleOpenFeedback(detailTravail, 'revoir'); }}
                  >
                    <i className="fas fa-redo"></i> À revoir
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => { setDetailTravail(null); handleOpenFeedback(detailTravail, 'valider'); }}
                  >
                    <i className="fas fa-check"></i> Valider
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedTravail && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{feedback.action === 'valider' ? 'Valider le travail' : 'Demander des corrections'}</h2>
              <button className="btn-close" onClick={() => setShowFeedbackModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="travail-info-modal">
                <h3>{selectedTravail.titre}</h3>
                <p>{selectedTravail.stagiairePrenom} {selectedTravail.stagiaireNom}</p>
              </div>

              <div className="form-group">
                <label>Commentaire *</label>
                <textarea
                  rows="5"
                  value={feedback.commentaire}
                  onChange={(e) => setFeedback(f => ({ ...f, commentaire: e.target.value }))}
                  placeholder={feedback.action === 'valider'
                    ? 'Excellent travail ! Le travail est conforme aux attentes...'
                    : 'Merci de revoir les points suivants...'}
                ></textarea>
              </div>

              {feedback.action === 'valider' && (
                <div className="form-group">
                  <label>Note (optionnelle)</label>
                  <div className="note-selector">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`note-btn ${feedback.note === n ? 'selected' : ''}`}
                        onClick={() => setFeedback(f => ({ ...f, note: n }))}
                      >
                        <i className="fas fa-star"></i>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {feedback.action === 'revoir' && (
                <div className="form-group">
                  <label>Points à corriger</label>
                  <div className="corrections-input">
                    <input
                      type="text"
                      value={newCorrection}
                      onChange={(e) => setNewCorrection(e.target.value)}
                      placeholder="Ajouter un point à corriger..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCorrection()}
                    />
                    <button type="button" onClick={handleAddCorrection} className="btn-add-correction">
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  {feedback.corrections.length > 0 && (
                    <ul className="corrections-preview">
                      {feedback.corrections.map((correction, i) => (
                        <li key={i}>
                          {correction}
                          <button onClick={() => handleRemoveCorrection(i)}>
                            <i className="fas fa-times"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                Annuler
              </button>
              <button
                className={`btn ${feedback.action === 'valider' ? 'btn-success' : 'btn-warning'}`}
                onClick={handleSubmitFeedback}
              >
                <i className={`fas ${feedback.action === 'valider' ? 'fa-check' : 'fa-redo'}`}></i>
                {feedback.action === 'valider' ? 'Valider le travail' : 'Demander corrections'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationTravaux;
