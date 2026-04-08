import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getTasksByAssignee, getCases } from '../api';
import './DashboardStagiaire.css';

const PRIORITY_TO_LOCAL = { HIGH: 'urgente', MEDIUM: 'haute', LOW: 'normale' };

const DashboardStagiaire = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [tasks, setTasks] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.idu) { setLoading(false); return; }
    Promise.all([
      getTasksByAssignee(user.idu),
      getCases(),
    ])
      .then(([tasksRes, casesRes]) => {
        setTasks(tasksRes.data);
        setDossiers(casesRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const tachesUrgentes = tasks
    .filter(t => t.status !== 'COMPLETED' && (t.priority === 'HIGH' || t.priority === 'MEDIUM'))
    .slice(0, 3);

  const dossiersRecents = dossiers.slice(0, 3);

  const stats = {
    dossiersAssignes: dossiers.length,
    tachesEnCours: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    tachesTerminees: tasks.filter(t => t.status === 'COMPLETED').length,
    tachesAPendant: tasks.filter(t => t.status === 'PENDING').length,
  };

  const formatTime = (date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDateLong = (date) => date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getJoursPourEcheance = (echeanceStr) => {
    if (!echeanceStr) return null;
    return Math.ceil((new Date(echeanceStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getPriorityClass = (priority) =>
    ({ HIGH: 'priority-urgent', MEDIUM: 'priority-high', LOW: 'priority-normal' }[priority] || 'priority-normal');

  return (
    <div className="dashboard-stagiaire">

      <div className="dash-hero">
        <div className="hero-left">
          <div className="greeting-section">
            <h1 className="greeting-title">
              Bonjour, <span className="user-name">{user?.prenom || 'Stagiaire'}</span>
            </h1>
            <p className="greeting-subtitle">Voici votre activite du jour</p>
          </div>
        </div>
        <div className="hero-right">
          <div className="datetime-card">
            <div className="time-display">{formatTime(currentTime)}</div>
            <div className="date-display">{formatDateLong(currentTime)}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-dossiers">
          <div className="stat-icon"><i className="fas fa-folder-open"></i></div>
          <div className="stat-content">
            <span className="stat-number">{loading ? '-' : stats.dossiersAssignes}</span>
            <span className="stat-label">Dossiers assignes</span>
          </div>
          <div className="stat-trend"><i className="fas fa-arrow-right"></i></div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-icon"><i className="fas fa-spinner"></i></div>
          <div className="stat-content">
            <span className="stat-number">{loading ? '-' : stats.tachesEnCours}</span>
            <span className="stat-label">Taches en cours</span>
          </div>
          <div className="stat-trend"><i className="fas fa-arrow-up"></i></div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="stat-content">
            <span className="stat-number">{loading ? '-' : stats.tachesTerminees}</span>
            <span className="stat-label">Taches terminees</span>
          </div>
          <div className="stat-trend"><i className="fas fa-check"></i></div>
        </div>
        <div className="stat-card stat-validation">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-content">
            <span className="stat-number">{loading ? '-' : stats.tachesAPendant}</span>
            <span className="stat-label">A faire</span>
          </div>
          <div className="stat-trend"><i className="fas fa-hourglass-half"></i></div>
        </div>
      </div>

      <div className="content-grid">
        <div className="left-column">

          <div className="panel tasks-panel">
            <div className="panel-header">
              <div className="panel-title">
                <i className="fas fa-exclamation-triangle"></i>
                <h2>Taches prioritaires</h2>
              </div>
              <span className="panel-count">{tachesUrgentes.length}</span>
            </div>

            {loading ? (
              <p style={{ padding: '1rem', color: '#6b7280' }}>Chargement...</p>
            ) : tachesUrgentes.length === 0 ? (
              <p style={{ padding: '1rem', color: '#6b7280' }}>Aucune tache prioritaire</p>
            ) : (
              <div className="tasks-list">
                {tachesUrgentes.map(tache => {
                  const joursRestants = getJoursPourEcheance(tache.deadline);
                  const prioriteLabel = PRIORITY_TO_LOCAL[tache.priority] === 'urgente' ? 'Urgent' : 'Haute';
                  return (
                    <div key={tache.id} className="task-item">
                      <div className="task-header">
                        <div className="task-left">
                          <h4>{tache.title}</h4>
                          {tache.description && <p className="task-meta">{tache.description}</p>}
                        </div>
                        <span className={`priority-badge ${getPriorityClass(tache.priority)}`}>
                          {prioriteLabel}
                        </span>
                      </div>
                      {tache.deadline && joursRestants !== null && (
                        <div className="task-footer">
                          <span className={`task-deadline ${joursRestants <= 3 ? 'urgent' : ''}`}>
                            <i className="fas fa-calendar-alt"></i>
                            {joursRestants === 0 ? "Aujourd'hui" :
                             joursRestants === 1 ? 'Demain' :
                             joursRestants < 0 ? 'En retard' :
                             `Dans ${joursRestants} jours`}
                          </span>
                          <button className="btn-task-action" onClick={() => navigate('/stagiaire/taches')}>
                            Voir details
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button className="panel-view-all" onClick={() => navigate('/stagiaire/taches')}>
              Voir toutes les taches <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          <div className="panel dossiers-panel">
            <div className="panel-header">
              <div className="panel-title">
                <i className="fas fa-folder"></i>
                <h2>Dossiers recents</h2>
              </div>
            </div>

            {loading ? (
              <p style={{ padding: '1rem', color: '#6b7280' }}>Chargement...</p>
            ) : dossiersRecents.length === 0 ? (
              <p style={{ padding: '1rem', color: '#6b7280' }}>Aucun dossier</p>
            ) : (
              <div className="dossiers-list">
                {dossiersRecents.map(dossier => (
                  <div key={dossier.idc} className="dossier-item">
                    <div className="dossier-icon"><i className="fas fa-briefcase"></i></div>
                    <div className="dossier-info">
                      <h4>{dossier.case_number}</h4>
                      <p className="dossier-client">{dossier.client_full_name || '-'}</p>
                      <div className="dossier-meta">
                        <span className="dossier-type">{dossier.case_type || '-'}</span>
                        <span className="dossier-activity">
                          <i className="fas fa-clock"></i>
                          {formatDateShort(dossier.created_at)}
                        </span>
                      </div>
                    </div>
                    <button className="btn-dossier-open" onClick={() => navigate('/stagiaire/dossiers')}>
                      <i className="fas fa-folder-open"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button className="panel-view-all" onClick={() => navigate('/stagiaire/dossiers')}>
              Voir tous les dossiers <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="right-column">

          <div className="panel quick-actions-panel">
            <div className="panel-header">
              <div className="panel-title">
                <i className="fas fa-bolt"></i>
                <h2>Actions rapides</h2>
              </div>
            </div>
            <div className="quick-actions-grid">
              {[
                ['qa-tasks', 'fa-tasks', 'Mes taches', '/stagiaire/taches'],
                ['qa-dossiers', 'fa-folder-open', 'Dossiers', '/stagiaire/dossiers'],
                ['qa-upload', 'fa-upload', 'Uploader', '/stagiaire/documents'],
                ['qa-messages', 'fa-envelope', 'Messages', '/stagiaire/messages'],
              ].map(([cls, icon, label, path]) => (
                <button key={path} className={`quick-action-btn ${cls}`} onClick={() => navigate(path)}>
                  <i className={`fas ${icon}`}></i>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel progress-panel">
            <div className="panel-header">
              <div className="panel-title">
                <i className="fas fa-chart-line"></i>
                <h2>Recapitulatif</h2>
              </div>
            </div>
            <div className="weekly-stats">
              <div className="week-stat">
                <div className="week-stat-icon"><i className="fas fa-check-circle"></i></div>
                <div className="week-stat-info">
                  <span className="week-stat-number">{loading ? '-' : stats.tachesTerminees}</span>
                  <span className="week-stat-label">Taches terminees</span>
                </div>
              </div>
              <div className="week-stat">
                <div className="week-stat-icon"><i className="fas fa-spinner"></i></div>
                <div className="week-stat-info">
                  <span className="week-stat-number">{loading ? '-' : stats.tachesEnCours}</span>
                  <span className="week-stat-label">En cours</span>
                </div>
              </div>
              <div className="week-stat">
                <div className="week-stat-icon"><i className="fas fa-folder"></i></div>
                <div className="week-stat-info">
                  <span className="week-stat-number">{loading ? '-' : stats.dossiersAssignes}</span>
                  <span className="week-stat-label">Dossiers total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStagiaire;
