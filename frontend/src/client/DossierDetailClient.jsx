import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getCase, getDocumentsByCase, getAudiencesByCase, getAppointmentsByUser, downloadDocument,
  getClientInvoices, getBillingSummary, getProvisionsByCase,
  downloadClientInvoicePdf,
} from '../api';
import './ClientPages.css';

const CASE_STATUS_LABEL = { OPEN: 'En cours', CLOSED: 'Clôturé', PENDING: 'En attente' };
const CASE_STATUS_BADGE = { OPEN: 'badge-blue', CLOSED: 'badge-gray', PENDING: 'badge-amber' };

const APT_STATUS_LABEL  = { CONFIRMED: 'Confirmé', PENDING: 'En attente', CANCELLED: 'Annulé', COMPLETED: 'Effectué' };
const APT_STATUS_BADGE  = { CONFIRMED: 'badge-green', PENDING: 'badge-amber', CANCELLED: 'badge-red', COMPLETED: 'badge-gray' };

const AUD_STATUS_LABEL = { SCHEDULED: 'Programmée', COMPLETED: 'Terminée', POSTPONED: 'Reportée', CANCELLED: 'Annulée' };
const AUD_STATUS_BADGE = { SCHEDULED: 'badge-blue', COMPLETED: 'badge-gray', POSTPONED: 'badge-amber', CANCELLED: 'badge-red' };

const INV_STATUS = {
  PAID:      { label: 'Payée',      color: '#10b981', bg: '#d1fae5' },
  PAYEE:     { label: 'Payée',      color: '#10b981', bg: '#d1fae5' },
  EMISE:     { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  ISSUED:    { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  EN_RETARD: { label: 'En retard',  color: '#ef4444', bg: '#fee2e2' },
  BROUILLON: { label: 'Brouillon',  color: '#6b7689', bg: '#f1f3f7' },
  DRAFT:     { label: 'Brouillon',  color: '#6b7689', bg: '#f1f3f7' },
  ANNULEE:   { label: 'Annulée',    color: '#9ca3af', bg: '#f3f4f6' },
  VOID:      { label: 'Annulée',    color: '#9ca3af', bg: '#f3f4f6' },
};

const PROV_STATUS = {
  DEMANDEE: { label: 'Demandée', color: '#f59e0b', bg: '#fef3c7' },
  RECUE:    { label: 'Reçue',    color: '#10b981', bg: '#d1fae5' },
  REMBOURSEE: { label: 'Remboursée', color: '#6b7689', bg: '#f1f3f7' },
};

const TYPE_COLOR = { Famille: '#db2777', Commercial: '#2451a3', Immobilier: '#059669', Pénal: '#c0392b', Travail: '#d97706', Civil: '#7c3aed' };

const fmt    = n  => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
const fmtDateShort = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const docTypeIcon = t => {
  const s = (t || '').toLowerCase();
  if (s === 'pdf') return 'fa-file-pdf';
  if (s === 'docx' || s === 'doc') return 'fa-file-word';
  if (s === 'xlsx' || s === 'xls') return 'fa-file-excel';
  if (['jpg','png','jpeg'].includes(s)) return 'fa-file-image';
  return 'fa-file-alt';
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const DossierDetailClient = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [loading,   setLoading]   = useState(true);

  // data
  const [dossier,      setDossier]      = useState(null);
  const [documents,    setDocuments]    = useState([]);
  const [audiences,    setAudiences]    = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices,     setInvoices]     = useState([]);
  const [billing,      setBilling]      = useState(null);
  const [provisions,   setProvisions]   = useState([]);

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      getCase(id),
      getDocumentsByCase(id),
      getAudiencesByCase(id),
      user ? getAppointmentsByUser(user.idu) : Promise.resolve({ data: [] }),
      user ? getClientInvoices(user.idu)     : Promise.resolve({ data: [] }),
      getBillingSummary(id),
      getProvisionsByCase(id),
    ]).then(([caseR, docsR, trialsR, aptsR, invR, billR, provR]) => {
      if (caseR.status   === 'fulfilled') setDossier(caseR.value.data);
      if (docsR.status   === 'fulfilled') setDocuments(docsR.value.data || []);
      if (trialsR.status === 'fulfilled') setAudiences(trialsR.value.data || []);
      if (aptsR.status   === 'fulfilled') setAppointments(aptsR.value.data || []);
      if (invR.status    === 'fulfilled') {
        setInvoices((invR.value.data || []).filter(i => String(i.caseId) === String(id)));
      }
      if (billR.status   === 'fulfilled') setBilling(billR.value.data);
      if (provR.status   === 'fulfilled') setProvisions(provR.value.data || []);
    }).finally(() => setLoading(false));
  }, [id, user]);

  const handleDownloadDoc = doc => {
    downloadDocument(doc.idd)
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a'); a.href = url; a.download = doc.file_name || 'document'; a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('Erreur lors du téléchargement'));
  };

  const handleDownloadInvoice = inv => {
    downloadClientInvoicePdf(user.idu, inv.id)
      .then(r => downloadBlob(r.data, `${inv.invoiceNumber}.pdf`))
      .catch(() => alert('Erreur téléchargement PDF'));
  };

  if (loading) return <div className="dossier-detail-client"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  if (!dossier) return (
    <div className="dossier-detail-client">
      <button className="back-link" onClick={() => navigate('/client/dossiers')}>
        <i className="fas fa-arrow-left"></i> Retour
      </button>
      <div className="empty-state"><i className="fas fa-folder-open"></i><p>Dossier introuvable</p></div>
    </div>
  );

  const statutLabel     = CASE_STATUS_LABEL[dossier.status] || dossier.status;
  const statutBadge     = CASE_STATUS_BADGE[dossier.status] || 'badge-gray';
  const caseType        = dossier.case_type || '-';
  const typeColor       = TYPE_COLOR[caseType] || '#64748b';
  const upcomingApt     = appointments.find(a => a.status === 'CONFIRMED');
  const totalInvoiceTTC = invoices.reduce((s, i) => s + Number(i.amountTTC || 0), 0);
  const totalPaid       = invoices.reduce((s, i) => s + Number(i.amountPaid || 0), 0);
  const totalDue        = invoices.reduce((s, i) => s + Number(i.amountDue || 0), 0);

  const tabs = [
    { id: 'info',       label: 'Informations',              icon: 'fa-info-circle'   },
    { id: 'factures',   label: `Factures (${invoices.length})`,  icon: 'fa-file-invoice'  },
    { id: 'bilan',      label: 'Bilan financier',             icon: 'fa-chart-pie'     },
    { id: 'documents',  label: `Documents (${documents.length})`, icon: 'fa-file-alt'      },
    { id: 'rdv',        label: 'Rendez-vous',                icon: 'fa-calendar'      },
    { id: 'audiences',  label: `Audiences (${audiences.length})`,  icon: 'fa-gavel'         },
  ];

  return (
    <div className="dossier-detail-client">

      {/* TOP BAR */}
      <div className="detail-topbar">
        <button className="back-link" onClick={() => navigate('/client/dossiers')}>
          <i className="fas fa-arrow-left"></i> Retour aux dossiers
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/client/rendez-vous')}>
          <i className="fas fa-calendar-plus"></i> Prendre un RDV
        </button>
      </div>

      {/* HEADER */}
      <div className="detail-header">
        <div className="detail-header-meta">
          <span className="dossier-number">{dossier.case_number || `#${dossier.idc}`}</span>
          <span className={`badge ${statutBadge}`}>{statutLabel}</span>
          <span className="detail-type-label" style={{ color: typeColor }}>
            <i className="fas fa-tag"></i> {caseType}
          </span>
        </div>
        <h1 className="detail-title">{dossier.case_number}</h1>
        <div className="detail-header-chips">
          <span><i className="fas fa-calendar-alt"></i> Ouvert le {fmtDate(dossier.created_at)}</span>
          <span><i className="fas fa-file-alt"></i> {documents.length} document{documents.length !== 1 ? 's' : ''}</span>
          <span><i className="fas fa-gavel"></i> {audiences.length} audience{audiences.length !== 1 ? 's' : ''}</span>
          {invoices.length > 0 && (
            <span><i className="fas fa-file-invoice"></i> {invoices.length} facture{invoices.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="detail-tabs-bar">
        {tabs.map(tab => (
          <button key={tab.id} className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Informations ── */}
      {activeTab === 'info' && (
        <div className="detail-body">
          <div className="detail-main">
            <div className="detail-card">
              <h3 className="detail-card-title">Détails</h3>
              <div className="detail-info-grid">
                {[
                  { label: 'Numéro',          value: dossier.case_number || '-' },
                  { label: 'Type',            value: <span style={{ color: typeColor, fontWeight: 600 }}>{caseType}</span> },
                  { label: 'Statut',          value: <span className={`badge ${statutBadge}`}>{statutLabel}</span> },
                  { label: "Date d'ouverture",value: fmtDate(dossier.created_at) },
                  { label: 'Documents',       value: `${documents.length} fichier${documents.length !== 1 ? 's' : ''}` },
                  { label: 'Factures',        value: `${invoices.length} facture${invoices.length !== 1 ? 's' : ''}` },
                ].map((item, i) => (
                  <div key={i} className="detail-info-item">
                    <label>{item.label}</label>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-aside">
            <div className="detail-card">
              <h3 className="detail-card-title">Progression</h3>
              <div className="timeline">
                {[
                  { label: 'Dossier ouvert',    sub: fmtDate(dossier.created_at),                                            done: true },
                  { label: 'Documents collectés', sub: `${documents.length} fichier${documents.length !== 1 ? 's' : ''}`,    done: documents.length > 0 },
                  { label: 'Audiences fixées',  sub: `${audiences.length} programmée${audiences.length !== 1 ? 's' : ''}`,   done: audiences.length > 0 },
                  { label: 'Jugement final',    sub: dossier.status === 'CLOSED' ? 'Prononcé' : 'En attente',                done: dossier.status === 'CLOSED' },
                ].map((step, i, arr) => (
                  <div key={i} className="timeline-step">
                    <div className="timeline-left">
                      <div className={`timeline-dot ${step.done ? 'done' : ''}`}>
                        <i className={`fas ${step.done ? 'fa-check' : 'fa-circle'}`}></i>
                      </div>
                      {i < arr.length - 1 && <div className={`timeline-line ${step.done ? 'done' : ''}`}></div>}
                    </div>
                    <div className="timeline-body">
                      <span className="timeline-label">{step.label}</span>
                      <span className="timeline-sub">{step.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {upcomingApt && (
              <div className="detail-card">
                <h3 className="detail-card-title">Prochain RDV confirmé</h3>
                <div className="mini-rdv">
                  <div className="mini-rdv-cal">
                    <span>{new Date(upcomingApt.appointmentDate).getDate()}</span>
                    <span>{new Date(upcomingApt.appointmentDate).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </div>
                  <div>
                    <p className="mini-rdv-motif">{upcomingApt.reason || 'Rendez-vous'}</p>
                    <span className="mini-rdv-heure">
                      <i className="fas fa-clock"></i>{' '}
                      {new Date(upcomingApt.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Factures ── */}
      {activeTab === 'factures' && (
        <div className="detail-body">
          <div className="detail-main">
            {/* résumé rapide */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Total facturé TTC', value: fmt(totalInvoiceTTC), color: '#1a1f2e' },
                { label: 'Montant payé',      value: fmt(totalPaid),       color: '#10b981' },
                { label: 'Reste à payer',     value: fmt(totalDue),        color: totalDue > 0 ? '#ef4444' : '#10b981' },
              ].map(card => (
                <div key={card.label} className="detail-card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#9aa3b4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{card.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div className="detail-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fc' }}>
                    {['N° Facture', 'Date', 'Échéance', 'HT', 'TVA', 'TTC', 'Payé', 'Statut', 'PDF'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 0.9rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#9aa3b4' }}>
                      <i className="fas fa-file-invoice" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.3 }}></i>
                      Aucune facture pour ce dossier
                    </td></tr>
                  ) : invoices.map(inv => {
                    const si = INV_STATUS[inv.status] || INV_STATUS.BROUILLON;
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f3f7' }}>
                        <td style={{ padding: '0.7rem 0.9rem', fontWeight: 600, color: '#1a1f2e' }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '0.7rem 0.9rem' }}>{fmtDateShort(inv.invoiceDate)}</td>
                        <td style={{ padding: '0.7rem 0.9rem', color: inv.status === 'EN_RETARD' ? '#ef4444' : '#6b7689' }}>{fmtDateShort(inv.dueDate)}</td>
                        <td style={{ padding: '0.7rem 0.9rem' }}>{fmt(inv.amountHT)}</td>
                        <td style={{ padding: '0.7rem 0.9rem', color: '#6b7689' }}>{fmt(inv.amountTVA)}</td>
                        <td style={{ padding: '0.7rem 0.9rem', fontWeight: 700 }}>{fmt(inv.amountTTC)}</td>
                        <td style={{ padding: '0.7rem 0.9rem', color: '#10b981', fontWeight: 600 }}>{fmt(inv.amountPaid)}</td>
                        <td style={{ padding: '0.7rem 0.9rem' }}>
                          <span style={{ background: si.bg, color: si.color, borderRadius: 20, padding: '0.18rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>{si.label}</span>
                        </td>
                        <td style={{ padding: '0.7rem 0.9rem' }}>
                          <button onClick={() => handleDownloadInvoice(inv)}
                            style={{ background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem' }}>
                            <i className="fas fa-download"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* lignes de facture détaillées */}
            {invoices.filter(i => i.lines?.length > 0).map(inv => (
              <div key={`lines-${inv.id}`} className="detail-card" style={{ marginTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: '#1a1f2e' }}>
                  Détail — {inv.invoiceNumber}
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fc' }}>
                      {['Description', 'Qté', 'Prix unit.', 'Total'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', fontSize: '0.76rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inv.lines.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f1f3f7' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{l.description}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#6b7689' }}>{l.quantity}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{fmt(l.unitPrice)}</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{fmt(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="detail-aside">
            <div className="detail-card">
              <h3 className="detail-card-title">À savoir</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7689', lineHeight: 1.65, margin: 0 }}>
                Les factures sont émises par le cabinet après réalisation des prestations. Pour toute question, contactez votre avocat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Bilan financier ── */}
      {activeTab === 'bilan' && (
        <div className="detail-body">
          <div className="detail-main">
            {/* Récapitulatif billing */}
            {billing && (
              <div className="detail-card">
                <h3 className="detail-card-title">Récapitulatif financier</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  {[
                    { label: 'Total facturé HT',  value: fmt(billing.totalInvoicedHT),  color: '#1a1f2e' },
                    { label: 'Total facturé TTC',  value: fmt(billing.totalInvoicedTTC), color: '#1a1f2e' },
                    { label: 'Solde dépôt fiducie',value: fmt(billing.trustBalance),     color: '#2451a3' },
                    { label: 'Montant impayé',     value: fmt(billing.totalUnpaid),      color: billing.totalUnpaid > 0 ? '#ef4444' : '#10b981' },
                  ].map(c => (
                    <div key={c.label} style={{ background: '#f8f9fc', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#9aa3b4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{c.label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: c.color }}>{c.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#6b7689' }}>Statut :</span>
                  <span style={{
                    background: billing.status === 'SETTLED' ? '#d1fae5' : '#fef3c7',
                    color:      billing.status === 'SETTLED' ? '#10b981' : '#f59e0b',
                    borderRadius: 20, padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                  }}>
                    {billing.status === 'SETTLED' ? 'Soldé' : billing.status === 'PARTIAL' ? 'Partiel' : billing.status}
                  </span>
                </div>
              </div>
            )}

            {/* Provisions */}
            <div className="detail-card" style={{ marginTop: '1rem' }}>
              <h3 className="detail-card-title">Provisions</h3>
              {provisions.length === 0 ? (
                <div className="empty-state"><i className="fas fa-coins"></i><p>Aucune provision</p></div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fc' }}>
                      {['N°', 'Type', 'Montant', 'Demandée le', 'Reçue le', 'Remboursable', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '0.65rem 0.9rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', fontSize: '0.78rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {provisions.map(prov => {
                      const ps = PROV_STATUS[prov.status] || { label: prov.status, color: '#6b7689', bg: '#f1f3f7' };
                      return (
                        <tr key={prov.id} style={{ borderBottom: '1px solid #f1f3f7' }}>
                          <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: '#1a1f2e' }}>{prov.provisionNumber}</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: '#6b7689' }}>{prov.type}</td>
                          <td style={{ padding: '0.65rem 0.9rem', fontWeight: 700 }}>{fmt(prov.amount)}</td>
                          <td style={{ padding: '0.65rem 0.9rem' }}>{fmtDateShort(prov.requestedDate)}</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: prov.receivedDate ? '#10b981' : '#9aa3b4' }}>
                            {prov.receivedDate ? fmtDateShort(prov.receivedDate) : '—'}
                          </td>
                          <td style={{ padding: '0.65rem 0.9rem' }}>
                            {prov.isRefundable
                              ? <span style={{ color: '#10b981', fontSize: '0.82rem' }}><i className="fas fa-check"></i> Oui</span>
                              : <span style={{ color: '#9aa3b4', fontSize: '0.82rem' }}><i className="fas fa-times"></i> Non</span>}
                          </td>
                          <td style={{ padding: '0.65rem 0.9rem' }}>
                            <span style={{ background: ps.bg, color: ps.color, borderRadius: 20, padding: '0.18rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>{ps.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="detail-aside">
            {billing && (
              <div className="detail-card">
                <h3 className="detail-card-title">Synthèse</h3>
                <div className="timeline">
                  {[
                    { label: 'Factures émises',   sub: `${invoices.length} facture${invoices.length !== 1 ? 's' : ''}`,     done: invoices.length > 0 },
                    { label: 'Provisions',         sub: `${provisions.length} provision${provisions.length !== 1 ? 's' : ''}`, done: provisions.length > 0 },
                    { label: 'Dossier soldé',      sub: billing.status === 'SETTLED' ? 'Oui' : 'En cours',                  done: billing.status === 'SETTLED' },
                  ].map((step, i, arr) => (
                    <div key={i} className="timeline-step">
                      <div className="timeline-left">
                        <div className={`timeline-dot ${step.done ? 'done' : ''}`}>
                          <i className={`fas ${step.done ? 'fa-check' : 'fa-circle'}`}></i>
                        </div>
                        {i < arr.length - 1 && <div className={`timeline-line ${step.done ? 'done' : ''}`}></div>}
                      </div>
                      <div className="timeline-body">
                        <span className="timeline-label">{step.label}</span>
                        <span className="timeline-sub">{step.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Documents ── */}
      {activeTab === 'documents' && (
        <div className="detail-body">
          <div className="detail-main">
            <div className="detail-card">
              <h3 className="detail-card-title">
                Documents <span style={{ color: '#9aa3b4', fontWeight: 400 }}>({documents.length})</span>
              </h3>
              {documents.length === 0 ? (
                <div className="empty-state"><i className="fas fa-file-alt"></i><p>Aucun document</p></div>
              ) : (
                <div className="doc-list">
                  {documents.map(doc => (
                    <div key={doc.idd} className="doc-item">
                      <div className="doc-icon"><i className={`fas ${docTypeIcon(doc.file_type)}`}></i></div>
                      <div className="doc-info">
                        <div className="doc-name">{doc.file_name || '-'}</div>
                        <div className="doc-meta">
                          <span className="doc-type-pill">{doc.file_type || '-'}</span>
                          {doc.created_at && ` · ${fmtDate(doc.created_at)}`}
                        </div>
                      </div>
                      <div className="doc-actions">
                        <button className="doc-btn" title="Télécharger" onClick={() => handleDownloadDoc(doc)}>
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="detail-aside">
            <div className="detail-card">
              <h3 className="detail-card-title">Information</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7689', lineHeight: 1.65, margin: 0 }}>
                Les documents sont partagés par le cabinet. Contactez votre avocat pour toute demande de document supplémentaire.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Rendez-vous ── */}
      {activeTab === 'rdv' && (
        <div className="detail-body">
          <div className="detail-main">
            <div className="detail-card">
              <div className="detail-card-header">
                <h3 className="detail-card-title">Mes rendez-vous</h3>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/client/rendez-vous/demande')}>
                  <i className="fas fa-plus"></i> Nouveau
                </button>
              </div>
              {appointments.length === 0 ? (
                <div className="empty-state"><i className="fas fa-calendar"></i><p>Aucun rendez-vous</p></div>
              ) : (
                <div className="doc-list">
                  {appointments.map(apt => (
                    <div key={apt.ida} className="rdv-row">
                      <div className="rdv-row-cal">
                        <span>{new Date(apt.appointmentDate).getDate()}</span>
                        <span>{new Date(apt.appointmentDate).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                      </div>
                      <div className="rdv-row-info">
                        <span className="rdv-row-motif">{apt.reason || 'Rendez-vous'}</span>
                        <span className="rdv-row-heure">
                          <i className="fas fa-clock"></i>{' '}
                          {new Date(apt.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`badge ${APT_STATUS_BADGE[apt.status] || 'badge-gray'}`}>
                        {APT_STATUS_LABEL[apt.status] || apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="detail-aside">
            <div className="detail-card">
              <h3 className="detail-card-title">Information</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7689', lineHeight: 1.65, margin: 0 }}>
                Pour demander un nouveau rendez-vous, cliquez sur <strong>Nouveau</strong>.
              </p>
              <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/client/rendez-vous')}>
                <i className="fas fa-calendar-check"></i> Gérer mes RDV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Audiences ── */}
      {activeTab === 'audiences' && (
        <div className="detail-body">
          <div className="detail-main">
            <div className="detail-card">
              <h3 className="detail-card-title">Audiences</h3>
              {audiences.length === 0 ? (
                <div className="empty-state"><i className="fas fa-gavel"></i><p>Aucune audience programmée</p></div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Lieu / Tribunal</th>
                        <th>Avocat</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audiences.map(a => (
                        <tr key={a.id}>
                          <td>{fmtDate(a.hearingDate)}</td>
                          <td>{a.tribunalName || a.roomNumber || '-'}</td>
                          <td>{a.judgeName || '-'}</td>
                          <td>
                            <span className={`badge ${AUD_STATUS_BADGE[a.status] || 'badge-gray'}`}>
                              {AUD_STATUS_LABEL[a.status] || a.status || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="detail-aside">
            <div className="detail-card">
              <h3 className="detail-card-title">À savoir</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7689', lineHeight: 1.65, margin: 0 }}>
                Les audiences sont planifiées par le cabinet selon le calendrier judiciaire.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DossierDetailClient;
