import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTask, getDocumentsByUser, downloadDocument } from '../api';
import './DetailTravail.css';

const STATUS_MAP = { PENDING: 'en_attente', COMPLETED: 'valide', IN_PROGRESS: 'a_revoir' };
const PRIO_MAP = { HIGH: 'haute', MEDIUM: 'moyenne', LOW: 'basse' };
const LOCAL_TO_API_STATUS = { valide: 'COMPLETED', a_revoir: 'IN_PROGRESS', en_attente: 'PENDING' };

const DetailTravail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [travail, setTravail] = useState(null);
  const [rawTask, setRawTask] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ action: '', commentaire: '', note: null, corrections: [] });
  const [newCorrection, setNewCorrection] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTask(id)
      .then(res => {
        const t = res.data;
        setRawTask(t);
        const nameParts = (t.assignedToName || '').split(' ');
        setTravail({
          id: t.id,
          titre: t.title || '',
          description: t.description || '',
          statut: STATUS_MAP[t.status] || 'en_attente',
          priorite: PRIO_MAP[t.priority] || 'moyenne',
          echeance: t.deadline ? t.deadline.split('T')[0] : null,
          stagiaireNom: nameParts[0] || '-',
          stagiairePrenom: nameParts.slice(1).join(' ') || '',
          stagiairePhoto: t.assignedToPhotoUrl ? `http://localhost:8081${t.assignedToPhotoUrl}` : null,
          assignedToId: t.assignedToId,
          createdByName: t.createdByName || '-',
        });
        if (t.assignedToId) {
          return getDocumentsByUser(t.assignedToId);
        }
        return { data: [] };
      })
      .then(docsRes => setDocuments(docsRes.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleOpenFeedback = (action) => {
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
      ...rawTask,
      status: newStatus,
      assignedTo: rawTask.assignedToId ? { idu: rawTask.assignedToId } : null,
      createdBy: rawTask.createdById ? { idu: rawTask.createdById } : null,
      feedback: feedback.commentaire,
    };
    setSubmitting(true);
    updateTask(id, payload)
      .then(() => {
        setTravail(prev => ({ ...prev, statut: STATUS_MAP[newStatus] }));
        setShowFeedbackModal(false);
      })
      .catch(() => alert('Erreur lors de la mise à jour'))
      .finally(() => setSubmitting(false));
  };

  const getStatutInfo = (statut) => ({
    en_attente: { class: 'statut-attente', label: 'En attente', icon: 'fas fa-clock' },
    valide:     { class: 'statut-valide',   label: 'Validé',     icon: 'fas fa-check-circle' },
    a_revoir:   { class: 'statut-revoir',   label: 'À revoir',   icon: 'fas fa-exclamation-triangle' },
  }[statut] || { class: '', label: statut, icon: 'fas fa-question' });

  const getPrioriteInfo = (priorite) => ({
    haute:   { class: 'priorite-haute',   label: 'Haute',   icon: 'fas fa-arrow-up' },
    moyenne: { class: 'priorite-moyenne', label: 'Moyenne', icon: 'fas fa-minus' },
    basse:   { class: 'priorite-basse',   label: 'Basse',   icon: 'fas fa-arrow-down' },
  }[priorite] || { class: '', label: priorite, icon: 'fas fa-question' });

  const getFileIcon = (type) => ({
    PDF:  { icon: 'fas fa-file-pdf',   color: '#e74c3c' },
    DOCX: { icon: 'fas fa-file-word',  color: '#2b579a' },
    XLSX: { icon: 'fas fa-file-excel', color: '#217346' },
  }[(type || '').toUpperCase()] || { icon: 'fas fa-file', color: '#64748b' });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="detail-travail"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  if (!travail) {
    return (
      <div className="detail-travail">
        <div className="not-found">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Travail non trouvé</h2>
          <button className="btn-back" onClick={() => navigate('/avocat/validation-travaux')}>
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const statutInfo = getStatutInfo(travail.statut);
  const prioriteInfo = getPrioriteInfo(travail.priorite);

  return (
    <div className="detail-travail">

      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/avocat/validation-travaux')}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
        <div className="header-badges">
          <span className={`badge-priorite ${prioriteInfo.class}`}>
            <i className={prioriteInfo.icon}></i> {prioriteInfo.label}
          </span>
          <span className={`badge-statut ${statutInfo.class}`}>
            <i className={statutInfo.icon}></i> {statutInfo.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="detail-title-section">
        <h1>{travail.titre}</h1>
      </div>

      {/* Main grid */}
      <div className="detail-grid">

        {/* Left column */}
        <div className="detail-main">

          {/* Informations */}
          <section className="detail-section">
            <h2 className="section-title"><i className="fas fa-info-circle"></i> Informations</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Stagiaire</span>
                <div className="stagiaire-info">
                  <div className="stagiaire-avatar-small">
                    {travail.stagiairePhoto
                      ? <img src={travail.stagiairePhoto} alt={`${travail.stagiairePrenom} ${travail.stagiaireNom}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <>{travail.stagiairePrenom.charAt(0)}{travail.stagiaireNom.charAt(0)}</>
                    }
                  </div>
                  <div>
                    <strong>{travail.stagiairePrenom} {travail.stagiaireNom}</strong>
                  </div>
                </div>
              </div>
              <div className="info-item">
                <span className="info-label">Assignée par</span>
                <strong>{travail.createdByName}</strong>
              </div>
              {travail.echeance && (
                <div className="info-item">
                  <span className="info-label">Échéance</span>
                  <strong>{formatDate(travail.echeance)}</strong>
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          {travail.description && (
            <section className="detail-section">
              <h2 className="section-title"><i className="fas fa-align-left"></i> Description</h2>
              <div className="description-content">{travail.description}</div>
            </section>
          )}

          {/* Documents du stagiaire */}
          <section className="detail-section">
            <h2 className="section-title">
              <i className="fas fa-paperclip"></i> Documents uploadés par le stagiaire ({documents.length})
            </h2>
            {documents.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>Aucun document uploadé</p>
            ) : (
              <div className="fichiers-list">
                {documents.map(doc => {
                  const fi = getFileIcon(doc.file_type);
                  return (
                    <div key={doc.idd} className="fichier-card">
                      <div className="fichier-icon" style={{ color: fi.color }}>
                        <i className={fi.icon}></i>
                      </div>
                      <div className="fichier-info">
                        <h4>{doc.file_name}</h4>
                        <div className="fichier-meta">
                          <span>{doc.file_type || 'AUTRE'}</span>
                          <span>•</span>
                          <span>{formatDate(doc.uploaded_at)}</span>
                        </div>
                      </div>
                      <div className="fichier-actions">
                        <button
                          className="btn-fichier btn-download"
                          onClick={() => handleDownload(doc)}
                          title="Télécharger"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="detail-sidebar">

          {/* Actions */}
          {travail.statut === 'en_attente' && (
            <section className="sidebar-section">
              <h3>Actions</h3>
              <div className="sidebar-actions">
                <button className="btn-action-full btn-valider" onClick={() => handleOpenFeedback('valider')}>
                  <i className="fas fa-check"></i> Valider le travail
                </button>
                <button className="btn-action-full btn-revoir" onClick={() => handleOpenFeedback('revoir')}>
                  <i className="fas fa-redo"></i> Demander corrections
                </button>
              </div>
            </section>
          )}

          {/* Statut actuel */}
          <section className="sidebar-section">
            <h3>Statut</h3>
            <span className={`badge-statut ${statutInfo.class}`} style={{ display: 'inline-flex', gap: '6px', padding: '8px 14px' }}>
              <i className={statutInfo.icon}></i> {statutInfo.label}
            </span>
          </section>

          {/* Stats */}
          <section className="sidebar-section">
            <h3>Statistiques</h3>
            <div className="stats-list">
              <div className="stat-item">
                <i className="fas fa-paperclip"></i>
                <div>
                  <strong>{documents.length}</strong>
                  <span>Documents</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{feedback.action === 'valider' ? 'Valider le travail' : 'Demander des corrections'}</h2>
              <button className="btn-close" onClick={() => setShowFeedbackModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Commentaire *</label>
                <textarea
                  rows="5"
                  value={feedback.commentaire}
                  onChange={(e) => setFeedback(f => ({ ...f, commentaire: e.target.value }))}
                  placeholder={feedback.action === 'valider'
                    ? 'Félicitations ! Le travail est excellent...'
                    : 'Merci de revoir les points suivants...'
                  }
                />
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
                        <i className="fas fa-star"></i> {n}
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
                      {feedback.corrections.map((c, i) => (
                        <li key={i}>
                          {c}
                          <button onClick={() => handleRemoveCorrection(i)}><i className="fas fa-times"></i></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>Annuler</button>
              <button
                className={`btn ${feedback.action === 'valider' ? 'btn-success' : 'btn-warning'}`}
                onClick={handleSubmitFeedback}
                disabled={submitting}
              >
                <i className={`fas ${feedback.action === 'valider' ? 'fa-check' : 'fa-redo'}`}></i>
                {submitting ? 'Enregistrement...' : feedback.action === 'valider' ? 'Valider le travail' : 'Demander corrections'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailTravail;
