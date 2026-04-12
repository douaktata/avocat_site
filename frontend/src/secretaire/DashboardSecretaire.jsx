import { useState, useEffect } from 'react';
import { Calendar, Phone, Users, AlertCircle, PhoneCall } from 'lucide-react';
import { getTodayAppointments, getPhoneCalls, getTasks, getUsersByRole } from '../api';
import { useAuth } from '../AuthContext';
import './DashboardSecretaire.css';

const fmt = (date) =>
  date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDate = (date) =>
  date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtHeure = (str) =>
  str ? new Date(str).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtCallTime = (str) =>
  str ? new Date(str).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

function statusBadge(status) {
  const s = (status || '').toUpperCase();
  if (s === 'CONFIRMED') return { cls: 'badge badge-green', label: 'Confirmé' };
  if (s === 'CANCELLED') return { cls: 'badge badge-red',   label: 'Annulé' };
  return { cls: 'badge badge-amber', label: 'En attente' };
}

function priorityDot(p) {
  if (p === 'HIGH')   return 'high';
  if (p === 'MEDIUM') return 'medium';
  return 'low';
}

export default function DashboardSecretaire() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [rdv, setRdv] = useState([]);
  const [appels, setAppels] = useState([]);
  const [taches, setTaches] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

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
      setTaches(r3.data.slice(0, 6));
      setTotalClients(r4.data.length);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dash-loading">Chargement…</div>;

  const rdvAVenir = rdv.filter(r => new Date(r.appointmentDate) >= now);
  const rdvPasses = rdv.filter(r => new Date(r.appointmentDate) < now);
  const rdvConfirmes = rdvAVenir.filter(r => (r.status || '').toUpperCase() === 'CONFIRMED').length;
  const rdvAttente   = rdvAVenir.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const urgentes     = taches.filter(t => t.priority === 'HIGH').length;

  const clientName = (r) =>
    r.user ? `${r.user.prenom || ''} ${r.user.nom || ''}`.trim() : (r.clientName || '—');

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1>Bonjour, {user?.prenom || 'Secrétaire'} 👋</h1>
          <p>Voici votre activité du jour</p>
        </div>
        <div className="dash-datetime">
          <span className="dash-time">{fmt(now)}</span>
          <span className="dash-date">{fmtDate(now)}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><Calendar size={18} /></div>
          <div className="kpi-body">
            <div className="kpi-value">
              {rdvAVenir.length}<span style={{fontSize:'1rem',fontWeight:500,color:'#94a3b8'}}> / {rdv.length}</span>
            </div>
            <div className="kpi-label">RDV restants aujourd'hui</div>
            <div className="kpi-sub">
              <span className="ok">{rdvConfirmes} confirmés</span>
              <span className="warn">{rdvAttente} en attente</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green"><Phone size={18} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{appels.length}</div>
            <div className="kpi-label">Appels récents</div>
            <div className="kpi-sub"><span className="muted">Enregistrés</span></div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon amber"><Users size={18} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{totalClients}</div>
            <div className="kpi-label">Clients au cabinet</div>
            <div className="kpi-sub"><span className="muted">Total</span></div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red"><AlertCircle size={18} /></div>
          <div className="kpi-body">
            <div className="kpi-value">
              {urgentes}<span style={{fontSize:'1rem',fontWeight:500,color:'#94a3b8'}}> / {taches.length}</span>
            </div>
            <div className="kpi-label">Tâches urgentes</div>
            <div className="kpi-sub"><span className="muted">À traiter en priorité</span></div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="dash-body">
        {/* Left column */}
        <div>
          {/* Timeline RDV */}
          <div className="d-card">
            <div className="d-card-head">
              <h3><Calendar size={15} /> Rendez-vous du jour</h3>
              <span className="d-card-count">{rdv.length} total</span>
            </div>
            <div className="d-card-body">
              {rdv.length === 0 ? (
                <div className="empty-state">Aucun rendez-vous aujourd'hui</div>
              ) : (
                <div className="timeline">
                  {rdvAVenir.map((r, i) => {
                    const { cls, label } = statusBadge(r.status);
                    return (
                      <div key={r.ida} className="tl-item">
                        <div className="tl-time">{fmtHeure(r.appointmentDate)}</div>
                        <div className="tl-track">
                          <div className="tl-dot" />
                          {i < rdvAVenir.length - 1 || rdvPasses.length > 0 ? <div className="tl-line" /> : null}
                        </div>
                        <div className="tl-content">
                          <div className="tl-row">
                            <span className="tl-name">{clientName(r)}</span>
                            <span className={cls}>{label}</span>
                          </div>
                          <p className="tl-reason">{r.reason || '—'}</p>
                        </div>
                      </div>
                    );
                  })}

                  {rdvPasses.length > 0 && (
                    <>
                      <div className="tl-sep">Passés ({rdvPasses.length})</div>
                      {rdvPasses.map(r => (
                        <div key={r.ida} className="tl-item">
                          <div className="tl-time" style={{color:'#cbd5e1'}}>{fmtHeure(r.appointmentDate)}</div>
                          <div className="tl-track">
                            <div className="tl-dot past" />
                          </div>
                          <div className="tl-content">
                            <div className="tl-row">
                              <span className="tl-name past">{clientName(r)}</span>
                              <span className="badge badge-slate">Passé</span>
                            </div>
                            <p className="tl-reason">{r.reason || '—'}</p>
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
          <div className="d-card">
            <div className="d-card-head">
              <h3><Phone size={15} /> Appels récents</h3>
              <span className="d-card-count">{appels.length}</span>
            </div>
            <div className="d-card-body">
              {appels.length === 0 ? (
                <div className="empty-state">Aucun appel enregistré</div>
              ) : (
                <div className="call-list">
                  {appels.map(a => (
                    <div key={a.id} className="call-row">
                      <div className="call-avatar"><PhoneCall size={15} /></div>
                      <div className="call-info">
                        <p className="call-name">{a.caller_full_name || '—'}</p>
                        <p className="call-reason">{a.call_reason || '—'}</p>
                      </div>
                      <span className="call-time">{fmtCallTime(a.call_date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="d-card">
            <div className="d-card-head">
              <h3><AlertCircle size={15} /> Tâches récentes</h3>
              <span className="d-card-count">{taches.length}</span>
            </div>
            <div className="d-card-body">
              {taches.length === 0 ? (
                <div className="empty-state">Aucune tâche</div>
              ) : (
                <div className="task-list">
                  {taches.map(t => (
                    <div key={t.id} className={`task-row${t.status === 'COMPLETED' ? ' done' : ''}`}>
                      <input type="checkbox" checked={t.status === 'COMPLETED'} readOnly />
                      <span className="task-title">{t.title}</span>
                      <span className={`priority-dot ${priorityDot(t.priority)}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
