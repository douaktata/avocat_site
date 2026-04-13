import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays, Plus, Clock, Trash2, ToggleLeft, ToggleRight,
  CalendarCheck, CalendarX, X, Eye, Check, Sparkles,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
} from 'lucide-react';
import API from '../api';
import './AgendaSecretaire.css';

/* ── helpers ─────────────────────────────────────── */
const pad = n => String(n).padStart(2, '0');

function generateSlots(debut, fin, duree) {
  const slots = [];
  let [h, m] = debut.split(':').map(Number);
  const [fh, fm] = fin.split(':').map(Number);
  const finMin = fh * 60 + fm;
  while (true) {
    const startMin = h * 60 + m;
    const endMin = startMin + duree;
    if (endMin > finMin) break;
    const eh = Math.floor(endMin / 60), em = endMin % 60;
    slots.push(`${pad(h)}:${pad(m)} – ${pad(eh)}:${pad(em)}`);
    h = eh; m = em;
  }
  return slots;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0];
}

const DUREES = [15, 30, 45, 60, 90, 120];
const EMPTY_FORM = { date: '', heureDebut: '09:00', heureFin: '17:00', dureeConsultation: 30, actif: true };
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['LU','MA','ME','JE','VE','SA','DI'];

/* ── Custom Calendar ─────────────────────────────── */
function DatePicker({ value, onChange, minDate }) {
  const today = new Date();
  const parsed = value ? new Date(value + 'T12:00:00') : null;

  const [vy, setVy] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [vm, setVm] = useState(parsed ? parsed.getMonth()    : today.getMonth());

  const prevMonth = () => { if (vm === 0) { setVm(11); setVy(y => y-1); } else setVm(m => m-1); };
  const nextMonth = () => { if (vm === 11) { setVm(0); setVy(y => y+1); } else setVm(m => m+1); };

  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const firstDow    = new Date(vy, vm, 1).getDay();              // 0=Sun
  const offset      = firstDow === 0 ? 6 : firstDow - 1;        // Mon-based

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isoOf = d => `${vy}-${pad(vm+1)}-${pad(d)}`;

  const isDisabled = d => {
    if (!minDate) return false;
    return isoOf(d) < minDate;
  };
  const isSelected = d => value && isoOf(d) === value;
  const isTodayDay = d => d === today.getDate() && vm === today.getMonth() && vy === today.getFullYear();

  return (
    <div className="ag-cal">
      <div className="ag-cal-nav">
        <button type="button" className="ag-cal-arr" onClick={prevMonth}><ChevronLeft size={14}/></button>
        <div className="ag-cal-nav-label">
          <span className="ag-cal-month">{MONTHS_FR[vm]}</span>
          <span className="ag-cal-year">{vy}</span>
        </div>
        <button type="button" className="ag-cal-arr" onClick={nextMonth}><ChevronRight size={14}/></button>
      </div>

      <div className="ag-cal-grid">
        {DAYS_FR.map(d => <div key={d} className="ag-cal-dh">{d}</div>)}
        {cells.map((day, i) =>
          day === null
            ? <div key={`e${i}`} className="ag-cal-day ag-cal-empty" />
            : (
              <div
                key={day}
                className={[
                  'ag-cal-day',
                  isSelected(day)  ? 'sel'  : '',
                  isTodayDay(day) && !isSelected(day) ? 'today' : '',
                  isDisabled(day)  ? 'dis'  : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !isDisabled(day) && onChange(isoOf(day))}
              >
                {day}
              </div>
            )
        )}
      </div>

      {value && (
        <div className="ag-cal-selected-label">
          <CalendarCheck size={12} />
          {new Date(value + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </div>
      )}
    </div>
  );
}

/* ── Time Picker ─────────────────────────────────── */
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'];

function TimePicker({ value, onChange }) {
  const [hh, mm] = value ? value.split(':') : ['09', '00'];
  const h = parseInt(hh, 10);
  const mIdx = MINUTES.indexOf(mm);

  const changeH = d => onChange(`${pad((h + d + 24) % 24)}:${mm}`);
  const changeM = d => onChange(`${hh}:${MINUTES[(mIdx + d + MINUTES.length) % MINUTES.length]}`);

  return (
    <div className="ag-tp">
      <div className="ag-tp-col">
        <button type="button" className="ag-tp-arr" onClick={() => changeH(1)}><ChevronUp size={12}/></button>
        <div className="ag-tp-num">{hh}</div>
        <button type="button" className="ag-tp-arr" onClick={() => changeH(-1)}><ChevronDown size={12}/></button>
      </div>
      <span className="ag-tp-colon">:</span>
      <div className="ag-tp-col">
        <button type="button" className="ag-tp-arr" onClick={() => changeM(1)}><ChevronUp size={12}/></button>
        <div className="ag-tp-num">{mm}</div>
        <button type="button" className="ag-tp-arr" onClick={() => changeM(-1)}><ChevronDown size={12}/></button>
      </div>
    </div>
  );
}

/* ── Duration Picker ─────────────────────────────── */
const DUREE_LABELS = { 15:'15 min', 30:'30 min', 45:'45 min', 60:'1 h', 90:'1 h 30', 120:'2 h' };

function DurationPicker({ value, onChange }) {
  return (
    <div className="ag-dur">
      {DUREES.map(d => (
        <button
          key={d} type="button"
          className={`ag-dur-btn${value === d ? ' sel' : ''}`}
          onClick={() => onChange(d)}
        >
          {DUREE_LABELS[d]}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════ */
export default function AgendaSecretaire() {
  const [slots,     setSlots]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    API.get('/slots')
      .then(r => setSlots(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byDate = useMemo(() => {
    const map = {};
    slots.forEach(s => {
      const key = s.date || '';
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({ date, label: formatDateLabel(date), today: isToday(date), list }));
  }, [slots]);

  const stats = useMemo(() => ({
    total:  slots.length,
    actifs: slots.filter(s => s.actif).length,
    plages: slots.filter(s => s.actif).reduce((n, s) => n + generateSlots(s.heureDebut || '00:00', s.heureFin || '00:00', s.dureeConsultation || 30).length, 0),
    jours:  byDate.length,
  }), [slots, byDate]);

  const preview = useMemo(() => {
    if (!form.heureDebut || !form.heureFin || !form.dureeConsultation) return [];
    return generateSlots(form.heureDebut, form.heureFin, form.dureeConsultation);
  }, [form.heureDebut, form.heureFin, form.dureeConsultation]);

  const handleToggle = async slot => {
    const updated = { ...slot, actif: !slot.actif };
    try {
      await API.put(`/slots/${slot.id}`, updated);
      setSlots(prev => prev.map(s => s.id === slot.id ? updated : s));
    } catch { alert('Erreur lors de la mise à jour'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    try {
      await API.delete(`/slots/${id}`);
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch { alert('Erreur lors de la suppression'); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.date) { alert('Veuillez sélectionner une date'); return; }
    setSaving(true);
    try {
      const res = await API.post('/slots', {
        date: form.date,
        heureDebut: form.heureDebut,
        heureFin: form.heureFin,
        dureeConsultation: Number(form.dureeConsultation),
        actif: form.actif,
      });
      setSlots(prev => [...prev, res.data]);
      setForm(EMPTY_FORM);
      setShowModal(false);
    } catch { alert('Erreur lors de la création'); }
    finally { setSaving(false); }
  };

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="ag">

      {/* ── HEADER BANNER ── */}
      <div className="ag-header">
        <div className="ag-header-blob" />
        <div className="ag-header-top">
          <div className="ag-eyebrow"><Sparkles size={11} /> Gestion des créneaux</div>
          <h1 className="ag-title">Créneaux <em>horaires</em></h1>
          <p className="ag-subtitle">Configurez les disponibilités pour les rendez-vous du cabinet</p>
        </div>
        <button className="ag-btn-new" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Nouveau créneau
        </button>
        <div className="ag-header-divider" />
        <div className="ag-header-stats">
          <div className="ag-hstat">
            <span className="ag-hstat-number">{stats.total}</span>
            <span className="ag-hstat-label">Créneaux total</span>
          </div>
          <div className="ag-hstat-sep" />
          <div className="ag-hstat">
            <span className="ag-hstat-number ag-hstat-green">{stats.actifs}</span>
            <span className="ag-hstat-label">Actifs</span>
          </div>
          <div className="ag-hstat-sep" />
          <div className="ag-hstat">
            <span className="ag-hstat-number ag-hstat-blue">{stats.plages}</span>
            <span className="ag-hstat-label">Plages réservables</span>
          </div>
          <div className="ag-hstat-sep" />
          <div className="ag-hstat">
            <span className="ag-hstat-number ag-hstat-amber">{stats.jours}</span>
            <span className="ag-hstat-label">Jours couverts</span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="ag-loading"><div className="ag-spinner"/><span>Chargement des créneaux…</span></div>
      ) : byDate.length === 0 ? (
        <div className="ag-empty">
          <div className="ag-empty-icon"><CalendarX size={30} /></div>
          <p className="ag-empty-title">Aucun créneau configuré</p>
          <p className="ag-empty-sub">Cliquez sur « Nouveau créneau » pour commencer.</p>
        </div>
      ) : (
        <div className="ag-list">
          {byDate.map(({ date, label, today, list }) => (
            <div key={date} className={`ag-group${today ? ' ag-today' : ''}`}>
              <div className="ag-group-head">
                <div className="ag-group-left">
                  {today && <span className="ag-today-pill">Aujourd'hui</span>}
                  <span className="ag-group-date">{label}</span>
                </div>
                <span className="ag-group-count">
                  {list.reduce((n, s) => n + generateSlots(s.heureDebut||'00:00', s.heureFin||'00:00', s.dureeConsultation||30).length, 0)} plages
                </span>
              </div>
              <div className="ag-cards">
                {list.map(slot => {
                  const plages = generateSlots(slot.heureDebut||'00:00', slot.heureFin||'00:00', slot.dureeConsultation||30);
                  return (
                    <div key={slot.id} className={`ag-card${slot.actif ? '' : ' ag-card-off'}`}>
                      <div className="ag-card-top">
                        <div className="ag-card-time">
                          <Clock size={14} />
                          <strong>{slot.heureDebut} – {slot.heureFin}</strong>
                          <span className="ag-card-dur">{slot.dureeConsultation} min / RDV</span>
                          {slot.actif
                            ? <span className="ag-badge-on"><CalendarCheck size={10}/> Actif</span>
                            : <span className="ag-badge-off">Inactif</span>}
                        </div>
                        <div className="ag-card-actions">
                          <button className={`ag-toggle${slot.actif?' on':''}`} onClick={() => handleToggle(slot)}>
                            {slot.actif ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>}
                          </button>
                          <button className="ag-del" onClick={() => handleDelete(slot.id)}><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="ag-chips">
                        {plages.length === 0
                          ? <span className="ag-chip-none">Aucune plage générée</span>
                          : plages.map((p,i) => <span key={i} className={`ag-chip${slot.actif?'':' ag-chip-off'}`}>{p}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && createPortal(
        <div className="ag-scrim" onClick={() => setShowModal(false)}>
          <div className="ag-modal" onClick={e => e.stopPropagation()}>

            <div className="ag-modal-head">
              <div className="ag-modal-head-icon"><CalendarDays size={18} /></div>
              <div className="ag-modal-head-text">
                <h2>Nouveau créneau</h2>
                <p>Configurez une plage horaire pour les rendez-vous</p>
              </div>
              <button className="ag-modal-close" onClick={() => setShowModal(false)}><X size={14}/></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ag-modal-body">
                <div className="ag-modal-cols">

                  {/* ── Left: calendar ── */}
                  <div className="ag-modal-left">
                    <p className="ag-sec">Date</p>
                    <DatePicker
                      value={form.date}
                      onChange={date => setForm(f => ({ ...f, date }))}
                      minDate={todayISO}
                    />
                  </div>

                  {/* ── Right: time + duration + toggle ── */}
                  <div className="ag-modal-right">
                    <div className="ag-field-group">
                      <p className="ag-sec">Heure de début</p>
                      <TimePicker
                        value={form.heureDebut}
                        onChange={v => setForm(f => ({ ...f, heureDebut: v }))}
                      />
                    </div>

                    <div className="ag-field-group">
                      <p className="ag-sec">Heure de fin</p>
                      <TimePicker
                        value={form.heureFin}
                        onChange={v => setForm(f => ({ ...f, heureFin: v }))}
                      />
                    </div>

                    <div className="ag-field-group">
                      <p className="ag-sec">Durée / RDV</p>
                      <DurationPicker
                        value={form.dureeConsultation}
                        onChange={v => setForm(f => ({ ...f, dureeConsultation: v }))}
                      />
                    </div>

                    <label className="ag-check">
                      <input type="checkbox" checked={form.actif}
                        onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} />
                      <span className="ag-check-box" />
                      <span className="ag-check-label">Activer immédiatement</span>
                    </label>
                  </div>
                </div>

                {preview.length > 0 && (
                  <div className="ag-preview">
                    <div className="ag-preview-head"><Eye size={13}/> {preview.length} plages générées</div>
                    <div className="ag-preview-chips">
                      {preview.map((p,i) => <span key={i} className="ag-chip">{p}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="ag-modal-ft">
                <button type="button" className="ag-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="ag-btn-save" disabled={saving}>
                  {saving ? 'Enregistrement…' : <><Check size={14}/> Créer le créneau</>}
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
