import React, { useState, useEffect } from 'react';
import { getTodayAppointments, getTrials, getTasks } from '../api';
import { useAuth } from '../AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [allAppointments, setAllAppointments] = useState([]);
  const [allHearings, setAllHearings] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animateIn, setAnimateIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const quotes = [
    "Nul n'est cense ignorer la loi.",
    "La liberte des uns s'arrete la ou commence celle des autres.",
    "La justice eleve une nation.",
    "Un mauvais compromis vaut mieux qu'un bon proces.",
    "Le droit est l'expression de la volonte generale.",
    "A droit egal, force egale.",
    "La verite finit toujours par triompher."
  ];
  const [currentQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      getTodayAppointments().catch(() => ({ data: [] })),
      getTrials().catch(() => ({ data: [] })),
      getTasks().catch(() => ({ data: [] })),
    ]).then(([rdvRes, trialsRes, tasksRes]) => {
      setAllAppointments(rdvRes.data);
      // filter trials for today
      const today = new Date();
      const todayTrials = trialsRes.data.filter(t => {
        if (!t.hearing_date) return false;
        const d = new Date(t.hearing_date);
        return d.toDateString() === today.toDateString();
      });
      setAllHearings(todayTrials);
      setAllTasks(tasksRes.data.slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const formatDateFull = (date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const getTimelineEvents = () => {
    const rdvs = allAppointments.map(rdv => ({
      heure: rdv.appointmentDate ? new Date(rdv.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
      type: 'RDV',
      titre: rdv.user ? `${rdv.user.prenom || ''} ${rdv.user.nom || ''}` : '-',
      timestamp: rdv.appointmentDate ? new Date(rdv.appointmentDate).getTime() : 0,
    }));
    const proces = allHearings.map(h => ({
      heure: h.hearing_date ? new Date(h.hearing_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
      type: 'Audience',
      titre: `${h.location || ''} - ${h.case_number || ''}`,
      timestamp: h.hearing_date ? new Date(h.hearing_date).getTime() : 0,
    }));
    return [...rdvs, ...proces].sort((a, b) => a.timestamp - b.timestamp);
  };

  const getUpcomingHearing = () => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    for (const h of allHearings) {
      const t = new Date(h.hearing_date);
      if (t >= now && t <= twoHoursLater) {
        return {
          heure: t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          titre: `${h.location || ''} - ${h.case_number || ''}`,
        };
      }
    }
    return null;
  };

  const timelineEvents = getTimelineEvents();
  const upcomingHearing = getUpcomingHearing();

  if (loading) return <div className="dashboard-wrapper"><p style={{padding:'2rem'}}>Chargement...</p></div>;

  return (
    <div className={`dashboard-wrapper ${animateIn ? 'animate-in' : ''}`}>
      <div className="dash-hero">
        <div className="dash-hero-left">
          <p className="dash-date">{formatDateFull(today)}</p>
          <h1 className="dash-title">Bienvenue, <span className="dash-name">{user ? `${user.prenom || ''} ${user.nom || ''}` : 'Maitre'}</span></h1>
          <p className="dash-quote">
            <span className="quote-mark">"</span>
            {currentQuote}
            <span className="quote-mark">"</span>
          </p>
        </div>
        <div className="dash-hero-right">
          <div className="dash-clock-block">
            <div className="dash-clock-time">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="colon">:</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="dash-clock-sub">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {upcomingHearing && (
        <div className="hearing-alert">
          <div className="alert-pulse"></div>
          <i className="fas fa-gavel"></i>
          <div className="alert-text">
            <span className="alert-label">Audience imminente</span>
            <span className="alert-detail">
              A <strong>{upcomingHearing.heure}</strong> - {upcomingHearing.titre}
            </span>
          </div>
        </div>
      )}

      <div className="kpi-row">
        <div className="kpi-card kpi-rdv">
          <div className="kpi-icon-wrap"><i className="fas fa-calendar-check"></i></div>
          <div className="kpi-body">
            <span className="kpi-number">{allAppointments.length}</span>
            <span className="kpi-label">Rendez-vous</span>
            <span className="kpi-sub">Aujourd'hui</span>
          </div>
          <div className="kpi-corner-bar"></div>
        </div>
        <div className="kpi-card kpi-audience">
          <div className="kpi-icon-wrap"><i className="fas fa-gavel"></i></div>
          <div className="kpi-body">
            <span className="kpi-number">{allHearings.length}</span>
            <span className="kpi-label">Audiences</span>
            <span className="kpi-sub">A plaider</span>
          </div>
          <div className="kpi-corner-bar"></div>
        </div>
        <div className="kpi-card kpi-tasks">
          <div className="kpi-icon-wrap"><i className="fas fa-clipboard-list"></i></div>
          <div className="kpi-body">
            <span className="kpi-number">{allTasks.length}</span>
            <span className="kpi-label">Taches</span>
            <span className="kpi-sub">A finaliser</span>
          </div>
          <div className="kpi-corner-bar"></div>
        </div>
        <div className="kpi-card kpi-total">
          <div className="kpi-icon-wrap"><i className="fas fa-layer-group"></i></div>
          <div className="kpi-body">
            <span className="kpi-number">{allAppointments.length + allHearings.length + allTasks.length}</span>
            <span className="kpi-label">Total</span>
            <span className="kpi-sub">Activites du jour</span>
          </div>
          <div className="kpi-corner-bar"></div>
        </div>
      </div>

      <div className="dash-columns">
        <section className="dash-panel">
          <div className="panel-header">
            <h2 className="panel-title"><i className="fas fa-calendar-day"></i> Planning du jour</h2>
            <span className="panel-badge">{timelineEvents.length} evenements</span>
          </div>
          <div className="timeline">
            {timelineEvents.length > 0 ? timelineEvents.map((event, index) => (
              <div key={index} className={`tl-item tl-${event.type === 'RDV' ? 'rdv' : 'audience'}`}>
                <div className="tl-time"><span>{event.heure}</span></div>
                <div className="tl-connector">
                  <div className="tl-dot"></div>
                  {index < timelineEvents.length - 1 && <div className="tl-line"></div>}
                </div>
                <div className="tl-content">
                  <span className={`tl-badge tl-badge-${event.type === 'RDV' ? 'rdv' : 'audience'}`}>{event.type}</span>
                  <span className="tl-titre">{event.titre}</span>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>Aucun evenement aujourd'hui</p>
              </div>
            )}
          </div>
        </section>

        <section className="dash-panel">
          <div className="panel-header">
            <h2 className="panel-title"><i className="fas fa-tasks"></i> Taches du jour</h2>
            <span className="panel-badge">{allTasks.length} taches</span>
          </div>
          <div className="task-list">
            {allTasks.length > 0 ? allTasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-checkbox"><i className="fas fa-circle"></i></div>
                <div className="task-body">
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description}</p>
                </div>
                <div className="task-meta">
                  <span className={`task-priority priority-${task.priority === 'HIGH' ? 'haute' : 'normale'}`}>
                    {task.priority === 'HIGH' ? 'Urgent' : 'Normal'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <i className="fas fa-check-double"></i>
                <p>Toutes les taches sont completees</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
