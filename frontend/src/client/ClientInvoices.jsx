import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getClientInvoices, getClientPayments, downloadClientInvoicePdf, downloadClientReceiptPdf } from '../api';

const STATUS_INFO = {
  BROUILLON: { label: 'Brouillon',  color: '#6b7689', bg: '#f1f3f7' },
  EMISE:     { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  PAYEE:     { label: 'Payée',      color: '#10b981', bg: '#d1fae5' },
  EN_RETARD: { label: 'En retard',  color: '#ef4444', bg: '#fee2e2' },
  ANNULEE:   { label: 'Annulée',    color: '#9ca3af', bg: '#f3f4f6' },
};

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ClientInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices]   = useState([]);
  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('invoices');
  const [filterStatus, setFilter] = useState('');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    if (!user?.idu) return;
    Promise.all([getClientInvoices(user.idu), getClientPayments(user.idu)])
      .then(([invRes, payRes]) => {
        setInvoices(invRes.data);
        setPayments(payRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (!q || (inv.invoiceNumber || '').toLowerCase().includes(q) || (inv.caseNumber || '').toLowerCase().includes(q))
        && (!filterStatus || inv.status === filterStatus);
  });

  const totalDue = invoices
    .filter(i => i.status === 'EMISE' || i.status === 'EN_RETARD')
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const lastInvoice = invoices.length > 0 ? invoices[0] : null;

  const handleDownloadInvoice = inv => {
    downloadClientInvoicePdf(user.idu, inv.id)
      .then(r => downloadBlob(r.data, `${inv.invoiceNumber}.pdf`))
      .catch(() => alert('Erreur téléchargement PDF'));
  };

  const handleDownloadReceipt = pay => {
    downloadClientReceiptPdf(user.idu, pay.id)
      .then(r => downloadBlob(r.data, `recu-${pay.id}.pdf`))
      .catch(() => alert('Aucun reçu disponible pour ce paiement'));
  };

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e' }}>Mes Factures & Paiements</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7689', fontSize: '0.875rem' }}>Consultez vos factures et l'historique de vos paiements</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#9aa3b4', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solde actuel</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totalDue > 0 ? '#ef4444' : '#10b981' }}>
            {fmt(totalDue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9aa3b4', marginTop: '0.25rem' }}>Montant dû</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#9aa3b4', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dernière facture</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e' }}>
            {lastInvoice ? lastInvoice.invoiceNumber : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9aa3b4', marginTop: '0.25rem' }}>
            {lastInvoice ? fmtDate(lastInvoice.invoiceDate) : 'Aucune facture'}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#9aa3b4', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Factures payées</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {invoices.filter(i => i.status === 'PAYEE').length} / {invoices.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9aa3b4', marginTop: '0.25rem' }}>Total factures</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e8ecf0', marginBottom: '1.25rem' }}>
        {[{ key: 'invoices', label: 'Factures', icon: 'fa-file-invoice' }, { key: 'payments', label: 'Paiements', icon: 'fa-credit-card' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem', color: tab === t.key ? '#1a56db' : '#6b7689',
              borderBottom: tab === t.key ? '2px solid #1a56db' : '2px solid transparent',
              marginBottom: -2,
            }}>
            <i className={`fas ${t.icon}`} style={{ marginRight: '0.4rem' }}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Invoices tab */}
      {tab === 'invoices' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              style={{ flex: 1, minWidth: 180, padding: '0.4rem 0.75rem', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '0.875rem' }} />
            <select value={filterStatus} onChange={e => setFilter(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '0.875rem' }}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fc' }}>
                  {['N° Facture', 'Dossier', 'Date', 'Échéance', 'Total TTC', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', fontSize: '0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#9aa3b4' }}>Aucune facture trouvée</td></tr>
                ) : filteredInvoices.map(inv => {
                  const si = STATUS_INFO[inv.status] || STATUS_INFO.BROUILLON;
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f3f7' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1a1f2e' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7689' }}>{inv.caseNumber || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(inv.invoiceDate)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: inv.status === 'EN_RETARD' ? '#ef4444' : 'inherit' }}>
                        {fmtDate(inv.dueDate)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmt(inv.total)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: si.bg, color: si.color, borderRadius: 20, padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 600 }}>
                          {si.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button onClick={() => handleDownloadInvoice(inv)}
                          style={{ background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: 6, padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <i className="fas fa-download"></i> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Payments tab */}
      {tab === 'payments' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fc' }}>
                {['Date', 'Dossier', 'Montant', 'Méthode', 'Statut', 'Reçu'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', fontSize: '0.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#9aa3b4' }}>Aucun paiement trouvé</td></tr>
              ) : payments.map(pay => (
                <tr key={pay.id} style={{ borderBottom: '1px solid #f1f3f7' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(pay.payment_date)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7689' }}>{pay.case_number || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmt(pay.amount)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7689' }}>{pay.payment_method || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      background: pay.status === 'PAYE' ? '#d1fae5' : '#fef3c7',
                      color: pay.status === 'PAYE' ? '#10b981' : '#f59e0b',
                      borderRadius: 20, padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      {pay.status === 'PAYE' ? 'Payé' : 'Avance'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button onClick={() => handleDownloadReceipt(pay)}
                      style={{ background: '#dbeafe', color: '#1a56db', border: 'none', borderRadius: 6, padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <i className="fas fa-receipt"></i> Reçu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalDue > 0 && (
        <div style={{ marginTop: '1.5rem', background: '#fef3c7', border: '1px solid #e8d5a3', borderRadius: 12, padding: '1rem 1.25rem' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
            Vous avez {fmt(totalDue)} en attente de règlement
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: '#b45309' }}>
            Merci de contacter le cabinet pour effectuer votre paiement.
          </p>
        </div>
      )}
    </div>
  );
}
