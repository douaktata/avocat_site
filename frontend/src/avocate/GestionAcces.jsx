import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole, getTasks, deleteTask } from '../api';
import './GestionAcces.css';

const STATUS_LABEL = { PENDING: 'En attente', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé' };
const STATUS_CLASS = { PENDING: 'statut-attente', IN_PROGRESS: 'statut-progress', COMPLETED: 'statut-valide' };
const PRIO_LABEL = { HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' };
const PRIO_CLASS = { HIGH: 'priorite-haute', MEDIUM: 'priorite-moyenne', LOW: 'priorite-basse' };

const GestionAcces = () => {
  const navigate = useNavigate();

  const [stagiaires, setStagiaires] = useState([]);
  const [tasksByUser, setTasksByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStagiaire, setSelectedStagiaire] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeTask, setRevokeTask] = useState(null);

  useEffect(() => {
    Promise.all([getUsersByRole('STAGIAIRE'), getTasks()])
      .then(([usersRes, tasksRes]) => {
        const users = usersRes.data.map(u => ({
          id: u.idu,
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
        }));

        const grouped = {};
        users.forEach(u => { grouped[u.id] = []; });
        tasksRes.data.forEach(t => {
          if (t.assignedToId && grouped[t.assignedToId] !== undefined) {
            grouped[t.assignedToId].push(t);
          }
        });

        setStagiaires(users);
        setTasksByUser(grouped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allTasks = Object.values(tasksByUser).flat();
  const stats = {
    stagiaires: stagiaires.length,
    enAttente: allTasks.filter(t => t.status === 'PENDING').length,
    enCours: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
    termines: allTasks.filter(t => t.status === 'COMPLETED').length,
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const handleRevokeClick = (task) => {
    setRevokeTask(task);
    setShowRevokeModal(true);
  };

  const removeTaskFromState = (taskId, assignedToId) => {
    setTasksByUser(prev => ({
      ...prev,
      [assignedToId]: prev[assignedToId].filter(t => t.id !== taskId),
    }));
  };

  const confirmRevoke = () => {
    const { id, assignedToId } = revokeTask;
    deleteTask(id)
      .then(() => {
        removeTaskFromState(id, assignedToId);
        setShowRevokeModal(false);
        setRevokeTask(null);
      })
      .catch(() => alert('Erreur lors de la suppression de la tâche'));
  };

  if (loading) return <div className="gestion-acces"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  return (
    <div className="gestion-acces">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Accès</h1>
          <p className="page-description">Consultez et gérez les tâches attribuées aux stagiaires</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/avocat/attribution-travail')}>
          <i className="fas fa-plus"></i> Nouveau travail
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.stagiaires}</h3>
            <p>Stagiaires actifs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.enAttente}</h3>
            <p>En attente</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <i className="fas fa-spinner"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.enCours}</h3>
            <p>En cours</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.termines}</h3>
            <p>Terminés</p>
          </div>
        </div>
      </div>

      {/* Liste stagiaires */}
      <div className="stagiaires-container">
        {stagiaires.map(stagiaire => {
          const tasks = tasksByUser[stagiaire.id] || [];
          const isExpanded = selectedStagiaire === stagiaire.id;

          return (
            <div key={stagiaire.id} className={`stagiaire-section ${isExpanded ? 'expanded' : ''}`}>

              {/* Header stagiaire */}
              <button
                type="button"
                className="stagiaire-header"
                onClick={() => setSelectedStagiaire(isExpanded ? null : stagiaire.id)}
              >
                <div className="stagiaire-info-header">
                  <div className="stagiaire-avatar-large">
                    {stagiaire.prenom.charAt(0)}{stagiaire.nom.charAt(0)}
                  </div>
                  <div>
                    <h2>{stagiaire.prenom} {stagiaire.nom}</h2>
                    <p>{stagiaire.email}</p>
                  </div>
                </div>
                <div className="stagiaire-acces-count">
                  <div className="acces-badge">
                    <i className="fas fa-tasks" />
                    <span>{tasks.length} tâche{tasks.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="expand-icon">
                    <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                  </div>
                </div>
              </button>

              {/* Contenu expandable */}
              {isExpanded && (
                <div className="stagiaire-content">
                  {tasks.length > 0 ? (
                    <div className="acces-section">
                      <h3 className="acces-section-title">
                        <i className="fas fa-tasks"></i>
                        Tâches attribuées ({tasks.length})
                      </h3>
                      <div className="acces-grid">
                        {tasks.map(task => (
                          <div key={task.id} className="acces-card">
                            <div className="acces-card-header">
                              <div className="acces-icon dossier-icon">
                                <i className="fas fa-file-alt"></i>
                              </div>
                              <button
                                className="btn-revoke"
                                onClick={() => handleRevokeClick(task)}
                                title="Supprimer la tâche"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                            <div className="acces-card-body">
                              <h4>{task.title}</h4>
                              <p className="acces-name" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                {task.description}
                              </p>
                              <div className="acces-meta" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                <span className={`badge-statut ${STATUS_CLASS[task.status] || ''}`} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px' }}>
                                  {STATUS_LABEL[task.status] || task.status}
                                </span>
                                <span className={`badge-priorite ${PRIO_CLASS[task.priority] || ''}`} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px' }}>
                                  {PRIO_LABEL[task.priority] || task.priority}
                                </span>
                              </div>
                              <div className="acces-travail">
                                <i className="fas fa-calendar"></i>
                                Échéance : {formatDate(task.deadline)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-acces">
                      <i className="fas fa-inbox" />
                      <p>Aucune tâche attribuée à ce stagiaire</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Revoke Modal */}
      {showRevokeModal && revokeTask && (
        <dialog open className="modal-overlay" onClose={() => setShowRevokeModal(false)}>
          <div className="modal-content revoke-modal">
            <div className="modal-header">
              <h2>Supprimer la tâche</h2>
              <button className="btn-close" onClick={() => setShowRevokeModal(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Êtes-vous sûr de vouloir supprimer la tâche <strong>«&nbsp;{revokeTask.title}&nbsp;»</strong> ?
              </p>
              <div className="warning-box">
                <i className="fas fa-info-circle" />
                <span>Cette action est irréversible.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRevokeModal(false)}>
                Annuler
              </button>
              <button className="btn btn-danger" onClick={confirmRevoke}>
                <i className="fas fa-trash" />{' '}Supprimer
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default GestionAcces;
