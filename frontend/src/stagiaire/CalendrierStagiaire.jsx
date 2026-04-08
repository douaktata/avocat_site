import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getTrials } from '../api';
import './CalendrierStagiaire.css';

const toDateTime = (iso) => iso ? iso.replace('T', ' ').substring(0, 19) : '';

const CalendrierStagiaire = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [allEvents, setAllEvents] = useState([]);

  const loadEvents = useCallback(() => {
    getTrials()
      .then(res => {
        const trials = res.data.map(t => ({
          id: `t_${t.idt}`,
          date_time: toDateTime(t.hearing_date),
          duration: 90,
          client_first_name: t.case_number || 'Audience',
          client_last_name: '',
          event_type: 'Audience',
          event_category: 'hearing',
        })).filter(e => e.date_time);
        setAllEvents(trials.sort((a, b) => a.date_time.localeCompare(b.date_time)));
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
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(e =>
      e.event_type.toLowerCase().includes(q) ||
      e.client_first_name.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00'
  ];

  const formatTimeLabel = (t) => {
    const h = parseInt(t.split(':')[0]);
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
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
    filteredEvents.filter(e => {
      const [d, t] = e.date_time.split(' ');
      return d === dateStr && parseInt(t.split(':')[0]) === hour;
    });

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + direction * 7);
    else newDate.setMonth(newDate.getMonth() + direction);
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
    const [, t] = dateTime.split(' ');
    const startH = parseInt(t.split(':')[0]);
    const startM = parseInt(t.split(':')[1]);
    const endTotal = startH * 60 + startM + duration;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const fmt = (h, m) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const dh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${dh}:${String(m).padStart(2, '0')} ${period}`;
    };
    return `${fmt(startH, startM)} - ${fmt(endH, endM)}`;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = Array.from({ length: firstDay.getDay() }, () => null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        date: d,
        fullDate: date,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isToday: isSameDay(date, new Date()),
      });
    }
    return days;
  };

  const getEventsForDate = (dateStr) =>
    filteredEvents.filter(e => e.date_time.split(' ')[0] === dateStr);

  const getTitle = () => {
    if (viewMode === 'day')
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getDayViewDate = () => {
    const d = currentDate;
    return {
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      isToday: isSameDay(d, new Date()),
    };
  };

  const daysOfWeek = getDaysOfWeek();

  return (
    <div className="schedule-wrapper">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="nav-tabs">
          <button className="nav-tab active">⚖️ Audiences du Tribunal</button>
        </div>
        <div className="nav-actions">
          <div className="search-wrapper">
            <span className="search-icon">&#128269;</span>
            <input
              type="text"
              className="search-box"
              placeholder="Rechercher une audience..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Week Controls */}
      <div className="week-controls">
        <div className="week-nav-left">
          <h2 className="week-title">{getTitle()}</h2>
          <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
          <div className="arrow-group">
            <button className="nav-arrow" onClick={() => navigate(-1)}>&#8249;</button>
            <button className="nav-arrow" onClick={() => navigate(1)}>&#8250;</button>
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

      {/* ========== WEEK VIEW ========== */}
      {viewMode === 'week' && (
        <div className="schedule-container">
          <div className="schedule-grid">
            <div className="week-header">
              <div className="time-label-header"></div>
              {daysOfWeek.map((day, i) => (
                <div key={i} className={`day-header ${day.isToday ? 'today' : ''}`}>
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
                          <div className="event-title">⚖️ {event.event_type}</div>
                          <div className="event-client">{event.client_first_name} {event.client_last_name}</div>
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
                          <span className="day-event-icon">⚖️</span>
                        </div>
                        <div className="day-event-info">
                          <div className="day-event-title">{event.event_type}</div>
                          <div className="day-event-meta">
                            <span>{formatEventRange(event.date_time, event.duration)}</span>
                            <span className="day-event-sep">·</span>
                            <span>{event.client_first_name} {event.client_last_name}</span>
                          </div>
                        </div>
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

export default CalendrierStagiaire;
