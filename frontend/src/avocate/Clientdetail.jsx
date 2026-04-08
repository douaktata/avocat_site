import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getCasesByClient, getAppointmentsByUser, getProvisionsByClient, deleteProvision } from '../api';
import ProvisionModal from './ProvisionModal';
import './Dossierdetailav.css';

const fmtDate = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};
const fmtAmount = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';

const STATUT_DOSSIER = {
  OPEN:    { label: 'En cours',   color: '#2563eb', bg: '#dbeafe' },
  PENDING: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  CLOSED:  { label: 'Clôturé',   color: '#10b981', bg: '#d1fae5' },
};

const STATUT_RDV = {
  SCHEDULED: { label: 'À venir',   color: '#2563eb', bg: '#dbeafe' },
  COMPLETED: { label: 'Effectué',  color: '#10b981', bg: '#d1fae5' },
  CANCELLED: { label: 'Annulé',   color: '#ef4444', bg: '#fee2e2' },
};



const Badge = ({ text, color, bg }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>{text}</span>
);

const Empty = ({ icon, msg }) => (
  <div className="dd-empty">
    <div className="dd-empty-icon"><i className={`fas ${icon}`}></i></div>
    <p>{msg}</p>
  </div>
);

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client,       setClient]       = useState(null);
  const [dossiers,     setDossiers]     = useState([]);
  const [rdv,          setRdv]          = useState([]);
  const [provisions,   setProvisions]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [visible,      setVisible]      = useState(false);
  const [activeTab,    setActiveTab]    = useState('dossiers');
  const [showProvModal, setShowProvModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const avocatId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.idu; } catch { return null; } })();

  useEffect(() => {
    Promise.all([
      getUser(id),
      getCasesByClient(id).catch(() => ({ data: [] })),
      getAppointmentsByUser(id).catch(() => ({ data: [] })),
      getProvisionsByClient(id).catch(() => ({ data: [] })),
    ])
      .then(([uRes, cRes, aRes, provRes]) => {
        const u = uRes.data;
        setClient(u);
        setDossiers(cRes.data);
        setRdv(aRes.data);
        setProvisions(provRes.data);
        setTimeout(() => setVisible(true), 80);
      })
      .catch(() => setError('Client introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="dd-wrapper" style={{ padding: '3rem', textAlign: 'center' }}>Chargement...</div>;

  if (error || !client) return (
    <div className="dd-not-found">
      <div className="dd-nf-icon"><i className="fas fa-user-slash"></i></div>
      <h2>Client introuvable</h2>
      <p>Ce client n'existe pas ou a été supprimé.</p>
      <button onClick={() => navigate(-1)}><i className="fas fa-arrow-left"></i> Retour</button>
    </div>
  );

  const initials = `${(client.prenom || '?').charAt(0)}${(client.nom || '?').charAt(0)}`.toUpperCase();

  const loadProvisions = () => getProvisionsByClient(id).then(r => setProvisions(r.data)).catch(console.error);

  const handleDeleteProvision = (provId) => {
    if (!window.confirm('Supprimer cette provision ?')) return;
    deleteProvision(provId).then(loadProvisions).catch(() => alert('Erreur lors de la suppression'));
  };

  const totalProvisionsRecues = provisions
    .filter(p => p.status === 'RECUE' || p.status === 'APPLIQUEE')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const STATUS_PROV = {
    DEMANDEE:            { label: 'Demandée',   color: '#6b7689', bg: '#f1f3f7' },
    EN_ATTENTE_PAIEMENT: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
    RECUE:               { label: 'Reçue',      color: '#10b981', bg: '#d1fae5' },
    APPLIQUEE:           { label: 'Appliquée',  color: '#3b82f6', bg: '#dbeafe' },
    REMBOURSEE:          { label: 'Remboursée', color: '#9ca3af', bg: '#f3f4f6' },
  };

  const tabs = [
    { key: 'dossiers',   label: 'Dossiers',     icon: 'fa-folder-open',        count: dossiers.length },
    { key: 'provisions', label: 'Provisions',   icon: 'fa-hand-holding-usd',   count: provisions.length },
    { key: 'rdv',        label: 'Rendez-vous',  icon: 'fa-calendar-check',     count: rdv.length },
    { key: 'infos',      label: 'Informations', icon: 'fa-info-circle',        count: null },
  ];

  return (
    <div className={`dd-wrapper ${visible ? 'dd-visible' : ''}`}>

      {/* Retour */}
      <button className="dd-back" onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i><span>Retour aux clients</span>
      </button>

      {/* ══════ HERO ══════ */}
      <div className="dd-hero">
        <div className="dd-hero-topbar" />
        <div className="dd-hero-main">

          {/* Avatar */}
          <div className="dd-type-icon" style={{ background: '#dbeafe', color: '#1a56db', fontSize: '1.5rem', fontWeight: 700 }}>
            {initials}
          </div>

          <div className="dd-hero-identity">
            <div className="dd-hero-row1">
              <span className="dd-numero">
                <i className="fas fa-user"></i> CLIENT-{String(client.idu).padStart(4, '0')}
              </span>
              <div className="dd-badges">
                <span className={`dd-statut ${client.statut === 'Inactif' ? 'dd-s-closed' : 'dd-s-progress'}`}>
                  <i className={`fas ${client.statut === 'Inactif' ? 'fa-ban' : 'fa-circle-notch'}`}></i>
                  {client.statut || 'Actif'}
                </span>
              </div>
            </div>
            <h1 className="dd-hero-title">
              {client.prenom} {client.nom}
              <span className="dd-hero-sep">·</span>
              <span style={{ fontSize: '0.95rem', color: '#6b7689', fontWeight: 400 }}>{client.email}</span>
            </h1>
          </div>

          <div className="dd-hero-actions">
            <a href={`mailto:${client.email}`} className="dd-btn dd-btn-outline">
              <i className="fas fa-envelope"></i> Email
            </a>
          </div>
        </div>

        {/* Strip */}
        <div className="dd-strip">
          <div className="dd-strip-item">
            <i className="fas fa-phone"></i>
            <div><span className="dd-strip-label">Téléphone</span><span className="dd-strip-val">{client.tel || '—'}</span></div>
          </div>
          <div className="dd-strip-sep" />
          <div className="dd-strip-item">
            <i className="fas fa-id-card"></i>
            <div><span className="dd-strip-label">CIN</span><span className="dd-strip-val">{client.cin || client.CIN || '—'}</span></div>
          </div>
          <div className="dd-strip-sep" />
          <div className="dd-strip-item">
            <i className="fas fa-map-marker-alt"></i>
            <div><span className="dd-strip-label">Adresse</span><span className="dd-strip-val">{client.adresse || '—'}</span></div>
          </div>
          <div className="dd-strip-sep" />
          <div className="dd-strip-item dd-strip-kpis">
            {tabs.filter(t => t.count !== null).map(t => (
              <div key={t.key} className="dd-kpi-mini">
                <span className="dd-kpi-num">{t.count}</span>
                <span className="dd-kpi-lbl">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ BODY ══════ */}
      <div className="dd-body">

        {/* Tabs */}
        <div className="dd-tab-nav">
          {tabs.map(tab => (
            <button key={tab.key} className={`dd-tab-btn ${activeTab === tab.key ? 'dd-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
              {tab.count !== null && <span className="dd-tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ── Dossiers ── */}
        {activeTab === 'dossiers' && (
          <div className="dd-tab-content dd-appear">
            {dossiers.length === 0 ? <Empty icon="fa-folder-open" msg="Aucun dossier pour ce client" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dossiers.map(d => {
                  const sm = STATUT_DOSSIER[d.status] || STATUT_DOSSIER.OPEN;
                  return (
                    <div key={d.idc} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-folder-open"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1a1f2e', fontSize: '0.9rem' }}>{d.case_number}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7689', marginTop: 2 }}>{d.case_type} · Ouvert le {fmtDate(d.created_at)}</div>
                      </div>
                      <Badge text={sm.label} color={sm.color} bg={sm.bg} />
                      <button onClick={() => navigate(`/avocat/affjud/${d.idc}`)}
                        style={{ background: '#dbeafe', color: '#1a56db', border: 'none', borderRadius: 8, padding: '0.4rem 0.85rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                        <i className="fas fa-arrow-right"></i> Ouvrir
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Provisions ── */}
        {activeTab === 'provisions' && (
          <div className="dd-tab-content dd-appear">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7689' }}>
                Total reçu : <strong style={{ color: '#10b981' }}>{fmtAmount(totalProvisionsRecues)}</strong>
              </span>
            </div>
            {provisions.length === 0 ? <Empty icon="fa-hand-holding-usd" msg="Aucune provision pour ce client" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {provisions.map(p => {
                  const sm = STATUS_PROV[p.status] || STATUS_PROV.DEMANDEE;
                  return (
                    <div key={p.id} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-hand-holding-usd"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1a56db', fontSize: '0.875rem' }}>{p.provisionNumber}</div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7689', marginTop: 2 }}>
                          {p.caseNumber && <span>Dossier {p.caseNumber} · </span>}
                          {p.description}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>{fmtAmount(p.amount)}</span>
                      <Badge text={sm.label} color={sm.color} bg={sm.bg} />
                      <button
                        onClick={() => handleDeleteProvision(p.id)}
                        title="Supprimer"
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-trash-alt" style={{ fontSize: '0.75rem' }}></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Rendez-vous ── */}
        {activeTab === 'rdv' && (
          <div className="dd-tab-content dd-appear">
            {(() => {
              const now = new Date();
              const avenir = rdv.filter(a => a.status === 'SCHEDULED' && new Date(a.appointmentDate) >= now)
                               .sort((a,b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
              const passes = rdv.filter(a => a.status !== 'SCHEDULED' || new Date(a.appointmentDate) < now)
                               .sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

              return (
                <>
                  <div style={{marginBottom: '1.5rem'}}>
                    <h4 style={{fontSize: '0.95rem', color: '#1a1f2e', marginBottom: '0.75rem', fontWeight: 600}}>
                      <i className="fas fa-calendar-check" style={{color: '#2563eb', marginRight: '0.5rem'}}></i>
                      Rendez-vous à venir ({avenir.length})
                    </h4>
                    {avenir.length === 0 ? (
                      <p style={{color: '#9aa3b4', fontSize: '0.85rem', paddingLeft: '1.75rem'}}>Aucun rendez-vous programmé</p>
                    ) : (
                      <div className="dd-aud-list" style={{gap: '0.6rem'}}>
                        {avenir.map(a => {
                          const sm = STATUT_RDV[a.status];
                          const dt = new Date(a.appointmentDate);
                          return (
                            <div key={a.ida} className="dd-aud-row dd-aud-avenir" style={{borderLeft: '3px solid #2563eb'}}>
                              <div className="dd-aud-date">
                                <span className="dd-aud-day">{dt.toLocaleDateString('fr-FR', { day: '2-digit' })}</span>
                                <span className="dd-aud-month">{dt.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                <span className="dd-aud-year">{dt.getFullYear()}</span>
                              </div>
                              <div className="dd-aud-vsep" />
                              <div className="dd-aud-info">
                                <span className="dd-aud-type">{a.reason || 'Rendez-vous'}</span>
                                <div className="dd-aud-sub">
                                  <i className="fas fa-clock"></i>{dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <Badge text={sm.label} color={sm.color} bg={sm.bg} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {passes.length > 0 && (
                    <div>
                      <h4 style={{fontSize: '0.95rem', color: '#6b7689', marginBottom: '0.75rem', fontWeight: 600}}>
                        <i className="fas fa-calendar-check" style={{color: '#9aa3b4', marginRight: '0.5rem'}}></i>
                        Rendez-vous passés ({passes.length})
                      </h4>
                      <div className="dd-aud-list" style={{gap: '0.5rem', opacity: 0.85}}>
                        {passes.slice(0, 10).map(a => {
                          const sm = STATUT_RDV[a.status] || STATUT_RDV.COMPLETED;
                          const dt = new Date(a.appointmentDate);
                          return (
                            <div key={a.ida} className="dd-aud-row dd-aud-passee">
                              <div className="dd-aud-date">
                                <span className="dd-aud-day">{dt.toLocaleDateString('fr-FR', { day: '2-digit' })}</span>
                                <span className="dd-aud-month">{dt.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                              </div>
                              <div className="dd-aud-vsep" />
                              <div className="dd-aud-info">
                                <span className="dd-aud-type">{a.reason || 'Rendez-vous'}</span>
                              </div>
                              <Badge text={sm.label} color={sm.color} bg={sm.bg} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}



        {/* ── Informations ── */}
        {activeTab === 'infos' && (
          <div className="dd-tab-content dd-appear">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {[
                { icon: 'fa-user', label: 'Nom complet',      val: `${client.prenom || ''} ${client.nom || ''}`.trim() },
                { icon: 'fa-envelope', label: 'Email',        val: client.email },
                { icon: 'fa-phone', label: 'Téléphone',       val: client.tel || '—' },
                { icon: 'fa-id-card', label: 'CIN',           val: client.cin || client.CIN || '—' },
                { icon: 'fa-birthday-cake', label: 'Date de naissance', val: fmtDate(client.date_naissance) },
                { icon: 'fa-map-marker-alt', label: 'Adresse', val: client.adresse || '—' },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9aa3b4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1f2e', marginTop: '0.2rem' }}>{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showProvModal && selectedCaseId && (
        <ProvisionModal
          caseId={selectedCaseId}
          avocatId={avocatId}
          clientId={id}
          provisions={provisions.filter(p => String(p.caseId) === String(selectedCaseId))}
          onRefresh={loadProvisions}
          onClose={() => setShowProvModal(false)}
        />
      )}
    </div>
  );
}
