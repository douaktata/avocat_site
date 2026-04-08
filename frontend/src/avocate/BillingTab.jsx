import { useState, useEffect } from 'react';
import { getBillingSummary, getTrustLedger, processRefund } from '../api';

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
const fmtDate = d => d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ENTRY_INFO = {
  DEPOSIT:    { label: 'Dépôt',      icon: 'fa-arrow-down',  color: '#059669', bg: '#d1fae5' },
  INVOICE:    { label: 'Facture',    icon: 'fa-file-invoice', color: '#3b82f6', bg: '#dbeafe' },
  ALLOCATION: { label: 'Allocation', icon: 'fa-link',         color: '#d97706', bg: '#fef3c7' },
  REFUND:     { label: 'Remboursement', icon: 'fa-arrow-up',  color: '#ef4444', bg: '#fee2e2' },
};

const BILLING_STATUS = {
  REFUND_DUE:  { label: 'Remboursement dû au client', color: '#d97706', bg: '#fef3c7', icon: 'fa-undo' },
  PAYMENT_DUE: { label: 'Paiement client en attente', color: '#ef4444', bg: '#fee2e2', icon: 'fa-exclamation-circle' },
  SETTLED:     { label: 'Dossier entièrement réglé',  color: '#059669', bg: '#d1fae5', icon: 'fa-check-circle' },
  IN_PROGRESS: { label: 'En cours de règlement',      color: '#3b82f6', bg: '#dbeafe', icon: 'fa-clock' },
};

export default function BillingTab({ caseId }) {
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      getBillingSummary(caseId).catch(() => ({ data: null })),
      getTrustLedger(caseId).catch(() => ({ data: [] })),
    ]).then(([sRes, lRes]) => {
      setSummary(sRes.data);
      setLedger(lRes.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [caseId]);

  const handleRefund = async amount => {
    try {
      await processRefund(caseId, { amount, notes: 'Remboursement solde séquestre' });
      load();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#9aa3b4' }}><i className="fas fa-spinner fa-spin"></i></div>;

  const si = summary?.status ? (BILLING_STATUS[summary.status] || BILLING_STATUS.IN_PROGRESS) : null;

  return (
    <div>
      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total déposé',   value: summary?.totalDeposited,   color: '#059669', bg: '#d1fae5', icon: 'fa-arrow-down' },
          { label: 'Total facturé TTC', value: summary?.totalInvoicedTTC, color: '#3b82f6', bg: '#dbeafe', icon: 'fa-file-invoice' },
          { label: 'Total alloué',   value: summary?.totalAllocated,   color: '#d97706', bg: '#fef3c7', icon: 'fa-link' },
          { label: 'Solde séquestre', value: summary?.trustBalance,    color: '#7c3aed', bg: '#ede9fe', icon: 'fa-vault' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}40`, borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: k.color, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              <i className={`fas ${k.icon}`} style={{ marginRight: '0.3rem' }}></i>{k.label}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: k.color }}>{fmt(k.value)}</div>
          </div>
        ))}
      </div>

      {/* ── Badge état ── */}
      {si && (
        <div style={{ background: si.bg, border: `1px solid ${si.color}50`, borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i className={`fas ${si.icon}`} style={{ color: si.color, fontSize: '1.2rem' }}></i>
          <div>
            <span style={{ fontWeight: 700, color: si.color }}>{si.label}</span>
            {summary?.status === 'REFUND_DUE' && (
              <span style={{ color: si.color, marginLeft: '0.5rem', fontSize: '0.85rem' }}>({fmt(summary.trustBalance)} à rembourser)</span>
            )}
            {summary?.status === 'PAYMENT_DUE' && (
              <span style={{ color: si.color, marginLeft: '0.5rem', fontSize: '0.85rem' }}>({fmt(summary.totalUnpaid)} de factures impayées)</span>
            )}
          </div>
          {summary?.status === 'REFUND_DUE' && (
            <button onClick={() => handleRefund(summary.trustBalance)} className="dd-btn" style={{ marginLeft: 'auto', color: '#d97706', borderColor: '#fcd34d', fontSize: '0.82rem' }}>
              <i className="fas fa-undo"></i> Rembourser {fmt(summary.trustBalance)}
            </button>
          )}
        </div>
      )}

      {/* ── Journal comptable ── */}
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
        Journal comptable
      </div>

      {ledger.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9aa3b4' }}>
          <i className="fas fa-book" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
          Aucun mouvement enregistré
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fc' }}>
              {['Date', 'Type', 'Description', 'Montant', 'Solde séquestre'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.78rem', borderBottom: '1px solid #e8ecf0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledger.map(e => {
              const ei = ENTRY_INFO[e.entryType] || ENTRY_INFO.INVOICE;
              const isPositive = e.entryType === 'DEPOSIT';
              const isNeutral  = e.entryType === 'INVOICE';
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#9aa3b4', fontSize: '0.78rem' }}>{fmtDate(e.createdAt)}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span style={{ background: ei.bg, color: ei.color, borderRadius: 20, padding: '0.1rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      <i className={`fas ${ei.icon}`} style={{ marginRight: '0.3rem' }}></i>{ei.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#374151', fontSize: '0.82rem' }}>{e.description}</td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: isNeutral ? '#6b7280' : isPositive ? '#059669' : '#ef4444' }}>
                    {isNeutral ? '' : isPositive ? '+' : '−'}{fmt(e.amount)}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#1a1f2e', fontFamily: 'monospace' }}>{fmt(e.runningBalance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
