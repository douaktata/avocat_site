import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Phone, Users, AlertCircle, PhoneCall,
  CheckCircle2, Clock, Plus, UserPlus, PhoneIncoming,
  ClipboardList, ArrowRight, BarChart2, Sparkles
} from 'lucide-react';
import { getTodayAppointments, getPhoneCalls, getTasks, getUsersByRole } from '../api';
import { useAuth } from '../AuthContext';
import './DashboardSecretaire.css';

const fmt     = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDay  = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtH    = (s) => s ? new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtCall = (s) => s ? new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

const apptBadge = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'CONFIRMED') return { cls: 'b-green', lbl: 'Confirmé'   };
  if (s === 'CANCELLED') return { cls: 'b-red',   lbl: 'Annulé'     };
  return                        { cls: 'b-amber',  lbl: 'En attente' };
};

export default function DashboardSecretaire() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [now, setNow]                   = useState(new Date());
  const [rdv, setRdv]                   = useState([]);
  const [appels, setAppels]             = useState([]);
  const [taches, setTaches]             = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      getTodayAppointments(),
      getPhoneCalls(),
      getTasks(),
      getUsersByRole('CLIENT'),
    ]).then(([r1, r2, r3, r4]) => {
      setRdv(r1.data.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)));
      setAppels(r2.data.slice(0, 5));
      setTaches(r3.data.slice(0, 7));
      setTotalClients(r4.data.length);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="ds-loading">
      <div className="ds-spinner" />
      <span>Chargement du tableau de bord…</span>
    </div>
  );

  const rdvAVenir = rdv.filter(r => new Date(r.appointmentDate) >= now);
  const rdvPasses = rdv.filter(r => new Date(r.appointmentDate) <  now);
  const confirmed = rdvAVenir.filter(r => (r.status||'').toUpperCase() === 'CONFIRMED').length;
  const pending   = rdvAVenir.filter(r => (r.status||'').toUpperCase() === 'PENDING').length;
  const urgent    = taches.filter(t => t.priority === 'HIGH').length;
  const done      = taches.filter(t => t.status === 'COMPLETED').length;
  const pct       = taches.length ? Math.round((done / taches.length) * 100) : 0;
  const clientName = (r) => r.user
    ? `${r.user.prenom || ''} ${r.user.nom || ''}`.trim()
    : (r.clientName || '—');

  const quickActions = [
    { label: 'Nouveau RDV',       Icon: Plus,          color: 'blue',   path: '/secretaire/agenda'  },
    { label: 'Nouveau client',    Icon: UserPlus,       color: 'green',  path: '/secretaire/clients' },
    { label: 'Enregistrer appel', Icon: PhoneIncoming,  color: 'violet', path: '/secretaire/appels'  },
    { label: 'Nouvelle tâche',    Icon: ClipboardList,  color: 'amber',  path: '/secretaire/taches'  },
  ];

  return (
    <div className="ds">

      {/* ══ HEADER ══ */}
      <div className="ds-header">
        <div className="ds-header-blob" />
        <div className="ds-header-left">
          <div className="ds-eyebrow"><Sparkles size={11} /> Tableau de bord</div>
          <h1 className="ds-title">Bonjour, <em>{user?.prenom || 'Secrétaire'}</em> 👋</h1>
          <p className="ds-subtitle">{fmtDay(now)}</p>
        </div>
        <div className="ds-clock-wrap">
          <span className="ds-clock">{fmt(now)}</span>
          <span className="ds-clock-label"><Clock size={10} /> Heure locale</span>
        </div>
      </div>

      {/* ══ KPIs ══ */}
      <div className="ds-kpi-row">

        <div className="ds-kpi blue">
          <div className="ds-kpi-icon"><Calendar size={20} /></div>
          <div className="ds-kpi-body">
            <div className="ds-kpi-number">
              {rdvAVenir.length}
              <span className="ds-kpi-sub-num"> / {rdv.length}</span>
            </div>
            <div className="ds-kpi-name">RDV aujourd'hui</div>
            <div className="ds-kpi-chips">
              <span className="chip green">{confirmed} confirmés</span>
              <span className="chip amber">{pending} en attente</span>
            </div>
          </div>
        </div>

        <div className="ds-kpi emerald">
          <div className="ds-kpi-icon"><Phone size={20} /></div>
          <div className="ds-kpi-body">
            <div className="ds-kpi-number">{appels.length}</div>
            <div className="ds-kpi-name">Appels récents</div>
            <div className="ds-kpi-chips">
              <span className="chip green">Enregistrés</span>
            </div>
          </div>
        </div>

        <div className="ds-kpi violet">
          <div className="ds-kpi-icon"><Users size={20} /></div>
          <div className="ds-kpi-body">
            <div className="ds-kpi-number">{totalClients}</div>
            <div className="ds-kpi-name">Clients au cabinet</div>
            <div className="ds-kpi-chips">
              <span className="chip violet">Base totale</span>
            </div>
          </div>
        </div>

        <div className="ds-kpi rose">
          <div className="ds-kpi-icon"><AlertCircle size={20} /></div>
          <div className="ds-kpi-body">
            <div className="ds-kpi-number">
              {urgent}
              <span className="ds-kpi-sub-num"> / {taches.length}</span>
            </div>
            <div className="ds-kpi-name">Tâches urgentes</div>
            <div className="ds-kpi-chips">
              <span className="chip green">{done} complétées</span>
            </div>
          </div>
        </div>

      </div>

      {/* ══ QUICK ACTIONS ══ */}
      <div className="ds-qa-row">
        {quickActions.map(({ label, Icon, color, path }) => (
          <button key={label} className={`ds-qa ds-qa-${color}`} onClick={() => navigate(path)}>
            <div className="ds-qa-ic"><Icon size={16} /></div>
            <span>{label}</span>
            <ArrowRight size={13} className="ds-qa-arr" />
          </button>
        ))}
      </div>

      {/* ══ MAIN LAYOUT ══ */}
      <div className="ds-main">

        {/* LEFT — Timeline + Calls stacked */}
        <div className="ds-left">

          {/* RDV Timeline */}
          <div className="ds-panel">
            <div className="ds-panel-head">
              <div className="ds-panel-ttl"><Calendar size={15} /> Rendez-vous du jour</div>
              <span className="ds-chip">{rdv.length} total</span>
            </div>
            <div className="ds-panel-body">
              {rdv.length === 0 ? (
                <div className="ds-empty">
                  <div className="ds-empty-icon"><Calendar size={28} /></div>
                  <p className="ds-empty-title">Aucun rendez-vous aujourd'hui</p>
                  <p className="ds-empty-sub">Planifiez un rendez-vous depuis l'agenda</p>
                  <button className="ds-empty-btn" onClick={() => navigate('/secretaire/agenda')}>
                    <Plus size={13} /> Créer un RDV
                  </button>
                </div>
              ) : (
                <div className="ds-tl">
                  {rdvAVenir.map((r, i) => {
                    const { cls, lbl } = apptBadge(r.status);
                    return (
                      <div key={r.ida} className="ds-tl-item">
                        <div className="ds-tl-time">{fmtH(r.appointmentDate)}</div>
                        <div className="ds-tl-spine">
                          <div className="ds-tl-dot" />
                          {(i < rdvAVenir.length - 1 || rdvPasses.length > 0) && <div className="ds-tl-rail" />}
                        </div>
                        <div className="ds-tl-card">
                          <div className="ds-tl-top">
                            <span className="ds-tl-client">{clientName(r)}</span>
                            <span className={`ds-b ${cls}`}>{lbl}</span>
                          </div>
                          <p className="ds-tl-reason">{r.reason || '—'}</p>
                        </div>
                      </div>
                    );
                  })}
                  {rdvPasses.length > 0 && (
                    <>
                      <div className="ds-tl-sep">Passés · {rdvPasses.length}</div>
                      {rdvPasses.map(r => (
                        <div key={r.ida} className="ds-tl-item past">
                          <div className="ds-tl-time">{fmtH(r.appointmentDate)}</div>
                          <div className="ds-tl-spine">
                            <div className="ds-tl-dot past" />
                          </div>
                          <div className="ds-tl-card past">
                            <div className="ds-tl-top">
                              <span className="ds-tl-client">{clientName(r)}</span>
                              <span className="ds-b b-slate">Passé</span>
                            </div>
                            <p className="ds-tl-reason">{r.reason || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calls */}
          <div className="ds-panel">
            <div className="ds-panel-head">
              <div className="ds-panel-ttl"><Phone size={15} /> Appels récents</div>
              <span className="ds-chip">{appels.length}</span>
            </div>
            <div className="ds-panel-body">
              {appels.length === 0 ? (
                <div className="ds-empty">
                  <div className="ds-empty-icon"><Phone size={24} /></div>
                  <p className="ds-empty-title">Aucun appel enregistré</p>
                </div>
              ) : (
                <ul className="ds-calls">
                  {appels.map(a => (
                    <li key={a.id} className="ds-call">
                      <div className="ds-call-av"><PhoneCall size={14} /></div>
                      <div className="ds-call-info">
                        <p className="ds-call-name">{a.caller_full_name || '—'}</p>
                        <p className="ds-call-reason">{a.call_reason || '—'}</p>
                      </div>
                      <span className="ds-call-time">{fmtCall(a.call_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT — Tasks + Summary */}
        <div className="ds-right">

          {/* Tasks */}
          <div className="ds-panel">
            <div className="ds-panel-head">
              <div className="ds-panel-ttl"><ClipboardList size={15} /> Tâches</div>
              <span className="ds-chip">{taches.length}</span>
            </div>
            {taches.length > 0 && (
              <div className="ds-prog">
                <div className="ds-prog-bar"><div className="ds-prog-fill" style={{ width: `${pct}%` }} /></div>
                <span>{pct}% · {done}/{taches.length} complétées</span>
              </div>
            )}
            <div className="ds-panel-body">
              {taches.length === 0 ? (
                <div className="ds-empty">
                  <div className="ds-empty-icon"><CheckCircle2 size={26} /></div>
                  <p className="ds-empty-title">Aucune tâche</p>
                  <button className="ds-empty-btn" onClick={() => navigate('/secretaire/taches')}>
                    <Plus size={13} /> Ajouter une tâche
                  </button>
                </div>
              ) : (
                <ul className="ds-tasks">
                  {taches.map(t => {
                    const p = t.priority === 'HIGH' ? 'high' : t.priority === 'MEDIUM' ? 'med' : 'low';
                    const isDone = t.status === 'COMPLETED';
                    return (
                      <li key={t.id} className={`ds-task ${isDone ? 'done' : ''}`}>
                        <span className={`ds-task-bar ${p}`} />
                        <input type="checkbox" checked={isDone} readOnly />
                        <span className="ds-task-text">{t.title}</span>
                        <span className={`ds-prio ${p}`}>
                          {p === 'high' ? 'Urgent' : p === 'med' ? 'Moyen' : 'Faible'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="ds-panel">
            <div className="ds-panel-head">
              <div className="ds-panel-ttl"><BarChart2 size={15} /> Résumé du jour</div>
            </div>
            <div className="ds-panel-body ds-summary">
              {[
                { dot: 'blue',   label: 'RDV confirmés',     val: confirmed,        valColor: 'blue'   },
                { dot: 'amber',  label: 'RDV en attente',    val: pending,          valColor: 'amber'  },
                { dot: 'slate',  label: 'RDV passés',        val: rdvPasses.length, valColor: 'slate'  },
                { dot: 'sep' },
                { dot: 'red',    label: 'Tâches urgentes',   val: urgent,           valColor: 'red'    },
                { dot: 'green',  label: 'Tâches complétées', val: done,             valColor: 'green'  },
                { dot: 'violet', label: 'Total clients',     val: totalClients,     valColor: 'violet' },
              ].map((row, i) =>
                row.dot === 'sep'
                  ? <div key={i} className="ds-sum-sep" />
                  : (
                    <div key={i} className="ds-sum-row">
                      <span className={`ds-sum-dot ${row.dot}`} />
                      <span className="ds-sum-label">{row.label}</span>
                      <span className={`ds-sum-val ${row.valColor}`}>{row.val}</span>
                    </div>
                  )
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
