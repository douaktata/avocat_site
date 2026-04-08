import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getAppointments, getTrials, getAudiences, createAppointment, deleteAppointment, deleteTrial, deleteAudience, getUsersByRole } from '../api';
import '../avocate/Calendrier.css';

const toDateTime = (iso) => iso ? iso.replace('T', ' ').substring(0, 19) : '';

const CalendrierSecretaire = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('week');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [newAppt, setNewAppt] = useState({ date: '', heure: '09:00', clientId: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUsersByRole('CLIENT').then(res => setClients(res.data)).catch(() => {});
  }, []);

  const loadEvents = useCallback(() => {
    Promise.all([getAppointments(), getTrials(), getAudiences()])
      .then(([apptRes, trialRes, audRes]) => {
        const appts = apptRes.data
          .filter(a => a.appointmentDate)
          .map(a => ({
            id: a.ida,
            date_time: toDateTime(a.appointmentDate),
            duration: 60,
            client_first_name: a.user?.nom || 'Client',
            client_last_name: a.user?.prenom || '',
            event_type: a.reason || 'Consultation',
            event_category: 'appointment',
          }));
        const trials = trialRes.data
          .filter(t => t.hearing_date)
          .map(t => ({
            id: `t_${t.idt}`,
            date_time: toDateTime(t.hearing_date),
            duration: 90,
            client_first_name: t.case_number || '—',
            client_last_name: t.location ? `· ${t.location}` : '',
            event_type: 'Audience (Tribunal)',
            event_category: 'hearing',
          }));
        const HEARING_TYPE_LABEL = { CONSULTATION: 'Consultation', HEARING: 'Audience', APPEL: 'Appel', MEDIATION: 'Médiation', AUTRE: 'Autre' };
        const audiences = (audRes.data || [])
          .filter(a => a.hearingDate && a.status !== 'CANCELLED')
          .map(a => ({
            id: `a_${a.id}`,
            date_time: toDateTime(a.hearingDate),
            duration: 90,
            client_first_name: a.caseNumber || '—',
            client_last_name: a.clientFullName ? `· ${a.clientFullName}` : '',
            event_type: (HEARING_TYPE_LABEL[a.hearingType] || a.hearingType || 'Audience'),
            event_category: a.status === 'POSTPONED' ? 'postponed' : 'hearing',
          }));
        setAllEvents([...appts, ...trials, ...audiences].sort((a, b) => a.date_time.localeCompare(b.date_time)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const getWeekStart = useCallback((date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentWeekStart = useMemo(() => getWeekStart(currentDate), [currentDate, getWeekStart]);

  const events = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const startStr = currentWeekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];
    return allEvents.filter(e => {
      const d = e.date_time.split(' ')[0];
      return d >= startStr && d < endStr;
    });
  }, [allEvents, currentWeekStart]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (activeTab !== 'all') filtered = filtered.filter(e =>
      activeTab === 'hearing'
        ? e.event_category === 'hearing' || e.event_category === 'postponed'
        : e.event_category === activeTab
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.event_type.toLowerCase().includes(q) ||
        e.client_first_name.toLowerCase().includes(q) ||
        e.client_last_name.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [events, activeTab, searchQuery]);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00',
  ];

  const formatTimeLabel = (t) => {
    const h = parseInt(t.split(':')[0]);
    if (h === 0)  return '12:00 AM';
    if (h < 12)   return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const getDaysOfWeek = useCallback(() => {
    const dayNames = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      return {
        name: dayNames[i],
        date: date.getDate(),
        fullDate: date,
        dateStr: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [currentWeekStart]);

  const getEventsForDayAndTime = (dateStr, hour) =>
    filteredEvents.filter(event => {
      const eventDate = event.date_time.split(' ')[0];
      const eventHour = parseInt(event.date_time.split(' ')[1].split(':')[0]);
      return eventDate === dateStr && eventHour === hour;
    });

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day')        newDate.setDate(newDate.getDate() + direction);
    else if (viewMode === 'week')  newDate.setDate(newDate.getDate() + direction * 7);
    else                           newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatWeekRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('fr-FR', opts)} — ${end.toLocaleDateString('fr-FR', opts)} ${end.getFullYear()}`;
  };

  const formatEventRange = (dateTime, duration) => {
    const startH = parseInt(dateTime.split(' ')[1].split(':')[0]);
    const startM = parseInt(dateTime.split(' ')[1].split(':')[1]);
    const endTotalM = startH * 60 + startM + duration;
    const endH = Math.floor(endTotalM / 60);
    const endM = endTotalM % 60;
    const fmt = (h, m) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const dh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${dh}:${String(m).padStart(2, '0')} ${period}`;
    };
    return `${fmt(startH, startM)} - ${fmt(endH, endM)}`;
  };

  const handleDelete = (eventId) => {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return;
    deleteAppointment(eventId)
      .then(() => loadEvents())
      .catch(() => alert('Erreur lors de la suppression'));
  };

  const handleDeleteHearing = (eventId) => {
    if (!window.confirm('Supprimer cette audience ?')) return;
    const idStr = String(eventId);
    if (idStr.startsWith('a_')) {
      deleteAudience(idStr.replace('a_', ''))
        .then(() => loadEvents())
        .catch(() => alert('Erreur lors de la suppression'));
    } else {
      deleteTrial(idStr.replace('t_', ''))
        .then(() => loadEvents())
        .catch(() => alert('Erreur lors de la suppression'));
    }
  };

  const getCategoryIcon = (category) => {
    if (category === 'appointment') return '📋';
    if (category === 'hearing')     return '⚖️';
    if (category === 'postponed')   return '🔄';
    return '📅';
  };

  const getDayViewDate = () => {
    const d = currentDate;
    return {
      name: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
      date: d.getDate(),
      fullDate: d,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      isToday: isSameDay(d, new Date()),
    };
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date: day,
        fullDate: date,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isToday: isSameDay(date, new Date()),
      });
    }
    return days;
  };

  const getEventsForDate = (dateStr) =>
    filteredEvents.filter(event => event.date_time.split(' ')[0] === dateStr);

  const getTitle = () => {
    if (viewMode === 'day') return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const daysOfWeek = getDaysOfWeek();

  const tabs = [
    { key: 'all',         label: 'Tous' },
    { key: 'appointment', label: 'Rendez-vous' },
    { key: 'hearing',     label: 'Audiences' },
  ];

  return (
    <div className="schedule-wrapper">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="nav-actions">
          <div className="search-wrapper">
            <span className="search-icon">&#128269;</span>
            <input
              type="text"
              className="search-box"
              placeholder="Rechercher un rendez-vous..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
          <button className="filter-btn-top">
            <span>&#9776;</span> Filtrer
          </button>
          <button className="new-btn" onClick={() => setShowNewModal(true)}>
            + Nouveau
          </button>
        </div>
      </div>

      {/* Week Controls */}
      <div className="week-controls">
        <div className="week-nav-left">
          <h2 className="week-title">{getTitle()}</h2>
          <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
          <div className="arrow-group">
            <button className="nav-arrow" onClick={() => navigate(-1)} title="Précédent">&#8249;</button>
            <button className="nav-arrow" onClick={() => navigate(1)} title="Suivant">&#8250;</button>
          </div>
        </div>
        <div className="week-nav-right">
          <div className="view-toggles">
            {['day', 'week', 'month'].map(mode => (
              <button
                key={mode}
                className={`view-toggle ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
          {viewMode === 'week' && <span className="date-range">{formatWeekRange()}</span>}
        </div>
      </div>

      {/* Modal nouveau rendez-vous */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouveau rendez-vous</h3>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newAppt.clientId || !newAppt.date || !newAppt.heure) return;
              setSaving(true);
              createAppointment({
                user: { idu: parseInt(newAppt.clientId) },
                appointment_date: `${newAppt.date}T${newAppt.heure}:00`,
                status: 'CONFIRMED',
                reason: newAppt.reason,
              })
                .then(() => {
                  loadEvents();
                  setNewAppt({ date: '', heure: '09:00', clientId: '', reason: '' });
                  setShowNewModal(false);
                })
                .catch(() => alert('Erreur lors de la création'))
                .finally(() => setSaving(false));
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.875rem' }}>Client *</label>
                  <select
                    required
                    value={newAppt.clientId}
                    onChange={e => setNewAppt({ ...newAppt, clientId: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem' }}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => (
                      <option key={c.idu} value={c.idu}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.875rem' }}>Date *</label>
                    <input
                      type="date"
                      required
                      value={newAppt.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.875rem' }}>Heure *</label>
                    <input
                      type="time"
                      required
                      value={newAppt.heure}
                      onChange={e => setNewAppt({ ...newAppt, heure: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.875rem' }}>Motif</label>
                  <input
                    type="text"
                    placeholder="Ex: Consultation, Suivi dossier..."
                    value={newAppt.reason}
                    onChange={e => setNewAppt({ ...newAppt, reason: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowNewModal(false)}
                  style={{ padding: '0.6rem 1.2rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '0.6rem 1.4rem', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Enregistrement...' : 'Créer le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== WEEK VIEW ========== */}
      {viewMode === 'week' && (
        <div className="schedule-container">
          <div className="schedule-grid">
            <div className="week-header">
              <div className="time-label-header"></div>
              {daysOfWeek.map((day, index) => (
                <div key={index} className={`day-header ${day.isToday ? 'today' : ''}`}>
                  <div className="day-name">{day.name}</div>
                  <div className="day-date">{day.date}</div>
                </div>
              ))}
            </div>

            {timeSlots.map((slot, timeIndex) => {
              const hour = parseInt(slot.split(':')[0]);
              return (
                <div key={timeIndex} className="time-row">
                  <div className="time-label">{formatTimeLabel(slot)}</div>
                  {daysOfWeek.map((day, dayIndex) => (
                    <div key={dayIndex} className={`time-slot ${day.isToday ? 'today-col' : ''}`}>
                      {getEventsForDayAndTime(day.dateStr, hour).map(event => (
                        <div key={event.id} className={`event-block ${event.event_category}`}>
                          <div className="event-time">{formatEventRange(event.date_time, event.duration)}</div>
                          <div className="event-title">
                            {getCategoryIcon(event.event_category)}{' '}
                            {event.event_category === 'postponed' ? `↻ Reportée · ${event.event_type}` : event.event_type}
                          </div>
                          <div className="event-client">{event.client_first_name} {event.client_last_name}</div>
                          <button
                            className="event-delete-btn"
                            onClick={(e) => { e.stopPropagation(); event.event_category === 'hearing' ? handleDeleteHearing(event.id) : handleDelete(event.id); }}
                            title="Supprimer"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== DAY VIEW ========== */}
      {viewMode === 'day' && (
        <div className="schedule-container day-view">
          <div className="day-view-grid">
            {timeSlots.map((slot, timeIndex) => {
              const hour = parseInt(slot.split(':')[0]);
              const dayData = getDayViewDate();
              return (
                <div key={timeIndex} className="day-view-row">
                  <div className="day-view-time">{formatTimeLabel(slot)}</div>
                  <div className="day-view-slot">
                    {getEventsForDayAndTime(dayData.dateStr, hour).map(event => (
                      <div key={event.id} className={`day-event-block ${event.event_category}`}>
                        <div className="day-event-left">
                          <span className="day-event-icon">{getCategoryIcon(event.event_category)}</span>
                        </div>
                        <div className="day-event-info">
                          <div className="day-event-title">
                            {event.event_category === 'postponed' ? `↻ Reportée · ${event.event_type}` : event.event_type}
                          </div>
                          <div className="day-event-meta">
                            <span>{formatEventRange(event.date_time, event.duration)}</span>
                            <span className="day-event-sep">·</span>
                            <span>{event.client_first_name} {event.client_last_name}</span>
                          </div>
                        </div>
                        <button
                          className="event-delete-btn"
                          onClick={(e) => { e.stopPropagation(); event.event_category === 'hearing' ? handleDeleteHearing(event.id) : handleDelete(event.id); }}
                          title="Supprimer"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== MONTH VIEW ========== */}
      {viewMode === 'month' && (
        <div className="schedule-container month-view">
          <div className="month-grid-header">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
              <div key={d} className="month-day-name">{d}</div>
            ))}
          </div>
          <div className="month-grid">
            {getMonthDays().map((day, i) => (
              <div
                key={i}
                className={`month-cell ${!day ? 'empty' : ''} ${day?.isToday ? 'today' : ''}`}
                onClick={() => { if (day) { setCurrentDate(day.fullDate); setViewMode('day'); } }}
              >
                {day && (
                  <>
                    <div className="month-cell-date">{day.date}</div>
                    <div className="month-cell-events">
                      {getEventsForDate(day.dateStr).slice(0, 3).map((ev, j) => (
                        <div key={j} className={`month-event-dot ${ev.event_category}`}>
                          {ev.event_type}
                        </div>
                      ))}
                      {getEventsForDate(day.dateStr).length > 3 && (
                        <div className="month-event-more">
                          +{getEventsForDate(day.dateStr).length - 3} autres
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendrierSecretaire;
