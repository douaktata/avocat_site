import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getCasesByClient, getAppointmentsByUser, getClientInvoices } from '../api';
import './ClientPages.css';

const CASE_STATUS_LABEL = { OPEN: 'En cours', PENDING: 'En attente', CLOSED: 'Cloture' };
const APT_STATUS_LABEL = { CONFIRMED: 'Confirme', PENDING: 'En attente', CANCELLED: 'Annule' };
const typeColor = { Famille: '#e91e8c', Commercial: '#2451a3', Immobilier: '#059669', Penal: '#c0392b', Travail: '#d97706' };

const DashboardClient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dossiers, setDossiers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.idu) return;
    Promise.all([
      getCasesByClient(user.idu).catch(() => ({ data: [] })),
      getAppointmentsByUser(user.idu).catch(() => ({ data: [] })),
      getClientInvoices(user.idu).catch(() => ({ data: [] })),
    ])
      .then(([casesRes, aptRes, invRes]) => {
        setDossiers(casesRes.data);
        setAppointments(aptRes.data);
        setInvoices(invRes.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const now = new Date();
  const prochainsRdv = appointments
    .filter(a => (a.status === 'CONFIRMED' || a.status === 'PENDING') && a.appointmentDate && new Date(a.appointmentDate) > now)
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    .slice(0, 3);

  const totalEnAttente = invoices
    .filter(inv => inv.status === 'ISSUED')
    .reduce((sum, inv) => sum + Number(inv.amountDue || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="dashboard-client">

      <div className="page-header">
        <div>
          <h1 className="page-title">Bonjour, {user?.prenom || 'Client'}</h1>
          <p className="page-subtitle">Voici un apercu de votre espace juridique</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-folder-open"></i></div>
          <span className="stat-number">{loading ? '-' : dossiers.length}</span>
          <span className="stat-label">Dossiers actifs</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><i className="fas fa-calendar-check"></i></div>
          <span className="stat-number">{loading ? '-' : prochainsRdv.length}</span>
          <span className="stat-label">Rendez-vous a venir</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><i className="fas fa-bell"></i></div>
          <span className="stat-number">{loading ? '-' : invoices.filter(inv => inv.status === 'ISSUED').length}</span>
          <span className="stat-label">Paiements en attente</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><i className="fas fa-file-invoice-dollar"></i></div>
          <span className="stat-number">{loading ? '-' : `${Number(totalEnAttente).toLocaleString('fr-FR')} TND`}</span>
          <span className="stat-label">Solde en attente</span>
        </div>
      </div>

      <div className="dashboard-grid">

        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><i className="fas fa-folder-open"></i> Mes dossiers</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/client/dossiers')}>
              Voir tout <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <p style={{ padding: '1rem', color: '#6b7280' }}>Chargement...</p>
            ) : dossiers.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-folder"></i>
                <p>Aucun dossier en cours</p>
              </div>
            ) : (
              <div className="dossiers-list">
                {dossiers.slice(0, 3).map(d => {
                  const color = typeColor[d.case_type] || '#64748b';
                  const statutLabel = CASE_STATUS_LABEL[d.status] || d.status;
                  return (
                    <div key={d.idc} className="dossier-card" onClick={() => navigate(`/client/dossiers/${d.idc}`)}>
                      <div className="dossier-card-top">
                        <div className="dossier-type-badge" style={{ background: `${color}18`, color }}>
                          <i className="fas fa-folder"></i>
                        </div>
                        <div className="dossier-card-info">
                          <span className="dossier-number">{d.case_number}</span>
                          <h3 className="dossier-name">{d.case_type || '-'}</h3>
                        </div>
                        <span className={`badge ${d.status === 'OPEN' ? 'badge-blue' : 'badge-amber'}`}>
                          {statutLabel}
                        </span>
                      </div>
                      <div className="dossier-card-footer">
                        <span><i className="fas fa-calendar"></i> {formatDate(d.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><i className="fas fa-calendar-check"></i> Prochains rendez-vous</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/client/rendez-vous')}>
              Voir tout <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <p style={{ padding: '1rem', color: '#6b7280' }}>Chargement...</p>
            ) : prochainsRdv.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar"></i>
                <p>Aucun rendez-vous a venir</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/client/rendez-vous')}>
                  <i className="fas fa-plus"></i> Prendre un RDV
                </button>
              </div>
            ) : (
              <div className="dossiers-list">
                {prochainsRdv.map(rdv => {
                  const dateObj = rdv.appointmentDate ? new Date(rdv.appointmentDate) : null;
                  const statutLabel = APT_STATUS_LABEL[rdv.status] || rdv.status;
                  return (
                    <div key={rdv.ida} className="rdv-card">
                      <div className="rdv-date-block">
                        <div className="rdv-day">{dateObj ? dateObj.getDate() : '-'}</div>
                        <div className="rdv-month">{dateObj ? dateObj.toLocaleDateString('fr-FR', { month: 'short' }) : '-'}</div>
                      </div>
                      <div className="rdv-content">
                        <div className="rdv-content-top">
                          <p className="rdv-motif">{rdv.reason || '-'}</p>
                          <span className={`badge ${rdv.status === 'CONFIRMED' ? 'badge-green' : 'badge-amber'}`}>
                            {statutLabel}
                          </span>
                        </div>
                        <div className="rdv-meta">
                          {dateObj && <span><i className="fas fa-clock"></i> {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="section-label" style={{ marginTop: '1.5rem' }}>Actions rapides</p>
      <div className="quick-actions-grid">
        <button className="quick-action-btn" onClick={() => navigate('/client/rendez-vous')}>
          <i className="fas fa-calendar-plus"></i>
          <span>Prendre un RDV</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/client/paiements')}>
          <i className="fas fa-credit-card"></i>
          <span>Effectuer un paiement</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/client/dossiers')}>
          <i className="fas fa-folder-open"></i>
          <span>Mes dossiers</span>
        </button>
      </div>

    </div>
  );
};

export default DashboardClient;
