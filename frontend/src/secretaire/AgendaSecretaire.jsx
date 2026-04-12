import { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays, Plus, Clock, Trash2, ToggleLeft, ToggleRight,
  CalendarCheck, CalendarX, X, Eye, Check,
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

/* ════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════ */
export default function AgendaSecretaire() {
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  /* load all slots (secretaire sees all) */
  useEffect(() => {
    API.get('/slots')
      .then(r => setSlots(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* group by date */
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

  /* stats */
  const stats = useMemo(() => ({
    total:   slots.length,
    actifs:  slots.filter(s => s.actif).length,
    plages:  slots.filter(s => s.actif).reduce((n, s) => n + generateSlots(s.heureDebut || '00:00', s.heureFin || '00:00', s.dureeConsultation || 30).length, 0),
    jours:   byDate.length,
  }), [slots, byDate]);

  /* preview in modal */
  const preview = useMemo(() => {
    if (!form.heureDebut || !form.heureFin || !form.dureeConsultation) return [];
    return generateSlots(form.heureDebut, form.heureFin, form.dureeConsultation);
  }, [form.heureDebut, form.heureFin, form.dureeConsultation]);

  /* toggle actif */
  const handleToggle = async slot => {
    const updated = { ...slot, actif: !slot.actif };
    try {
      await API.put(`/slots/${slot.id}`, updated);
      setSlots(prev => prev.map(s => s.id === slot.id ? updated : s));
    } catch { alert('Erreur lors de la mise à jour'); }
  };

  /* delete */
  const handleDelete = async id => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    try {
      await API.delete(`/slots/${id}`);
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch { alert('Erreur lors de la suppression'); }
  };

  /* create */
  const handleSubmit = async e => {
    e.preventDefault();
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

  /* ── render ───────────────────────────────────── */
  return (
    <div className="ag">

      {/* Header */}
      <div className="ag-header">
        <div>
          <h1 className="ag-title">Gestion des Créneaux</h1>
          <p className="ag-sub">Configurez les disponibilités pour les rendez-vous du cabinet</p>
        </div>
        <button className="ag-btn-new" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nouveau créneau
        </button>
      </div>

      {/* KPI strip */}
      <div className="ag-kpis">
        <div className="ag-kpi ag-kpi-blue">
          <div className="ag-kpi-ic"><CalendarDays size={18} /></div>
          <div><div className="ag-kpi-n">{stats.total}</div><div className="ag-kpi-l">Créneaux configurés</div></div>
        </div>
        <div className="ag-kpi ag-kpi-green">
          <div className="ag-kpi-ic"><CalendarCheck size={18} /></div>
          <div><div className="ag-kpi-n">{stats.actifs}</div><div className="ag-kpi-l">Créneaux actifs</div></div>
        </div>
        <div className="ag-kpi ag-kpi-amber">
          <div className="ag-kpi-ic"><Clock size={18} /></div>
          <div><div className="ag-kpi-n">{stats.plages}</div><div className="ag-kpi-l">Plages réservables</div></div>
        </div>
        <div className="ag-kpi ag-kpi-violet">
          <div className="ag-kpi-ic"><CalendarDays size={18} /></div>
          <div><div className="ag-kpi-n">{stats.jours}</div><div className="ag-kpi-l">Jours couverts</div></div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="ag-loading">Chargement…</div>
      ) : byDate.length === 0 ? (
        <div className="ag-empty">
          <CalendarX size={40} className="ag-empty-ic" />
          <h3>Aucun créneau configuré</h3>
          <p>Cliquez sur « Nouveau créneau » pour commencer.</p>
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
                  {list.reduce((n, s) => n + generateSlots(s.heureDebut || '00:00', s.heureFin || '00:00', s.dureeConsultation || 30).length, 0)} plages
                </span>
              </div>

              <div className="ag-cards">
                {list.map(slot => {
                  const plages = generateSlots(slot.heureDebut || '00:00', slot.heureFin || '00:00', slot.dureeConsultation || 30);
                  return (
                    <div key={slot.id} className={`ag-card${slot.actif ? '' : ' ag-card-off'}`}>
                      <div className="ag-card-top">
                        <div className="ag-card-time">
                          <Clock size={14} />
                          <strong>{slot.heureDebut} – {slot.heureFin}</strong>
                          <span className="ag-card-dur">{slot.dureeConsultation} min / RDV</span>
                        </div>
                        <div className="ag-card-actions">
                          <button
                            className={`ag-toggle${slot.actif ? ' on' : ''}`}
                            onClick={() => handleToggle(slot)}
                            title={slot.actif ? 'Désactiver' : 'Activer'}
                          >
                            {slot.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button className="ag-del" onClick={() => handleDelete(slot.id)} title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="ag-chips">
                        {plages.length === 0
                          ? <span className="ag-chip-none">Aucune plage générée</span>
                          : plages.map((p, i) => (
                              <span key={i} className={`ag-chip${slot.actif ? '' : ' ag-chip-off'}`}>{p}</span>
                            ))
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <>
          <div className="ag-scrim" onClick={() => setShowModal(false)} />
          <div className="ag-modal">
            <div className="ag-modal-head">
              <div>
                <h2>Nouveau créneau</h2>
                <p>Configurez une plage horaire pour les rendez-vous</p>
              </div>
              <button className="ag-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="ag-modal-body">
              <div className="ag-field">
                <label>Date <span className="ag-req">*</span></label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="ag-row2">
                <div className="ag-field">
                  <label>Heure de début <span className="ag-req">*</span></label>
                  <input type="time" required value={form.heureDebut}
                    onChange={e => setForm(f => ({ ...f, heureDebut: e.target.value }))} />
                </div>
                <div className="ag-field">
                  <label>Heure de fin <span className="ag-req">*</span></label>
                  <input type="time" required value={form.heureFin}
                    onChange={e => setForm(f => ({ ...f, heureFin: e.target.value }))} />
                </div>
              </div>

              <div className="ag-field">
                <label>Durée par consultation <span className="ag-req">*</span></label>
                <select value={form.dureeConsultation}
                  onChange={e => setForm(f => ({ ...f, dureeConsultation: Number(e.target.value) }))}>
                  {DUREES.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>

              <label className="ag-check">
                <input type="checkbox" checked={form.actif}
                  onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} />
                <span>Activer ce créneau immédiatement</span>
              </label>

              {preview.length > 0 && (
                <div className="ag-preview">
                  <div className="ag-preview-head"><Eye size={13} /> {preview.length} plages générées</div>
                  <div className="ag-preview-chips">
                    {preview.map((p, i) => <span key={i} className="ag-chip">{p}</span>)}
                  </div>
                </div>
              )}

              <div className="ag-modal-ft">
                <button type="button" className="ag-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="ag-btn-save" disabled={saving}>
                  {saving ? 'Enregistrement…' : <><Check size={14} /> Créer le créneau</>}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
