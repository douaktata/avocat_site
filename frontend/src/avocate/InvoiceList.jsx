import { useState, useEffect } from 'react';
import { getInvoices, deleteInvoice, downloadInvoicePdf, resendInvoiceEmail, cancelInvoice } from '../api';
import InvoiceDetail from './InvoiceDetail';

const STATUS_INFO = {
  DRAFT:   { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6' },
  ISSUED:  { label: 'Émise',     color: '#3b82f6', bg: '#dbeafe' },
  PARTIAL: { label: 'Partielle', color: '#d97706', bg: '#fef3c7' },
  PAID:    { label: 'Payée',     color: '#10b981', bg: '#d1fae5' },
  VOID:    { label: 'Annulée',   color: '#9ca3af', bg: '#f3f4f6' },
};

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function InvoiceList() {
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('');
  const [selected, setSelected]   = useState(null);
  const [sending, setSending]     = useState(null);

  useEffect(() => {
    getInvoices()
      .then(res => setInvoices(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (!q || (inv.invoiceNumber || '').toLowerCase().includes(q)
                || (inv.clientFullName || '').toLowerCase().includes(q)
                || (inv.caseNumber || '').toLowerCase().includes(q))
        && (!filterStatus || inv.status === filterStatus);
  });

  const stats = {
    total:   invoices.length,
    emises:  invoices.filter(i => i.status === 'ISSUED').length,
    payees:  invoices.filter(i => i.status === 'PAID').length,
    retard:  invoices.filter(i => i.status === 'PARTIAL').length,
    montant: invoices.reduce((s, i) => s + Number(i.amountTTC || 0), 0),
  };

  const handleDelete = id => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    deleteInvoice(id)
      .then(() => setInvoices(prev => prev.filter(i => i.id !== id)))
      .catch(() => alert('Erreur'));
  };

  const handleDownloadPdf = inv => {
    downloadInvoicePdf(inv.id)
      .then(res => downloadBlob(res.data, `${inv.invoiceNumber}.pdf`))
      .catch(() => alert('Erreur génération PDF'));
  };

  const handleCancel = id => {
    if (!window.confirm('Annuler cette facture ?')) return;
    cancelInvoice(id)
      .then(() => setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'CANCELLED' } : i)))
      .catch(() => alert('Erreur'));
  };

  const handleResendEmail = inv => {
    setSending(inv.id);
    resendInvoiceEmail(inv.id)
      .then(() => alert(`Email renvoyé à ${inv.clientFullName || 'client'}`))
      .catch(() => alert('Erreur lors de l\'envoi'))
      .finally(() => setSending(null));
  };

  if (selected) {
    return (
      <InvoiceDetail
        invoiceId={selected.id}
        onBack={() => {
          setSelected(null);
          getInvoices().then(r => setInvoices(r.data));
        }}
      />
    );
  }

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e' }}>Factures</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7689', fontSize: '0.875rem' }}>Gestion des factures clients</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: stats.total, icon: 'fa-file-invoice', color: '#3b82f6' },
          { label: 'Émises', value: stats.emises, icon: 'fa-paper-plane', color: '#8b5cf6' },
          { label: 'Payées', value: stats.payees, icon: 'fa-check-circle', color: '#10b981' },
          { label: 'En retard', value: stats.retard, icon: 'fa-exclamation-circle', color: '#ef4444' },
          { label: 'Montant total', value: fmt(stats.montant), icon: 'fa-coins', color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} style={{
            background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem',
            border: '1px solid #e8ecf0', display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px', background: k.color + '1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, fontSize: '1rem',
            }}>
              <i className={`fas ${k.icon}`}></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1f2e' }}>{k.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#9aa3b4' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9aa3b4' }}></i>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Numéro, client, dossier..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 10, height: 36, border: '1px solid #e8ecf0', borderRadius: 8, outline: 'none', fontSize: '0.875rem', boxSizing: 'border-box' }}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilter(e.target.value)}
          style={{ height: 36, border: '1px solid #e8ecf0', borderRadius: 8, padding: '0 0.75rem', fontSize: '0.875rem' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #e8ecf0' }}>
              {['N° Facture', 'Client', 'Dossier', 'Date', 'Échéance', 'Total TTC', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#9aa3b4' }}>Aucune facture</td></tr>
            ) : filtered.map(inv => {
              const si = STATUS_INFO[inv.status] || { label: inv.status, color: '#6b7280', bg: '#f3f4f6' };
              return (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f3f7' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1a56db', cursor: 'pointer' }} onClick={() => setSelected(inv)}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{inv.clientFullName || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7689' }}>{inv.caseNumber || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(inv.invoiceDate)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(inv.dueDate)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmt(inv.amountTTC)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: si.bg, color: si.color, borderRadius: 20, padding: '0.2rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      {si.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setSelected(inv)} title="Détails"
                        style={{ background: '#dbeafe', color: '#1a56db', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer' }}>
                        <i className="fas fa-eye"></i>
                      </button>
                      <button onClick={() => handleDownloadPdf(inv)} title="PDF"
                        style={{ background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer' }}>
                        <i className="fas fa-file-pdf"></i>
                      </button>
                      <button onClick={() => handleResendEmail(inv)} disabled={sending === inv.id} title="Envoyer email"
                        style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer' }}>
                        <i className={`fas ${sending === inv.id ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                      </button>
                      {(inv.status === 'ISSUED' || inv.status === 'PARTIAL') && (
                        <button onClick={() => handleCancel(inv.id)} title="Annuler"
                          style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                          <i className="fas fa-ban"></i> Annuler
                        </button>
                      )}
                      <button onClick={() => handleDelete(inv.id)} title="Supprimer"
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
