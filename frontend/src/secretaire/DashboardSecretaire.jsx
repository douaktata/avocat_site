import React, { useState, useEffect } from 'react';
import { getTodayAppointments, getPhoneCalls, getTasks, getUsersByRole } from '../api';
import { useAuth } from '../AuthContext';
import './DashboardSecretaire.css';

const DashboardSecretaire = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rdvAujourdhui, setRdvAujourdhui] = useState([]);
  const [appelsRecents, setAppelsRecents] = useState([]);
  const [taches, setTaches] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      getTodayAppointments(),
      getPhoneCalls(),
      getTasks(),
      getUsersByRole('CLIENT'),
    ]).then(([rdvRes, callsRes, tasksRes, clientsRes]) => {
      setRdvAujourdhui(rdvRes.data);
      setAppelsRecents(callsRes.data.slice(0, 5));
      setTaches(tasksRes.data.slice(0, 5));
      setTotalClients(clientsRes.data.length);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDateLong = (date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatHeure = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';

  const now = currentTime;

  const rdvTries = [...rdvAujourdhui].sort(
    (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)
  );
  const rdvAVenir = rdvTries.filter(r => new Date(r.appointmentDate) >= now);
  const rdvPasses = rdvTries.filter(r => new Date(r.appointmentDate) < now);

  const rdvConfirmes = rdvAVenir.filter(r => (r.status || '').toUpperCase() === 'CONFIRMED').length;
  const rdvEnAttente = rdvAVenir.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const tachesUrgentes = taches.filter(t => t.priority === 'HIGH').length;

  const getStatutBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') return { class: 'status-confirmed', label: 'Confirme' };
    if (s === 'CANCELLED') return { class: 'status-cancelled', label: 'Annule' };
    return { class: 'status-pending', label: 'En attente' };
  };

  const getPriorityClass = (p) =>
    ({ HIGH: 'priority-high', MEDIUM: 'priority-medium', LOW: 'priority-low' }[p] || 'priority-medium');

  if (loading) return <div className="dashboard-secretaire"><p style={{padding:'2rem'}}>Chargement...</p></div>;

  return (
    <div className="dashboard-secretaire">
      <div className="dash-hero">
        <div className="hero-left">
          <div className="greeting-section">
            <h1 className="greeting-title">
              Bonjour, <span className="user-name">{user?.prenom || 'Secretaire'}</span>
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
        <div className="stat-card primary">
          <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
          <div className="stat-content">
            <h3>{rdvAVenir.length} <span style={{fontSize:'0.85rem',fontWeight:500,opacity:0.7}}>/ {rdvAujourdhui.length}</span></h3>
            <p>RDV restants aujourd'hui</p>
            <div className="stat-detail">
              <span className="detail-success">{rdvConfirmes} confirmes</span>
              <span className="detail-warning">{rdvEnAttente} en attente</span>
            </div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><i className="fas fa-phone-volume"></i></div>
          <div className="stat-content">
            <h3>{appelsRecents.length}</h3>
            <p>Appels recents</p>
            <div className="stat-detail"><span>Enregistres</span></div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon"><i className="fas fa-users"></i></div>
          <div className="stat-content">
            <h3>{totalClients}</h3>
            <p>Clients au cabinet</p>
            <div className="stat-detail"><span>Total</span></div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon"><i className="fas fa-tasks"></i></div>
          <div className="stat-content">
            <h3>{tachesUrgentes}/{taches.length}</h3>
            <p>Taches urgentes</p>
            <div className="stat-detail"><span>A traiter en priorite</span></div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-left">
          <div className="content-card">
            <div className="card-header">
              <h3><i className="fas fa-calendar-alt"></i> Rendez-vous du jour</h3>
            </div>
            <div className="rdv-timeline">
              {rdvAujourdhui.length === 0 ? (
                <p style={{padding:'1rem',color:'#888'}}>Aucun rendez-vous aujourd'hui</p>
              ) : (
                <>
                  {rdvAVenir.length === 0 && (
                    <p style={{padding:'0.75rem 1rem',color:'#888',fontStyle:'italic',fontSize:'0.875rem'}}>
                      <i className="fas fa-check-circle" style={{color:'#10b981',marginRight:'0.4rem'}}></i>
                      Tous les rendez-vous du jour sont terminés
                    </p>
                  )}
                  {rdvAVenir.map(rdv => {
                    const statut = getStatutBadge(rdv.status);
                    return (
                      <div key={rdv.ida} className="timeline-item">
                        <div className="timeline-time">{formatHeure(rdv.appointmentDate)}</div>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <h4>{rdv.user ? `${rdv.user.prenom || ''} ${rdv.user.nom || ''}` : (rdv.clientName || '-')}</h4>
                            <span className={`status-badge ${statut.class}`}>{statut.label}</span>
                          </div>
                          <p className="timeline-type">{rdv.reason || '-'}</p>
                        </div>
                      </div>
                    );
                  })}

                  {rdvPasses.length > 0 && (
                    <>
                      <div className="timeline-separator">
                        <span><i className="fas fa-history"></i> Passes ({rdvPasses.length})</span>
                      </div>
                      {rdvPasses.map(rdv => {
                        const statut = getStatutBadge(rdv.status);
                        return (
                          <div key={rdv.ida} className="timeline-item timeline-item-past">
                            <div className="timeline-time timeline-time-past">{formatHeure(rdv.appointmentDate)}</div>
                            <div className="timeline-dot timeline-dot-past"></div>
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <h4>{rdv.user ? `${rdv.user.prenom || ''} ${rdv.user.nom || ''}` : (rdv.clientName || '-')}</h4>
                                <span className="status-badge status-past">Passe</span>
                              </div>
                              <p className="timeline-type">{rdv.reason || '-'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3><i className="fas fa-phone"></i> Appels recents</h3>
            </div>
            <div className="calls-list">
              {appelsRecents.length === 0 ? (
                <p style={{padding:'1rem',color:'#888'}}>Aucun appel enregistre</p>
              ) : appelsRecents.map(appel => (
                <div key={appel.id} className="call-item">
                  <div className="call-icon"><i className="fas fa-phone"></i></div>
                  <div className="call-info">
                    <h4>{appel.caller_full_name}</h4>
                    <p>{appel.call_reason}</p>
                  </div>
                  <div className="call-meta">
                    <span className="call-time">
                      {appel.call_date ? new Date(appel.call_date).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="content-right">
          <div className="content-card">
            <div className="card-header">
              <h3><i className="fas fa-clipboard-list"></i> Taches recentes</h3>
            </div>
            <div className="tasks-list">
              {taches.length === 0 ? (
                <p style={{padding:'1rem',color:'#888'}}>Aucune tache</p>
              ) : taches.map(tache => (
                <div key={tache.id} className={`task-item ${tache.status === 'COMPLETED' ? 'completed' : ''}`}>
                  <input type="checkbox" checked={tache.status === 'COMPLETED'} readOnly className="task-checkbox" />
                  <div className="task-content">
                    <p className={tache.status === 'COMPLETED' ? 'task-completed' : ''}>{tache.title}</p>
                    <span className={`task-priority ${getPriorityClass(tache.priority)}`}>
                      <i className={tache.priority === 'HIGH' ? 'fas fa-exclamation-circle' : 'fas fa-minus-circle'}></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSecretaire;
