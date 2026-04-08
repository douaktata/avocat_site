import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getCasesByClient, getAppointmentsByUser } from '../api';
import './clientdetails.css';

const API_BASE = 'http://localhost:8081';

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const fmtDateTime = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

const TYPE_META = {
  Civil:      { icon: 'fa-balance-scale', color: '#0ea5e9' },
  Commercial: { icon: 'fa-briefcase',     color: '#3b82f6' },
  Pénal:      { icon: 'fa-gavel',         color: '#ef4444' },
  Famille:    { icon: 'fa-users',         color: '#06b6d4' },
  Immobilier: { icon: 'fa-home',          color: '#10b981' },
  Travail:    { icon: 'fa-hard-hat',      color: '#f59e0b' },
  Divorce:    { icon: 'fa-heart-broken',  color: '#ec4899' },
  Succession: { icon: 'fa-scroll',        color: '#8b5cf6' },
};
const defaultTypeMeta = { icon: 'fa-folder', color: '#64748b' };

const STATUS_CASE = {
  OPEN:    { label: 'En cours',   cls: 'badge-open' },
  PENDING: { label: 'En attente', cls: 'badge-pending' },
  CLOSED:  { label: 'Clôturé',   cls: 'badge-closed' },
};

const STATUS_APT = {
  CONFIRMED: { label: 'Confirmé', cls: 'badge-confirmed' },
  PENDING:   { label: 'En attente', cls: 'badge-apt-pending' },
  CANCELLED: { label: 'Annulé',  cls: 'badge-cancelled' },
  COMPLETED: { label: 'Effectué', cls: 'badge-done' },
};

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client,       setClient]       = useState(null);
  const [dossiers,     setDossiers]     = useState([]);
  const [appointments, setAppointments] = useState([]);
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
        setDossiers(casesRes.data || []);
        setAppointments((aptsRes.data || []).filter(a => a.status !== 'CANCELLED'));
      })
      .catch(() => setError('Impossible de charger ce client'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="cd-page">
      <p style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Chargement...
      </p>
    </div>
  );

  if (error || !client) return (
    <div className="cd-page">
      <div className="cd-not-found">
        <i className="fas fa-user-slash"></i>
        <h2>Client introuvable</h2>
        <p>{error || 'Ce client n\'existe pas.'}</p>
        <button onClick={() => navigate('/secretaire/clients')}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
      </div>
    </div>
  );

  const photoSrc = client.photo_url ? `${API_BASE}${client.photo_url}` : null;
  const initials = `${(client.prenom || '?')[0]}${(client.nom || '?')[0]}`.toUpperCase();
  const fullName = `${client.prenom || ''} ${client.nom || ''}`.trim();

  const tabs = [
    { key: 'dossiers',     label: 'Dossiers',       icon: 'fa-folder-open',   count: dossiers.length },
    { key: 'appointments', label: 'Rendez-vous',     icon: 'fa-calendar-check', count: appointments.length },
    { key: 'infos',        label: 'Informations',    icon: 'fa-info-circle',   count: null },
  ];

  return (
    <div className="cd-page">

      {/* ── Retour ── */}
      <button className="cd-back" onClick={() => navigate('/secretaire/clients')}>
        <i className="fas fa-arrow-left"></i> Retour aux clients
      </button>

      {/* ── Hero ── */}
      <div className="cd-hero">
        <div className="cd-avatar">
          {photoSrc
            ? <img src={photoSrc} alt={fullName} />
            : <span>{initials}</span>
          }
        </div>
        <div className="cd-hero-info">
          <h1 className="cd-name">{fullName}</h1>
          <div className="cd-hero-meta">
            {client.email && (
              <span><i className="fas fa-envelope"></i> {client.email}</span>
            )}
            {client.tel && (
              <span><i className="fas fa-phone"></i> {client.tel}</span>
            )}
            {client.adresse && (
              <span><i className="fas fa-map-marker-alt"></i> {client.adresse}</span>
            )}
          </div>
        </div>
        {/* Stats rapides */}
        <div className="cd-hero-stats">
          <div className="cd-stat">
            <strong>{dossiers.length}</strong>
            <span>Dossier{dossiers.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="cd-stat">
            <strong>{dossiers.filter(d => d.status === 'OPEN').length}</strong>
            <span>En cours</span>
          </div>
          <div className="cd-stat">
            <strong>{appointments.length}</strong>
            <span>Rendez-vous</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cd-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`cd-tab ${activeTab === tab.key ? 'cd-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
            {tab.count !== null && <span className="cd-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Dossiers ── */}
      {activeTab === 'dossiers' && (
        <div className="cd-section">
          {dossiers.length === 0 ? (
            <div className="cd-empty">
              <i className="fas fa-folder-open"></i>
              <p>Aucun dossier pour ce client</p>
            </div>
          ) : (
            <div className="cd-dossiers-grid">
              {dossiers.map(d => {
                const tm  = TYPE_META[d.case_type] || defaultTypeMeta;
                const sc  = STATUS_CASE[d.status]  || { label: d.status, cls: '' };
                return (
                  <div
                    key={d.idc}
                    className="cd-dossier-card"
                    onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cd-dossier-head">
                      <span className="cd-dossier-num">
                        <i className="fas fa-hashtag"></i>{d.case_number || '—'}
                      </span>
                      <span className={`cd-badge ${sc.cls}`}>{sc.label}</span>
                    </div>
                    <div className="cd-dossier-type" style={{ color: tm.color }}>
                      <i className={`fas ${tm.icon}`}></i> {d.case_type || '—'}
                    </div>
                    <div className="cd-dossier-date">
                      <i className="fas fa-calendar-plus"></i> Ouvert le {fmtDate(d.created_at)}
                    </div>
                    <div className="cd-dossier-link">
                      <i className="fas fa-eye"></i> Voir le dossier
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Rendez-vous ── */}
      {activeTab === 'appointments' && (
        <div className="cd-section">
          {appointments.length === 0 ? (
            <div className="cd-empty">
              <i className="fas fa-calendar-times"></i>
              <p>Aucun rendez-vous pour ce client</p>
            </div>
          ) : (
            <div className="cd-table-wrap">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>Date & heure</th>
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
                          <td style={{ fontWeight: 600 }}>{fmtDateTime(apt.appointmentDate)}</td>
                          <td>{apt.reason || apt.motif || '—'}</td>
                          <td>
                            {apt.caseNumber
                              ? <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#1e3a8a' }}>{apt.caseNumber}</span>
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

      {/* ── Informations ── */}
      {activeTab === 'infos' && (
        <div className="cd-section">
          <div className="cd-info-grid">
            <div className="cd-info-card">
              <i className="fas fa-id-card" style={{ color: '#3b82f6' }}></i>
              <div>
                <label>CIN</label>
                <p>{client.CIN || client.cin || '—'}</p>
              </div>
            </div>
            <div className="cd-info-card">
              <i className="fas fa-envelope" style={{ color: '#8b5cf6' }}></i>
              <div>
                <label>Email</label>
                <p>{client.email || '—'}</p>
              </div>
            </div>
            <div className="cd-info-card">
              <i className="fas fa-phone" style={{ color: '#10b981' }}></i>
              <div>
                <label>Téléphone</label>
                <p>{client.tel || '—'}</p>
              </div>
            </div>
            <div className="cd-info-card">
              <i className="fas fa-birthday-cake" style={{ color: '#f59e0b' }}></i>
              <div>
                <label>Date de naissance</label>
                <p>{fmtDate(client.date_naissance)}</p>
              </div>
            </div>
            <div className="cd-info-card" style={{ gridColumn: '1 / -1' }}>
              <i className="fas fa-map-marker-alt" style={{ color: '#ef4444' }}></i>
              <div>
                <label>Adresse</label>
                <p>{client.adresse || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDetails;
