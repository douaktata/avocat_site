import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, CreditCard, Calendar,
  FolderOpen, CalendarCheck, Info, Hash, Eye, ArrowRight,
  UserX, Sparkles, Scale, Briefcase, Gavel, Users, Home,
  HardHat, Heart, ScrollText, Folder, Gavel as GavelIcon,
  Building2, User as UserIcon,
} from 'lucide-react';
import { getUser, getCasesByClient, getAppointmentsByUser, getAudiencesByCase } from '../api';
import './clientdetails.css';

const API_BASE = 'http://localhost:8081';

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const fmtDateTime = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

const TYPE_META = {
  Civil:      { Icon: Scale,       color: '#0ea5e9' },
  Commercial: { Icon: Briefcase,   color: '#3b82f6' },
  Pénal:      { Icon: Gavel,       color: '#ef4444' },
  Famille:    { Icon: Users,       color: '#06b6d4' },
  Immobilier: { Icon: Home,        color: '#10b981' },
  Travail:    { Icon: HardHat,     color: '#f59e0b' },
  Divorce:    { Icon: Heart,       color: '#ec4899' },
  Succession: { Icon: ScrollText,  color: '#8b5cf6' },
};
const defaultTypeMeta = { Icon: Folder, color: '#64748b' };

const STATUS_CASE = {
  OPEN:    { label: 'En cours',   cls: 'cd-badge-open'    },
  PENDING: { label: 'En attente', cls: 'cd-badge-pending' },
  CLOSED:  { label: 'Clôturé',   cls: 'cd-badge-closed'  },
};

const STATUS_APT = {
  CONFIRMED: { label: 'Confirmé',   cls: 'cd-badge-confirmed'    },
  PENDING:   { label: 'En attente', cls: 'cd-badge-apt-pending'  },
  CANCELLED: { label: 'Annulé',     cls: 'cd-badge-cancelled'    },
  COMPLETED: { label: 'Effectué',   cls: 'cd-badge-done'         },
};

const STATUS_AUD = {
  SCHEDULED: { label: 'Planifiée',  cls: 'cd-badge-open'      },
  COMPLETED: { label: 'Tenue',      cls: 'cd-badge-confirmed' },
  POSTPONED: { label: 'Renvoyée',   cls: 'cd-badge-pending'   },
  CANCELLED: { label: 'Annulée',    cls: 'cd-badge-cancelled' },
};

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client,       setClient]       = useState(null);
  const [dossiers,     setDossiers]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [audiences,    setAudiences]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('dossiers');

  useEffect(() => {
    Promise.all([
      getUser(id),
      getCasesByClient(id).catch(() => ({ data: [] })),
      getAppointmentsByUser(id).catch(() => ({ data: [] })),
    ])
      .then(([userRes, casesRes, aptsRes]) => {
        setClient(userRes.data);
        const cases = casesRes.data || [];
        setDossiers(cases);
        setAppointments((aptsRes.data || []).filter(a => a.status !== 'CANCELLED'));
        // fetch audiences for all cases in parallel
        if (cases.length > 0) {
          Promise.all(cases.map(c => getAudiencesByCase(c.idc).catch(() => ({ data: [] }))))
            .then(results => {
              const all = results.flatMap(r => r.data || []);
              all.sort((a, b) => new Date(b.hearingDate) - new Date(a.hearingDate));
              setAudiences(all);
            });
        }
      })
      .catch(() => setError('Impossible de charger ce client'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="cd">
      <div className="cd-loading">
        <div className="cd-spinner" />
        <span>Chargement du dossier client…</span>
      </div>
    </div>
  );

  if (error || !client) return (
    <div className="cd">
      <div className="cd-not-found">
        <div className="cd-nf-icon"><UserX size={32} /></div>
        <h2>Client introuvable</h2>
        <p>{error || 'Ce client n\'existe pas.'}</p>
        <button className="cd-nf-btn" onClick={() => navigate('/secretaire/clients')}>
          <ArrowLeft size={14} /> Retour aux clients
        </button>
      </div>
    </div>
  );

  const photoSrc = client.photo_url ? `${API_BASE}${client.photo_url}` : null;
  const initials = `${(client.prenom || '?')[0]}${(client.nom || '?')[0]}`.toUpperCase();
  const fullName = `${client.prenom || ''} ${client.nom || ''}`.trim();

  const enCours  = dossiers.filter(d => d.status === 'OPEN').length;
  const clotures = dossiers.filter(d => d.status === 'CLOSED').length;

  const tabs = [
    { key: 'dossiers',     label: 'Dossiers',     Icon: FolderOpen,    count: dossiers.length     },
    { key: 'audiences',    label: 'Audiences',     Icon: GavelIcon,     count: audiences.length    },
    { key: 'appointments', label: 'Rendez-vous',   Icon: CalendarCheck, count: appointments.length },
    { key: 'infos',        label: 'Informations',  Icon: Info,          count: null                },
  ];

  return (
    <div className="cd">

      {/* ── BACK ── */}
      <button className="cd-back" onClick={() => navigate('/secretaire/clients')}>
        <ArrowLeft size={14} /> Retour aux clients
      </button>

      {/* ── HEADER BANNER ── */}
      <div className="cd-header">
        <div className="cd-header-blob" />

        <div className="cd-header-top">
          <div className="cd-header-left">
            <div className="cd-eyebrow"><Sparkles size={11} /> Fiche client</div>
            <div className="cd-header-row">
              <div className="cd-avatar">
                {photoSrc
                  ? <img src={photoSrc} alt={fullName} />
                  : initials
                }
              </div>
              <div>
                <h1 className="cd-title">{client.prenom} <em>{client.nom}</em></h1>
                <div className="cd-meta">
                  {client.email   && <span><Mail size={12} />{client.email}</span>}
                  {client.tel     && <span><Phone size={12} />{client.tel}</span>}
                  {client.adresse && <span><MapPin size={12} />{client.adresse}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cd-header-divider" />

        <div className="cd-header-stats">
          <div className="cd-hstat">
            <span className="cd-hstat-number">{dossiers.length}</span>
            <span className="cd-hstat-label">Dossiers total</span>
          </div>
          <div className="cd-hstat-sep" />
          <div className="cd-hstat">
            <span className="cd-hstat-number">{enCours}</span>
            <span className="cd-hstat-label">En cours</span>
          </div>
          <div className="cd-hstat-sep" />
          <div className="cd-hstat">
            <span className="cd-hstat-number">{audiences.length}</span>
            <span className="cd-hstat-label">Audiences</span>
          </div>
          <div className="cd-hstat-sep" />
          <div className="cd-hstat">
            <span className="cd-hstat-number">{appointments.length}</span>
            <span className="cd-hstat-label">Rendez-vous</span>
          </div>
          <div className="cd-hstat-sep" />
          <div className="cd-hstat">
            <span className="cd-hstat-number">{clotures}</span>
            <span className="cd-hstat-label">Clôturés</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="cd-tabs">
        {tabs.map(({ key, label, Icon, count }) => (
          <button
            key={key}
            className={`cd-tab ${activeTab === key ? 'cd-tab-active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={14} />
            {label}
            {count !== null && (
              <span className="cd-tab-count">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── DOSSIERS ── */}
      {activeTab === 'dossiers' && (
        <div className="cd-section">
          {dossiers.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon"><FolderOpen size={28} /></div>
              <p className="cd-empty-title">Aucun dossier pour ce client</p>
              <p className="cd-empty-sub">Les dossiers associés apparaîtront ici</p>
            </div>
          ) : (
            <div className="cd-dossiers-grid">
              {dossiers.map(d => {
                const tm = TYPE_META[d.case_type] || defaultTypeMeta;
                const sc = STATUS_CASE[d.status]  || { label: d.status || '—', cls: '' };
                const { Icon: TypeIcon } = tm;
                return (
                  <div
                    key={d.idc}
                    className="cd-card"
                    onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cd-card-head">
                      <span className="cd-dossier-num">
                        <Hash size={11} />{d.case_number || '—'}
                      </span>
                      <span className={`cd-badge ${sc.cls}`}>{sc.label}</span>
                    </div>
                    <div className="cd-card-type" style={{ color: tm.color }}>
                      <TypeIcon size={14} /> {d.case_type || '—'}
                    </div>
                    <div className="cd-card-date">
                      <Calendar size={12} /> Ouvert le {fmtDate(d.created_at)}
                    </div>
                    <div className="cd-card-link">
                      <Eye size={13} /> Voir le dossier <ArrowRight size={12} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── AUDIENCES ── */}
      {activeTab === 'audiences' && (
        <div className="cd-section">
          {audiences.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon"><GavelIcon size={28} /></div>
              <p className="cd-empty-title">Aucune audience pour ce client</p>
              <p className="cd-empty-sub">Les audiences liées aux dossiers apparaîtront ici</p>
            </div>
          ) : (
            <div className="cd-table-wrap">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>Date &amp; heure</th>
                    <th>Type</th>
                    <th>Dossier</th>
                    <th>Tribunal</th>
                    <th>Juge</th>
                    <th>Salle</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {audiences.map(aud => {
                    const as = STATUS_AUD[aud.status] || { label: aud.status || '—', cls: '' };
                    return (
                      <tr key={aud.id}>
                        <td className="cd-td-date">{fmtDateTime(aud.hearingDate)}</td>
                        <td>{aud.hearingType || '—'}</td>
                        <td>
                          {aud.caseNumber
                            ? <span className="cd-case-num">{aud.caseNumber}</span>
                            : '—'
                          }
                        </td>
                        <td>
                          <span className="cd-tribunal">
                            <Building2 size={12} />{aud.tribunalName || '—'}
                          </span>
                        </td>
                        <td>
                          {aud.judgeName
                            ? <span className="cd-judge"><UserIcon size={12} />{aud.judgeName}</span>
                            : <span className="cd-muted">—</span>
                          }
                        </td>
                        <td>{aud.roomNumber || <span className="cd-muted">—</span>}</td>
                        <td><span className={`cd-badge ${as.cls}`}>{as.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RENDEZ-VOUS ── */}
      {activeTab === 'appointments' && (
        <div className="cd-section">
          {appointments.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon"><CalendarCheck size={28} /></div>
              <p className="cd-empty-title">Aucun rendez-vous pour ce client</p>
              <p className="cd-empty-sub">Les rendez-vous apparaîtront ici</p>
            </div>
          ) : (
            <div className="cd-table-wrap">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>Date &amp; heure</th>
                    <th>Motif</th>
                    <th>Dossier</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments
                    .slice()
                    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
                    .map(apt => {
                      const as = STATUS_APT[apt.status] || { label: apt.status, cls: '' };
                      return (
                        <tr key={apt.ida}>
                          <td className="cd-td-date">{fmtDateTime(apt.appointmentDate)}</td>
                          <td>{apt.reason || apt.motif || '—'}</td>
                          <td>
                            {apt.caseNumber
                              ? <span className="cd-case-num">{apt.caseNumber}</span>
                              : '—'
                            }
                          </td>
                          <td><span className={`cd-badge ${as.cls}`}>{as.label}</span></td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── INFORMATIONS ── */}
      {activeTab === 'infos' && (
        <div className="cd-profile-wrap">

          {/* Left — identity */}
          <div className="cd-profile-card">
            <div className="cd-profile-card-head">
              <div className="cd-profile-avatar">
                {photoSrc ? <img src={photoSrc} alt={fullName} /> : initials}
              </div>
              <div>
                <p className="cd-profile-name">{fullName}</p>
                <p className="cd-profile-role">Client · Cabinet Hajaij</p>
              </div>
            </div>
            <div className="cd-profile-rows">
              <div className="cd-profile-row">
                <div className="cd-profile-ic" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <CreditCard size={15} />
                </div>
                <div className="cd-profile-field">
                  <span className="cd-profile-label">CIN</span>
                  <span className="cd-profile-value">{client.CIN || client.cin || '—'}</span>
                </div>
              </div>
              <div className="cd-profile-row">
                <div className="cd-profile-ic" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Calendar size={15} />
                </div>
                <div className="cd-profile-field">
                  <span className="cd-profile-label">Date de naissance</span>
                  <span className="cd-profile-value">{fmtDate(client.date_naissance)}</span>
                </div>
              </div>
              <div className="cd-profile-row">
                <div className="cd-profile-ic" style={{ background: '#fef9ec', color: '#d97706' }}>
                  <MapPin size={15} />
                </div>
                <div className="cd-profile-field">
                  <span className="cd-profile-label">Adresse</span>
                  <span className="cd-profile-value">{client.adresse || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — contact */}
          <div className="cd-profile-card">
            <p className="cd-profile-section-title">Coordonnées</p>
            <div className="cd-profile-rows">
              <div className="cd-profile-row">
                <div className="cd-profile-ic" style={{ background: '#fdf2f8', color: '#db2777' }}>
                  <Mail size={15} />
                </div>
                <div className="cd-profile-field">
                  <span className="cd-profile-label">Email</span>
                  <a className="cd-profile-link" href={`mailto:${client.email}`}>{client.email || '—'}</a>
                </div>
              </div>
              <div className="cd-profile-row">
                <div className="cd-profile-ic" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Phone size={15} />
                </div>
                <div className="cd-profile-field">
                  <span className="cd-profile-label">Téléphone</span>
                  <a className="cd-profile-link" href={`tel:${client.tel}`}>{client.tel || '—'}</a>
                </div>
              </div>
            </div>

            <div className="cd-profile-divider" />

            <p className="cd-profile-section-title">Activité</p>
            <div className="cd-profile-kpis">
              <div className="cd-profile-kpi">
                <span className="cd-profile-kpi-num">{dossiers.length}</span>
                <span className="cd-profile-kpi-label">Dossiers</span>
              </div>
              <div className="cd-profile-kpi">
                <span className="cd-profile-kpi-num">{enCours}</span>
                <span className="cd-profile-kpi-label">En cours</span>
              </div>
              <div className="cd-profile-kpi">
                <span className="cd-profile-kpi-num">{audiences.length}</span>
                <span className="cd-profile-kpi-label">Audiences</span>
              </div>
              <div className="cd-profile-kpi">
                <span className="cd-profile-kpi-num">{appointments.length}</span>
                <span className="cd-profile-kpi-label">RDV</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
