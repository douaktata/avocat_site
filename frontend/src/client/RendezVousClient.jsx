import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getAppointmentsByUser, deleteAppointment } from '../api';
import './ClientPages.css';

const STATUS_LABEL = { CONFIRMED: 'Confirme', PENDING: 'En attente', CANCELLED: 'Annule', COMPLETED: 'Effectue' };
const STATUS_BADGE = { CONFIRMED: 'badge-green', PENDING: 'badge-amber', CANCELLED: 'badge-gray', COMPLETED: 'badge-gray' };

const RendezVousClient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rdvList, setRdvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    if (!user?.idu) return;
    getAppointmentsByUser(user.idu)
      .then(res => setRdvList(res.data))
      .catch(() => setError('Impossible de charger les rendez-vous'))
      .finally(() => setLoading(false));
  }, [user]);

  const now = new Date();
  const isFuture = (dateStr) => dateStr && new Date(dateStr) > now;
  const isPast = (dateStr) => dateStr && new Date(dateStr) <= now;

  const byDateAsc = (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate);
  const byDateDesc = (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate);

  const confirmes = rdvList
    .filter(r => r.status === 'CONFIRMED' && isFuture(r.appointmentDate))
    .sort(byDateAsc);
  const demandes = rdvList
    .filter(r => r.status === 'PENDING' && isFuture(r.appointmentDate))
    .sort(byDateAsc);
  const historique = rdvList
    .filter(r =>
      r.status === 'CANCELLED' ||
      r.status === 'COMPLETED' ||
      (r.status === 'CONFIRMED' && isPast(r.appointmentDate)) ||
      (r.status === 'PENDING' && isPast(r.appointmentDate))
    )
    .sort(byDateDesc);

  const stats = [
    { label: 'Confirmes', value: confirmes.length, icon: 'fa-calendar-check', variant: 'success' },
    { label: 'En attente', value: demandes.length, icon: 'fa-clock', variant: 'warning' },
    { label: 'Passes', value: historique.length, icon: 'fa-history', variant: '' },
  ];

  const handleCancel = (id) => {
    deleteAppointment(id)
      .then(() => setRdvList(prev => prev.filter(r => r.ida !== id)))
      .catch(console.error)
      .finally(() => setCancelTarget(null));
  };

  const parseDate = (dateStr) => (dateStr ? new Date(dateStr) : null);
  const formatDay = (dateStr) => { const d = parseDate(dateStr); return d ? d.getDate() : '-'; };
  const formatMonth = (dateStr) => { const d = parseDate(dateStr); return d ? d.toLocaleDateString('fr-FR', { month: 'short' }) : '-'; };
  const formatTime = (dateStr) => { const d = parseDate(dateStr); return d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'; };
  const formatDateLong = (dateStr) => { const d = parseDate(dateStr); return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'; };

  const RdvCard = ({ rdv, actions }) => (
    <div className="rdv-card">
      <div className="rdv-date-block">
        <div className="rdv-day">{formatDay(rdv.appointmentDate)}</div>
        <div className="rdv-month">{formatMonth(rdv.appointmentDate)}</div>
      </div>
      <div className="rdv-content">
        <div className="rdv-content-top">
          <p className="rdv-motif">{rdv.reason || '-'}</p>
          <span className={`badge ${STATUS_BADGE[rdv.status] || 'badge-gray'}`}>
            {STATUS_LABEL[rdv.status] || rdv.status}
          </span>
        </div>
        <div className="rdv-meta">
          <span><i className="fas fa-clock"></i> {formatTime(rdv.appointmentDate)}</span>
        </div>
        {actions && <div className="rdv-actions">{actions}</div>}
      </div>
    </div>
  );

  if (loading) return <div><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="rdv-client">

      <div className="page-header">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="page-subtitle">Gerez vos rendez-vous et demandes</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/client/rendez-vous/demande')}>
          <i className="fas fa-plus"></i> Demander un rendez-vous
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.variant}`}><i className={`fas ${s.icon}`}></i></div>
            <span className="stat-number">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <p className="section-label" style={{ marginBottom: '1rem' }}>Rendez-vous a venir</p>
        {confirmes.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-check"></i>
            <p>Aucun rendez-vous confirme pour le moment</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/client/rendez-vous/demande')}>
              <i className="fas fa-plus"></i> Faire une demande
            </button>
          </div>
        ) : (
          <div className="dossiers-list">
            {confirmes.map(rdv => (
              <RdvCard key={rdv.ida} rdv={rdv} actions={
                <button className="btn btn-danger btn-sm" onClick={() => setCancelTarget({ id: rdv.ida, type: 'rdv' })}>
                  <i className="fas fa-times"></i> Annuler le rendez-vous
                </button>
              } />
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <p className="section-label" style={{ marginBottom: '1rem' }}>Mes demandes de rendez-vous</p>
        {demandes.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clock"></i>
            <p>Aucune demande en attente</p>
          </div>
        ) : (
          <div className="dossiers-list">
            {demandes.map(rdv => (
              <RdvCard key={rdv.ida} rdv={rdv} actions={
                <button className="btn btn-danger btn-sm" onClick={() => setCancelTarget({ id: rdv.ida, type: 'demande' })}>
                  <i className="fas fa-times"></i> Annuler la demande
                </button>
              } />
            ))}
          </div>
        )}
      </div>

      {historique.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: '1rem' }}>Historique</p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Heure</th><th>Motif</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {historique.map(rdv => (
                  <tr key={rdv.ida}>
                    <td>{formatDateLong(rdv.appointmentDate)}</td>
                    <td>{formatTime(rdv.appointmentDate)}</td>
                    <td style={{ maxWidth: 240 }}>{rdv.reason || '-'}</td>
                    <td><span className="badge badge-gray">{STATUS_LABEL[rdv.status] || rdv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '1.3rem' }}>
                {cancelTarget.type === 'rdv' ? 'Annuler le rendez-vous' : 'Annuler la demande'}
              </h2>
              <button className="modal-close" onClick={() => setCancelTarget(null)}><i className="fas fa-times"></i></button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {cancelTarget.type === 'rdv'
                ? "Etes-vous sur de vouloir annuler ce rendez-vous ? Cette action est irreversible."
                : "Etes-vous sur de vouloir annuler cette demande de rendez-vous ?"}
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setCancelTarget(null)}>Retour</button>
              <button className="btn btn-danger" onClick={() => handleCancel(cancelTarget.id)}>
                <i className="fas fa-times"></i> Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RendezVousClient;
