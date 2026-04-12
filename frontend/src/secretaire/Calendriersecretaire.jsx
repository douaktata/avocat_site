import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Clock, User, MapPin, Tag, Trash2 } from 'lucide-react';
import { getAppointments, getTrials, getAudiences, createAppointment, deleteAppointment, deleteTrial, deleteAudience, getUsersByRole } from '../api';
import './CalendrierSecretaire.css';

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toDateTime = (iso) => iso ? iso.replace('T',' ').substring(0,16) : '';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const DAYS_FULL = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

function fmtTime(str) {
  if (!str) return '';
  const parts = str.split(' ');
  return parts[1] ? parts[1].substring(0,5) : '';
}

function fmtDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function isToday(dateStr) {
  return dateStr === toDateStr(new Date());
}

function categoryLabel(cat) {
  if (cat === 'appointment') return 'Rendez-vous';
  if (cat === 'hearing')     return 'Audience';
  if (cat === 'postponed')   return 'Reporté';
  return cat;
}

export default function CalendrierSecretaire() {
  const [view, setView]               = useState('agenda'); // 'agenda' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allEvents, setAllEvents]     = useState([]);
  const [clients, setClients]         = useState([]);
  const [selected, setSelected]       = useState(null);   // event detail modal
  const [showNew, setShowNew]         = useState(false);
  const [filter, setFilter]           = useState('all');  // 'all' | 'appointment' | 'hearing'
  const today = toDateStr(new Date());
  const [form, setForm]               = useState({ date: today, heure: '09:00', clientId: '', reason: '' });
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    getUsersByRole('CLIENT').then(r => setClients(r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    Promise.all([getAppointments(), getTrials(), getAudiences()])
      .then(([a, t, au]) => {
        const appts = a.data.filter(x => x.appointmentDate).map(x => ({
          id: x.ida, rawId: x.ida, type: 'appointment',
          dt: toDateTime(x.appointmentDate),
          title: x.reason || 'Consultation',
          client: x.user ? `${x.user.prenom || ''} ${x.user.nom || ''}`.trim() : (x.clientName || '—'),
          status: x.status || 'PENDING',
          location: '',
        }));
        const trials = t.data.filter(x => x.hearing_date).map(x => ({
          id: `t_${x.idt}`, rawId: x.idt, type: 'hearing',
          dt: toDateTime(x.hearing_date),
          title: 'Audience (Tribunal)',
          client: x.case_number || '—',
          status: 'CONFIRMED',
          location: x.location || '',
        }));
        const LABEL = { CONSULTATION:'Consultation', HEARING:'Audience', APPEL:'Appel', MEDIATION:'Médiation', AUTRE:'Autre' };
        const auds = (au.data || []).filter(x => x.hearingDate && x.status !== 'CANCELLED').map(x => ({
          id: `a_${x.id}`, rawId: x.id, type: x.status === 'POSTPONED' ? 'postponed' : 'hearing',
          dt: toDateTime(x.hearingDate),
          title: LABEL[x.hearingType] || x.hearingType || 'Audience',
          client: x.clientFullName || x.caseNumber || '—',
          status: x.status || 'CONFIRMED',
          location: x.location || '',
        }));
        setAllEvents([...appts, ...trials, ...auds].sort((a,b) => a.dt.localeCompare(b.dt)));
      }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered events ──
  const filtered = useMemo(() => {
    if (filter === 'all') return allEvents;
    if (filter === 'hearing') return allEvents.filter(e => e.type === 'hearing' || e.type === 'postponed');
    return allEvents.filter(e => e.type === filter);
  }, [allEvents, filter]);

  // ── Agenda: full week (Mon–Sun) of currentDate ──
  const agendaDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // start on Monday
    d.setDate(d.getDate() + diff);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      const ds = toDateStr(date);
      const evs = filtered.filter(e => e.dt.startsWith(ds));
      days.push({ dateStr: ds, events: evs, d: date });
    }
    return days;
  }, [currentDate, filtered]);

  // ── Month view ──
  const monthDays = useMemo(() => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const first = new Date(y, m, 1);
    const last  = new Date(y, m+1, 0);
    const days  = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(y, m, d);
      const ds   = toDateStr(date);
      days.push({ d, ds, date, evs: filtered.filter(e => e.dt.startsWith(ds)) });
    }
    return days;
  }, [currentDate, filtered]);

  const nav = (dir) => {
    const d = new Date(currentDate);
    if (view === 'agenda') d.setDate(d.getDate() + dir * 7);
    else                   d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const getWeekTitle = () => {
    const d = new Date(currentDate);
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() + diff);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const s = (dt) => `${dt.getDate()} ${MONTHS_FR[dt.getMonth()].substring(0,3)}`;
    return `${s(mon)} — ${s(sun)} ${sun.getFullYear()}`;
  };

  const handleDelete = async (e) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    try {
      if (e.type === 'appointment')          await deleteAppointment(e.rawId);
      else if (String(e.id).startsWith('a_')) await deleteAudience(e.rawId);
      else                                    await deleteTrial(e.rawId);
      setSelected(null);
      load();
    } catch { alert('Erreur lors de la suppression'); }
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    if (!form.clientId || !form.date || !form.heure) return;
    setSaving(true);
    try {
      await createAppointment({
        user: { idu: parseInt(form.clientId) },
        appointment_date: `${form.date}T${form.heure}:00`,
        status: 'CONFIRMED',
        reason: form.reason,
      });
      load();
      setShowNew(false);
      setForm({ date: toDateStr(new Date()), heure: '09:00', clientId: '', reason: '' });
    } catch { alert('Erreur lors de la création'); }
    finally { setSaving(false); }
  };

  const title = view === 'agenda'
    ? getWeekTitle()
    : `${MONTHS_FR[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="cal-page">

      {/* ── Header ── */}
      <div className="cal-header">
        <div className="cal-header-left">
          <h1 className="cal-title">Calendrier</h1>
          <p className="cal-subtitle">Rendez-vous, audiences et échéances</p>
        </div>
        <button className="cal-btn-new" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Nouveau RDV
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => nav(-1)}><ChevronLeft size={16}/></button>
          <span className="cal-nav-title">{title}</span>
          <button className="cal-nav-btn" onClick={() => nav(1)}><ChevronRight size={16}/></button>
          <button className="cal-today-btn" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
        </div>
        <div className="cal-toolbar-right">
          <div className="cal-filters">
            {[['all','Tous'],['appointment','RDV'],['hearing','Audiences']].map(([k,l]) => (
              <button key={k} className={`cal-filter${filter===k?' active':''}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <div className="cal-views">
            {[['agenda','Agenda'],['month','Mois']].map(([k,l]) => (
              <button key={k} className={`cal-view-btn${view===k?' active':''}`} onClick={() => setView(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Agenda View ── */}
      {view === 'agenda' && (
        <div className="cal-agenda">
          {agendaDays.length === 0 && (
            <div className="cal-empty">
              <Calendar size={32} />
              <p>Aucun événement sur cette période</p>
            </div>
          )}
          {agendaDays.map(({ dateStr, events: evs, d }) => (
            <div key={dateStr} className="agenda-day">
              <div className={`agenda-day-label${isToday(dateStr) ? ' today' : ''}`}>
                <span className="agenda-day-name">{DAYS_FR[d.getDay()]}</span>
                <span className={`agenda-day-num${isToday(dateStr) ? ' today' : ''}`}>{d.getDate()}</span>
                <span className="agenda-month-name">{MONTHS_FR[d.getMonth()]}</span>
              </div>
              <div className="agenda-day-events">
                {evs.length === 0 ? (
                  <div className="agenda-no-events">Pas d'événement</div>
                ) : evs.map(ev => (
                  <div key={ev.id} className={`agenda-event ev-${ev.type}`} onClick={() => setSelected(ev)}>
                    <div className={`ev-stripe ev-stripe-${ev.type}`} />
                    <div className="ev-body">
                      <div className="ev-row">
                        <span className="ev-title">{ev.title}</span>
                        <span className={`ev-tag ev-tag-${ev.type}`}>{categoryLabel(ev.type)}</span>
                      </div>
                      <div className="ev-meta">
                        <span className="ev-meta-item"><Clock size={12}/>{fmtTime(ev.dt)}</span>
                        <span className="ev-meta-item"><User size={12}/>{ev.client}</span>
                        {ev.location && <span className="ev-meta-item"><MapPin size={12}/>{ev.location}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Month View ── */}
      {view === 'month' && (
        <div className="cal-month-wrap">
          <div className="month-head">
            {DAYS_FR.map(d => <div key={d} className="month-head-cell">{d}</div>)}
          </div>
          <div className="month-grid">
            {monthDays.map((day, i) => (
              <div key={i} className={`month-cell${!day?'  empty':''}${day?.ds === toDateStr(new Date()) ? ' today' : ''}`}
                onClick={() => { if (day) { setCurrentDate(day.date); setView('agenda'); } }}>
                {day && (
                  <>
                    <span className={`month-cell-num${day.ds === toDateStr(new Date()) ? ' today' : ''}`}>{day.d}</span>
                    <div className="month-cell-dots">
                      {day.evs.slice(0,3).map((ev,j) => (
                        <div key={j} className={`month-dot ev-dot-${ev.type}`} title={ev.title}>{ev.title}</div>
                      ))}
                      {day.evs.length > 3 && <div className="month-dot-more">+{day.evs.length-3}</div>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {selected && (
        <div className="cal-overlay" onClick={() => setSelected(null)}>
          <div className="cal-detail" onClick={e => e.stopPropagation()}>
            <div className="detail-head">
              <div>
                <span className={`ev-tag ev-tag-${selected.type}`}>{categoryLabel(selected.type)}</span>
                <h2 className="detail-title">{selected.title}</h2>
              </div>
              <button className="detail-close" onClick={() => setSelected(null)}><X size={16}/></button>
            </div>
            <div className="detail-body">
              <div className="detail-row">
                <Calendar size={15} className="detail-icon" />
                <div>
                  <div className="detail-label">Date</div>
                  <div className="detail-value">{fmtDateLong(selected.dt.split(' ')[0])}</div>
                </div>
              </div>
              <div className="detail-row">
                <Clock size={15} className="detail-icon" />
                <div>
                  <div className="detail-label">Heure</div>
                  <div className="detail-value">{fmtTime(selected.dt)}</div>
                </div>
              </div>
              <div className="detail-row">
                <User size={15} className="detail-icon" />
                <div>
                  <div className="detail-label">Client / Dossier</div>
                  <div className="detail-value">{selected.client}</div>
                </div>
              </div>
              {selected.location && (
                <div className="detail-row">
                  <MapPin size={15} className="detail-icon" />
                  <div>
                    <div className="detail-label">Lieu</div>
                    <div className="detail-value">{selected.location}</div>
                  </div>
                </div>
              )}
              <div className="detail-row">
                <Tag size={15} className="detail-icon" />
                <div>
                  <div className="detail-label">Statut</div>
                  <div className="detail-value">{selected.status}</div>
                </div>
              </div>
            </div>
            {selected.type === 'appointment' && (
              <div className="detail-foot">
                <button className="detail-delete" onClick={() => handleDelete(selected)}>
                  <Trash2 size={14}/> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── New Appointment Modal ── */}
      {showNew && (
        <div className="cal-overlay" onClick={() => setShowNew(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Nouveau rendez-vous</h3>
              <button className="detail-close" onClick={() => setShowNew(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-field">
                <label>Client *</label>
                <select required value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => <option key={c.idu} value={c.idu}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Date *</label>
                <div className="form-date-row">
                  <select required value={form.date.split('-')[2] || ''} onChange={e => {
                    const [y, m] = form.date.split('-');
                    setForm({...form, date: `${y||new Date().getFullYear()}-${m||pad(new Date().getMonth()+1)}-${pad(e.target.value)}`});
                  }}>
                    <option value="">Jour</option>
                    {Array.from({length:31},(_,i)=><option key={i+1} value={pad(i+1)}>{i+1}</option>)}
                  </select>
                  <select required value={form.date.split('-')[1] || ''} onChange={e => {
                    const [y,,d] = form.date.split('-');
                    setForm({...form, date: `${y||new Date().getFullYear()}-${e.target.value}-${d||'01'}`});
                  }}>
                    <option value="">Mois</option>
                    {MONTHS_FR.map((m,i)=><option key={i} value={pad(i+1)}>{m}</option>)}
                  </select>
                  <select required value={form.date.split('-')[0] || ''} onChange={e => {
                    const [,,d] = form.date.split('-'); const [,m] = form.date.split('-');
                    setForm({...form, date: `${e.target.value}-${m||pad(new Date().getMonth()+1)}-${d||'01'}`});
                  }}>
                    <option value="">Année</option>
                    {[2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Heure *</label>
                <select value={form.heure} onChange={e => setForm({...form, heure: e.target.value})}>
                  {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                    '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
                    '16:00','16:30','17:00','17:30','18:00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Motif</label>
                <input type="text" placeholder="Ex: Consultation, Suivi dossier..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNew(false)}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Créer le rendez-vous'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
