import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Clock,
  User, MapPin, Tag, Trash2, Sparkles, CalendarDays, Check,
} from 'lucide-react';
import {
  getAppointments, getTrials, getAudiences,
  createAppointment, deleteAppointment, deleteTrial, deleteAudience,
  getUsersByRole,
} from '../api';
import './CalendrierSecretaire.css';

const pad = n => String(n).padStart(2, '0');
const toDateStr  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toDateTime = iso => iso ? iso.replace('T',' ').substring(0,16) : '';

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
  const [view,        setView]        = useState('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allEvents,   setAllEvents]   = useState([]);
  const [clients,     setClients]     = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [showNew,     setShowNew]     = useState(false);
  const [filter,      setFilter]      = useState('all');
  const today = toDateStr(new Date());
  const [form,  setForm]  = useState({ date: today, heure: '09:00', clientId: '', reason: '' });
  const [saving, setSaving] = useState(false);

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
          client: x.user ? `${x.user.prenom||''} ${x.user.nom||''}`.trim() : (x.clientName || '—'),
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
          id: `a_${x.id}`, rawId: x.id,
          type: x.status === 'POSTPONED' ? 'postponed' : 'hearing',
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

  const filtered = useMemo(() => {
    if (filter === 'all') return allEvents;
    if (filter === 'hearing') return allEvents.filter(e => e.type === 'hearing' || e.type === 'postponed');
    return allEvents.filter(e => e.type === filter);
  }, [allEvents, filter]);

  const agendaDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      const ds = toDateStr(date);
      days.push({ dateStr: ds, events: filtered.filter(e => e.dt.startsWith(ds)), d: date });
    }
    return days;
  }, [currentDate, filtered]);

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

  const nav = dir => {
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
    const s = dt => `${dt.getDate()} ${MONTHS_FR[dt.getMonth()].substring(0,3)}`;
    return `${s(mon)} — ${s(sun)} ${sun.getFullYear()}`;
  };

  const navTitle = view === 'agenda'
    ? getWeekTitle()
    : `${MONTHS_FR[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handleDelete = async e => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    try {
      if (e.type === 'appointment')           await deleteAppointment(e.rawId);
      else if (String(e.id).startsWith('a_')) await deleteAudience(e.rawId);
      else                                     await deleteTrial(e.rawId);
      setSelected(null);
      load();
    } catch { alert('Erreur lors de la suppression'); }
  };

  const handleCreate = async ev => {
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

  /* ── type color map ── */
  const TYPE_COLOR = {
    appointment: '#2563eb',
    hearing:     '#d97706',
    postponed:   '#db2777',
  };

  return (
    <div className="cal-page">

      {/* ── HEADER BANNER ── */}
      <div className="cal-header">
        <div className="cal-header-blob" />
        <div className="cal-header-top">
          <div className="cal-eyebrow"><Sparkles size={11} /> Calendrier du cabinet</div>
          <h1 className="cal-title">Agenda <em>& Audiences</em></h1>
          <p className="cal-subtitle">Rendez-vous, audiences et échéances du cabinet</p>
        </div>
        <button className="cal-btn-new" onClick={() => setShowNew(true)}>
          <Plus size={14} /> Nouveau RDV
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => nav(-1)}><ChevronLeft size={15}/></button>
          <span className="cal-nav-title">{navTitle}</span>
          <button className="cal-nav-btn" onClick={() => nav(1)}><ChevronRight size={15}/></button>
          <button className="cal-today-btn" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
        </div>
        <div className="cal-toolbar-right">
          <div className="cal-seg">
            {[['all','Tous'],['appointment','RDV'],['hearing','Audiences']].map(([k,l]) => (
              <button key={k} className={`cal-seg-btn${filter===k?' active':''}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <div className="cal-view-group">
            <button className={`cal-vbtn${view==='agenda'?' active':''}`} onClick={() => setView('agenda')}>Agenda</button>
            <button className={`cal-vbtn${view==='month'?' active':''}`}  onClick={() => setView('month')}>Mois</button>
          </div>
        </div>
      </div>

      {/* ── AGENDA VIEW ── */}
      {view === 'agenda' && (
        <div className="cal-agenda">
          {agendaDays.map(({ dateStr, events: evs, d }) => (
            <div key={dateStr} className="agenda-day">
              <div className={`agenda-day-label${isToday(dateStr) ? ' today' : ''}`}>
                <span className="agenda-day-name">{DAYS_FR[d.getDay()]}</span>
                <span className={`agenda-day-num${isToday(dateStr) ? ' today' : ''}`}>{d.getDate()}</span>
                <span className="agenda-month-name">{MONTHS_FR[d.getMonth()].substring(0,3)}</span>
              </div>
              <div className="agenda-day-events">
                {evs.length === 0 ? (
                  <div className="agenda-no-events">Pas d'événement</div>
                ) : evs.map(ev => (
                  <div key={ev.id} className="agenda-event" onClick={() => setSelected(ev)}>
                    <div className="ev-stripe" style={{ background: TYPE_COLOR[ev.type] || '#94a3b8' }} />
                    <div className="ev-body">
                      <div className="ev-row">
                        <span className="ev-title">{ev.title}</span>
                        <span className={`ev-tag ev-tag-${ev.type}`}>{categoryLabel(ev.type)}</span>
                      </div>
                      <div className="ev-meta">
                        <span className="ev-meta-item"><Clock size={11}/>{fmtTime(ev.dt)}</span>
                        <span className="ev-meta-item"><User size={11}/>{ev.client}</span>
                        {ev.location && <span className="ev-meta-item"><MapPin size={11}/>{ev.location}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {view === 'month' && (
        <div className="cal-month-wrap">
          <div className="month-head">
            {DAYS_FR.map(d => <div key={d} className="month-head-cell">{d}</div>)}
          </div>
          <div className="month-grid">
            {monthDays.map((day, i) => (
              <div
                key={i}
                className={`month-cell${!day ? ' empty' : ''}${day?.ds === today ? ' today' : ''}`}
                onClick={() => { if (day) { setCurrentDate(day.date); setView('agenda'); } }}
              >
                {day && (
                  <>
                    <span className={`month-cell-num${day.ds === today ? ' today' : ''}`}>{day.d}</span>
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

      {/* ── EVENT DETAIL MODAL ── */}
      {selected && createPortal(
        <div className="cal-scrim" onClick={() => setSelected(null)}>
          <div className="cal-detail" onClick={e => e.stopPropagation()}>
            <div className="cal-detail-head">
              <div className="cal-detail-head-icon" style={{ background: `linear-gradient(135deg, ${TYPE_COLOR[selected.type] || '#64748b'}, ${TYPE_COLOR[selected.type] || '#94a3b8'})` }}>
                <CalendarDays size={18} />
              </div>
              <div className="cal-detail-head-text">
                <span className={`ev-tag ev-tag-${selected.type}`}>{categoryLabel(selected.type)}</span>
                <h2>{selected.title}</h2>
              </div>
              <button className="cal-modal-close" onClick={() => setSelected(null)}><X size={14}/></button>
            </div>
            <div className="cal-detail-body">
              <div className="detail-row">
                <Calendar size={14} className="detail-icon" />
                <div>
                  <div className="detail-label">Date</div>
                  <div className="detail-value">{fmtDateLong(selected.dt.split(' ')[0])}</div>
                </div>
              </div>
              <div className="detail-row">
                <Clock size={14} className="detail-icon" />
                <div>
                  <div className="detail-label">Heure</div>
                  <div className="detail-value">{fmtTime(selected.dt)}</div>
                </div>
              </div>
              <div className="detail-row">
                <User size={14} className="detail-icon" />
                <div>
                  <div className="detail-label">Client / Dossier</div>
                  <div className="detail-value">{selected.client}</div>
                </div>
              </div>
              {selected.location && (
                <div className="detail-row">
                  <MapPin size={14} className="detail-icon" />
                  <div>
                    <div className="detail-label">Lieu</div>
                    <div className="detail-value">{selected.location}</div>
                  </div>
                </div>
              )}
              <div className="detail-row">
                <Tag size={14} className="detail-icon" />
                <div>
                  <div className="detail-label">Statut</div>
                  <div className="detail-value">{selected.status}</div>
                </div>
              </div>
            </div>
            <div className="cal-detail-foot">
              {selected.type === 'appointment' && (
                <button className="cal-btn-delete" onClick={() => handleDelete(selected)}>
                  <Trash2 size={13}/> Supprimer
                </button>
              )}
              <button className="cal-btn-close-foot" onClick={() => setSelected(null)}>Fermer</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── NEW APPOINTMENT MODAL ── */}
      {showNew && createPortal(
        <div className="cal-scrim" onClick={() => setShowNew(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-head">
              <div className="cal-modal-head-icon"><CalendarDays size={18} /></div>
              <div className="cal-modal-head-text">
                <h2>Nouveau rendez-vous</h2>
                <p>Planifiez un rendez-vous client</p>
              </div>
              <button className="cal-modal-close" onClick={() => setShowNew(false)}><X size={14}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="cal-modal-body">
                <div className="cal-field">
                  <label>Client <span className="cal-req">*</span></label>
                  <select required value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => <option key={c.idu} value={c.idu}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
                <div className="cal-row2">
                  <div className="cal-field">
                    <label>Date <span className="cal-req">*</span></label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={e => setForm({...form, date: e.target.value})}
                    />
                  </div>
                  <div className="cal-field">
                    <label>Heure <span className="cal-req">*</span></label>
                    <select value={form.heure} onChange={e => setForm({...form, heure: e.target.value})}>
                      {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                        '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
                        '16:00','16:30','17:00','17:30','18:00'].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="cal-field">
                  <label>Motif</label>
                  <input
                    type="text"
                    placeholder="Ex: Consultation, Suivi dossier…"
                    value={form.reason}
                    onChange={e => setForm({...form, reason: e.target.value})}
                  />
                </div>
              </div>
              <div className="cal-modal-ft">
                <button type="button" className="cal-btn-cancel" onClick={() => setShowNew(false)}>Annuler</button>
                <button type="submit" className="cal-btn-save" disabled={saving}>
                  {saving ? 'Enregistrement…' : <><Check size={13}/> Créer le rendez-vous</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
