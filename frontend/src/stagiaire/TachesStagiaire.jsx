import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getTasksByAssignee, createTask, updateTask, deleteTask, uploadDocument } from '../api';
import './TachesStagiaire.css';

const STATUS_TO_LOCAL = { PENDING: 'a_faire', IN_PROGRESS: 'en_cours', COMPLETED: 'termine' };
const PRIORITY_TO_LOCAL = { HIGH: 'urgente', MEDIUM: 'haute', LOW: 'normale' };
const LOCAL_STATUS_TO_API = { a_faire: 'PENDING', en_cours: 'IN_PROGRESS', termine: 'COMPLETED' };
const LOCAL_PRIORITY_TO_API = { basse: 'LOW', normale: 'LOW', haute: 'MEDIUM', urgente: 'HIGH' };

const mapTaskToLocal = (t) => ({
  id: t.id,
  titre: t.title,
  description: t.description,
  assignePar: t.createdByName || '-',
  priorite: PRIORITY_TO_LOCAL[t.priority] || 'normale',
  statut: STATUS_TO_LOCAL[t.status] || 'a_faire',
  dateCreation: t.deadline ? t.deadline.split('T')[0] : null,
  echeance: t.deadline ? t.deadline.split('T')[0] : null,
  createdById: t.createdById,
  feedback: t.feedback || null,
  _raw: t,
});

const TachesStagiaire = () => {
  const { user } = useAuth();

  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterType, setFilterType] = useState('toutes');
  const [filterStatut, setFilterStatut] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ titre: '', description: '', priorite: 'normale', echeance: '' });

  // Submit work modal (for assigned tasks)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTask, setSubmitTask] = useState(null);
  const [submitFiles, setSubmitFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const loadTasks = () => {
    if (!user?.idu) { setLoading(false); return; }
    getTasksByAssignee(user.idu)
      .then(res => setAllTasks(res.data.map(mapTaskToLocal)))
      .catch(() => setError('Impossible de charger les taches'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const tachesAssignees = allTasks.filter(t => t.createdById !== user?.idu);
  const tachesPersonnelles = allTasks.filter(t => t.createdById === user?.idu);

  const getTachesFiltrees = () => {
    let taches = [];
    if (filterType === 'toutes') {
      taches = [
        ...tachesAssignees.map(t => ({ ...t, type: 'assignee' })),
        ...tachesPersonnelles.map(t => ({ ...t, type: 'personnelle' })),
      ];
    } else if (filterType === 'assignees') {
      taches = tachesAssignees.map(t => ({ ...t, type: 'assignee' }));
    } else {
      taches = tachesPersonnelles.map(t => ({ ...t, type: 'personnelle' }));
    }
    if (filterStatut) taches = taches.filter(t => t.statut === filterStatut);
    const prioriteOrder = { urgente: 0, haute: 1, normale: 2, basse: 3 };
    const statutOrder = { en_cours: 0, a_faire: 1, termine: 2 };
    return taches.sort((a, b) => {
      if (a.statut !== b.statut) return statutOrder[a.statut] - statutOrder[b.statut];
      return prioriteOrder[a.priorite] - prioriteOrder[b.priorite];
    });
  };

  // Only used for personal tasks or setting à_faire/en_cours on assigned tasks
  const handleChangeStatut = (tacheId, nouveauStatut) => {
    const tache = allTasks.find(t => t.id === tacheId);
    if (!tache) return;
    const apiStatus = LOCAL_STATUS_TO_API[nouveauStatut];
    const payload = {
      ...tache._raw,
      status: apiStatus,
      assignedTo: tache._raw.assignedToId ? { idu: tache._raw.assignedToId } : null,
      createdBy: tache._raw.createdById ? { idu: tache._raw.createdById } : null,
    };
    updateTask(tacheId, payload)
      .then(() => setAllTasks(prev => prev.map(t =>
        t.id === tacheId ? { ...t, statut: nouveauStatut } : t
      )))
      .catch(console.error);
  };

  const handleSupprimerTache = (tacheId) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer cette tache ?')) return;
    deleteTask(tacheId)
      .then(() => setAllTasks(prev => prev.filter(t => t.id !== tacheId)))
      .catch(console.error);
  };

  const handleAjouterTache = (e) => {
    e.preventDefault();
    const payload = {
      title: newTask.titre,
      description: newTask.description,
      priority: LOCAL_PRIORITY_TO_API[newTask.priorite] || 'LOW',
      status: 'PENDING',
      assignedTo: { idu: user.idu },
      createdBy: { idu: user.idu },
      deadline: newTask.echeance ? `${newTask.echeance}T00:00:00` : null,
    };
    createTask(payload)
      .then(() => {
        setShowAddModal(false);
        setNewTask({ titre: '', description: '', priorite: 'normale', echeance: '' });
        loadTasks();
      })
      .catch(console.error);
  };

  // Submit work: upload document then mark task as COMPLETED
  const addFiles = (incoming) => {
    const list = Array.from(incoming);
    setSubmitFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const fresh = list.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...fresh];
    });
  };

  const handleOpenSubmit = (tache) => {
    setSubmitTask(tache);
    setSubmitFiles([]);
    setDragOver(false);
    setShowSubmitModal(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setSubmitFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (submitFiles.length === 0 || !user?.idu) return;
    setSubmitting(true);
    try {
      // Upload each file sequentially
      for (const file of submitFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadedBy', user.idu);
        formData.append('taskId', submitTask.id);
        await uploadDocument(formData);
      }

      // Mark task as COMPLETED
      const tache = submitTask;
      const payload = {
        ...tache._raw,
        status: 'COMPLETED',
        assignedTo: tache._raw.assignedToId ? { idu: tache._raw.assignedToId } : null,
        createdBy: tache._raw.createdById ? { idu: tache._raw.createdById } : null,
      };
      await updateTask(tache.id, payload);

      setAllTasks(prev => prev.map(t =>
        t.id === tache.id ? { ...t, statut: 'termine' } : t
      ));
      setShowSubmitModal(false);
      setSubmitTask(null);
      setSubmitFiles([]);
    } catch {
      alert('Erreur lors de la soumission du travail');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityClass = (priorite) =>
    ({ urgente: 'priority-urgent', haute: 'priority-high', normale: 'priority-normal', basse: 'priority-low' }[priorite] || 'priority-normal');

  const getStatusClass = (statut) =>
    ({ a_faire: 'status-todo', en_cours: 'status-progress', termine: 'status-done' }[statut] || 'status-todo');

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getJoursPourEcheance = (echeanceStr) => {
    if (!echeanceStr) return null;
    const diffTime = new Date(echeanceStr) - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const stats = {
    totalAssignees: tachesAssignees.length,
    assigneesEnCours: tachesAssignees.filter(t => t.statut !== 'termine').length,
    totalPersonnelles: tachesPersonnelles.length,
    personnellesEnCours: tachesPersonnelles.filter(t => t.statut !== 'termine').length,
  };

  if (loading) return <div><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  const tachesFiltrees = getTachesFiltrees();

  return (
    <div className="taches-stagiaire-page">

      <div className="taches-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-clipboard-list"></i> Gestion des Taches
          </h1>
          <p className="page-description">Taches assignees par le cabinet et organisation personnelle</p>
        </div>
        <button className="btn-add-task" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus"></i> Ajouter une tache personnelle
        </button>
      </div>

      <div className="taches-stats">
        <div className="tstat-card tstat-assignees">
          <div className="tstat-icon"><i className="fas fa-user-tie"></i></div>
          <div className="tstat-info">
            <span className="tstat-number">{stats.totalAssignees}</span>
            <span className="tstat-label">Taches assignees</span>
            <span className="tstat-detail">{stats.assigneesEnCours} en cours</span>
          </div>
        </div>
        <div className="tstat-card tstat-personnelles">
          <div className="tstat-icon"><i className="fas fa-user"></i></div>
          <div className="tstat-info">
            <span className="tstat-number">{stats.totalPersonnelles}</span>
            <span className="tstat-label">Taches personnelles</span>
            <span className="tstat-detail">{stats.personnellesEnCours} en cours</span>
          </div>
        </div>
        <div className="tstat-card tstat-progress">
          <div className="tstat-icon"><i className="fas fa-spinner"></i></div>
          <div className="tstat-info">
            <span className="tstat-number">{tachesFiltrees.filter(t => t.statut === 'en_cours').length}</span>
            <span className="tstat-label">En cours</span>
          </div>
        </div>
        <div className="tstat-card tstat-completed">
          <div className="tstat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="tstat-info">
            <span className="tstat-number">{tachesFiltrees.filter(t => t.statut === 'termine').length}</span>
            <span className="tstat-label">Soumis</span>
          </div>
        </div>
      </div>

      <div className="taches-filters">
        <div className="filter-group">
          <label>Type de taches</label>
          <div className="filter-buttons">
            {[['toutes', 'fa-list', 'Toutes'], ['assignees', 'fa-user-tie', 'Assignees'], ['personnelles', 'fa-user', 'Personnelles']].map(([val, icon, label]) => (
              <button key={val} className={`filter-btn ${filterType === val ? 'active' : ''}`} onClick={() => setFilterType(val)}>
                <i className={`fas ${icon}`}></i> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label>Statut</label>
          <select className="filter-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="a_faire">A faire</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Soumis / Termine</option>
          </select>
        </div>
        <div className="filter-count">{tachesFiltrees.length} tache{tachesFiltrees.length !== 1 ? 's' : ''}</div>
      </div>

      {tachesFiltrees.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-clipboard-check"></i>
          <p>Aucune tache a afficher</p>
          <small>Modifiez vos filtres ou ajoutez une nouvelle tache</small>
        </div>
      ) : (
        <div className="taches-list">
          {tachesFiltrees.map(tache => {
            const joursRestants = getJoursPourEcheance(tache.echeance);
            const isAssignee = tache.type === 'assignee';
            return (
              <div key={`${tache.type}-${tache.id}`} className={`tache-card ${getStatusClass(tache.statut)}`}>
                <div className="tache-card-header">
                  <div className="tache-type-badge">
                    {isAssignee ? (
                      <><i className="fas fa-user-tie"></i><span>Assignee par {tache.assignePar}</span></>
                    ) : (
                      <><i className="fas fa-user"></i><span>Personnelle</span></>
                    )}
                  </div>
                  <span className={`priority-badge ${getPriorityClass(tache.priorite)}`}>
                    {tache.priorite === 'urgente' ? 'Urgent' : tache.priorite === 'haute' ? 'Haute' : tache.priorite === 'basse' ? 'Basse' : 'Normale'}
                  </span>
                </div>

                <div className="tache-card-body">
                  <h3>{tache.titre}</h3>
                  <p className="tache-description">{tache.description}</p>
                  <div className="tache-meta">
                    {tache.dateCreation && (
                      <span className="meta-item">
                        <i className="fas fa-calendar-plus"></i>
                        Creee le {formatDate(tache.dateCreation)}
                      </span>
                    )}
                    {tache.echeance && (
                      <span className={`meta-item meta-echeance ${joursRestants !== null && joursRestants <= 2 ? 'urgent' : ''}`}>
                        <i className="fas fa-calendar-alt"></i>
                        {joursRestants === 0 ? "Echeance aujourd'hui" :
                         joursRestants === 1 ? 'Echeance demain' :
                         joursRestants < 0 ? `En retard de ${Math.abs(joursRestants)} jour(s)` :
                         `Echeance dans ${joursRestants} jours`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Feedback from avocat */}
                {tache.feedback && (
                  <div className="tache-feedback">
                    <div className="feedback-label">
                      <i className="fas fa-user-tie"></i> Feedback de l'avocat
                      {tache.statut === 'en_cours' && (
                        <span className="feedback-badge-revoir">A revoir</span>
                      )}
                      {tache.statut === 'termine' && (
                        <span className="feedback-badge-valide">Valide</span>
                      )}
                    </div>
                    <p className="feedback-text">{tache.feedback}</p>
                  </div>
                )}

                <div className="tache-card-footer">
                  {isAssignee ? (
                    /* ── Assigned tasks: manual progress + submit button ── */
                    <div className="statut-controls">
                      {tache.statut !== 'termine' ? (
                        <>
                          <div className="statut-buttons">
                            <button
                              className={`statut-btn ${tache.statut === 'a_faire' ? 'active' : ''}`}
                              onClick={() => handleChangeStatut(tache.id, 'a_faire')}
                            >
                              A faire
                            </button>
                            <button
                              className={`statut-btn ${tache.statut === 'en_cours' ? 'active' : ''}`}
                              onClick={() => handleChangeStatut(tache.id, 'en_cours')}
                            >
                              En cours
                            </button>
                          </div>
                          <button
                            className="btn-soumettre"
                            onClick={() => handleOpenSubmit(tache)}
                          >
                            <i className="fas fa-paper-plane"></i> Soumettre le travail
                          </button>
                        </>
                      ) : (
                        <div className="travail-soumis-label">
                          <i className="fas fa-check-circle"></i>
                          Travail soumis — en attente de validation
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Personal tasks: full 3-button control ── */
                    <div className="statut-controls">
                      <label>Statut :</label>
                      <div className="statut-buttons">
                        {[['a_faire', 'A faire'], ['en_cours', 'En cours'], ['termine', 'Termine']].map(([val, label]) => (
                          <button
                            key={val}
                            className={`statut-btn ${tache.statut === val ? 'active' : ''}`}
                            onClick={() => handleChangeStatut(tache.id, val)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <button className="btn-delete-task" onClick={() => handleSupprimerTache(tache.id)} title="Supprimer">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add personal task modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-plus"></i> Ajouter une tache personnelle</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAjouterTache}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    placeholder="Ex: Reviser cours de procedure civile"
                    value={newTask.titre}
                    onChange={(e) => setNewTask({ ...newTask, titre: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Description detaillee de la tache..."
                    rows={3}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Priorite</label>
                    <select value={newTask.priorite} onChange={(e) => setNewTask({ ...newTask, priorite: e.target.value })}>
                      <option value="basse">Basse</option>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Echeance (optionnelle)</label>
                    <input
                      type="date"
                      value={newTask.echeance}
                      onChange={(e) => setNewTask({ ...newTask, echeance: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-plus"></i> Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submit work modal ── */}
      {showSubmitModal && submitTask && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-paper-plane"></i> Soumettre le travail</h2>
              <button className="modal-close-btn" onClick={() => setShowSubmitModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmitWork}>
              <div className="modal-body">
                <div className="submit-task-info">
                  <i className="fas fa-clipboard-list"></i>
                  <div>
                    <strong>{submitTask.titre}</strong>
                    <span>Assignee par {submitTask.assignePar}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label><i className="fas fa-file-upload"></i> Documents de travail *</label>
                  <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('submit-file-input').click()}
                  >
                    <input
                      id="submit-file-input"
                      type="file"
                      style={{ display: 'none' }}
                      multiple
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                    />
                    <div className="drop-zone-placeholder">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Glissez vos fichiers ici</span>
                      <small>ou cliquez pour choisir</small>
                      <small className="drop-zone-formats">PDF, DOC, DOCX, XLS, XLSX</small>
                    </div>
                  </div>

                  {submitFiles.length > 0 && (
                    <ul className="drop-zone-file-list">
                      {submitFiles.map((file, i) => (
                        <li key={i} className="drop-zone-file">
                          <i className="fas fa-file-alt"></i>
                          <div>
                            <span className="drop-zone-filename">{file.name}</span>
                            <span className="drop-zone-filesize">{(file.size / 1024).toFixed(0)} Ko</span>
                          </div>
                          <button
                            type="button"
                            className="drop-zone-remove"
                            onClick={() => handleRemoveFile(i)}
                            title="Retirer"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="submit-info-box">
                  <i className="fas fa-info-circle"></i>
                  <span>Apres soumission, votre travail sera transmis a l'avocat pour validation. La tache sera marquee comme <strong>soumise</strong>.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-submit" disabled={submitting || submitFiles.length === 0}>
                  <i className="fas fa-paper-plane"></i>
                  {submitting
                    ? `Envoi en cours... (${submitFiles.length} fichier${submitFiles.length > 1 ? 's' : ''})`
                    : submitFiles.length > 0
                      ? `Soumettre (${submitFiles.length} fichier${submitFiles.length > 1 ? 's' : ''})`
                      : 'Soumettre le travail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TachesStagiaire;
