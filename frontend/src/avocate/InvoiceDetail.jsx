import { useState, useEffect } from 'react';
import {
  getInvoice, addInvoiceLine, updateInvoiceLine, deleteInvoiceLine,
  downloadInvoicePdf,
} from '../api';

const TYPE_OPTIONS = [
  { value: 'HONORAIRES',     label: 'Honoraires avocat' },
  { value: 'FRAIS_TRIBUNAL', label: 'Frais de tribunal' },
  { value: 'FRAIS_ADMIN',    label: 'Frais administratifs' },
  { value: 'AUTRE',          label: 'Autre' },
];

const STATUS_INFO = {
  DRAFT:   { label: 'Brouillon', color: '#6b7280' },
  ISSUED:  { label: 'Émise',     color: '#3b82f6' },
  PARTIAL: { label: 'Partielle', color: '#d97706' },
  PAID:    { label: 'Payée',     color: '#10b981' },
  VOID:    { label: 'Annulée',   color: '#9ca3af' },
};

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' DT';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const emptyLine = { description: '', type: 'HONORAIRES', quantity: '1', unitPrice: '', notes: '' };

export default function InvoiceDetail({ invoiceId, onBack }) {
  const [invoice, setInvoice]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [lineForm, setLineForm]   = useState(emptyLine);
  const [editingLine, setEditing] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [savingLine, setSavingLine] = useState(false);

  const load = () => {
    setLoading(true);
    getInvoice(invoiceId)
      .then(r => setInvoice(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [invoiceId]);

  const handleSaveLine = e => {
    e.preventDefault();
    setSavingLine(true);
    const payload = {
      description: lineForm.description,
      type: lineForm.type,
      quantity: parseFloat(lineForm.quantity) || 1,
      unitPrice: parseFloat(lineForm.unitPrice) || 0,
      notes: lineForm.notes,
    };
    const req = editingLine
      ? updateInvoiceLine(invoiceId, editingLine.id, payload)
      : addInvoiceLine(invoiceId, payload);

    req.then(() => { load(); setShowForm(false); setLineForm(emptyLine); setEditing(null); })
       .catch(err => alert(err.response?.data?.message || 'Erreur'))
       .finally(() => setSavingLine(false));
  };

  const handleDeleteLine = lineId => {
    if (!window.confirm('Supprimer cette ligne ?')) return;
    deleteInvoiceLine(invoiceId, lineId).then(load).catch(() => alert('Erreur'));
  };

  const handleEditLine = line => {
    setEditing(line);
    setLineForm({
      description: line.description,
      type: line.type || 'HONORAIRES',
      quantity: String(line.quantity || 1),
      unitPrice: String(line.unitPrice || ''),
      notes: line.notes || '',
    });
    setShowForm(true);
  };

  const handleDownloadPdf = () => {
    downloadInvoicePdf(invoiceId)
      .then(res => downloadBlob(res.data, `${invoice.invoiceNumber}.pdf`))
      .catch(() => alert('Erreur génération PDF'));
  };

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!invoice) return <div style={{ padding: '2rem' }}>Facture introuvable</div>;

  const si = STATUS_INFO[invoice.status] || { label: invoice.status, color: '#6b7280' };
  const lines = invoice.lines || [];
  const lineSubtotal = (parseFloat(lineForm.quantity) || 0) * (parseFloat(lineForm.unitPrice) || 0);

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack}
          style={{ background: 'none', border: '1px solid #e8ecf0', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', color: '#6b7689' }}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1a1f2e' }}>{invoice.invoiceNumber || '(Brouillon)'}</h1>
          <p style={{ margin: '0.2rem 0 0', color: '#6b7689', fontSize: '0.85rem' }}>
            {invoice.clientFullName} &nbsp;·&nbsp; {invoice.caseNumber || 'Sans dossier'}
          </p>
        </div>
        <span style={{ background: si.color + '22', color: si.color, borderRadius: 20, padding: '0.3rem 0.9rem', fontWeight: 700, fontSize: '0.875rem' }}>
          {si.label}
        </span>
        <button onClick={handleDownloadPdf}
          style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
          <i className="fas fa-file-pdf"></i> PDF
        </button>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Date de facturation', value: fmtDate(invoice.invoiceDate) },
          { label: "Date d'échéance",    value: fmtDate(invoice.dueDate) },
          { label: 'TVA',                value: ((invoice.taxRate || 0.19) * 100).toFixed(0) + '%' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#9aa3b4', marginBottom: '0.3rem' }}>{c.label}</div>
            <div style={{ fontWeight: 700, color: '#1a1f2e' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f3f7' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Lignes de facturation</h3>
          {invoice.status === 'DRAFT' && (
            <button onClick={() => { setEditing(null); setLineForm(emptyLine); setShowForm(true); }}
              style={{ background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
              <i className="fas fa-plus"></i> Ajouter
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSaveLine} style={{ padding: '1rem 1.25rem', background: '#f8f9fc', borderBottom: '1px solid #e8ecf0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7689' }}>Description *</label>
                <input required value={lineForm.description} onChange={e => setLineForm({ ...lineForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7689' }}>Type</label>
                <select value={lineForm.type} onChange={e => setLineForm({ ...lineForm, type: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem' }}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7689' }}>Heures</label>
                <input type="number" step="1" min="0" value={lineForm.quantity} onChange={e => setLineForm({ ...lineForm, quantity: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7689' }}>Tarif/H (DT)</label>
                <input type="number" step="0.001" min="0" value={lineForm.unitPrice} onChange={e => setLineForm({ ...lineForm, unitPrice: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.875rem', paddingBottom: '0.2rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', display: 'block' }}>Sous-total</label>
                {fmt(lineSubtotal)}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="submit" disabled={savingLine}
                  style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  {savingLine ? '...' : <i className="fas fa-check"></i>}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setLineForm(emptyLine); }}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </form>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fc' }}>
              {['Description', 'Type', 'Heures', 'Tarif/H', 'Sous-total', ''].map(h => (
                <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', fontSize: '0.8rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#9aa3b4' }}>Aucune ligne</td></tr>
            ) : lines.map(line => (
              <tr key={line.id} style={{ borderTop: '1px solid #f1f3f7' }}>
                <td style={{ padding: '0.6rem 1rem' }}>{line.description}</td>
                <td style={{ padding: '0.6rem 1rem', color: '#6b7689', fontSize: '0.8rem' }}>{TYPE_OPTIONS.find(o => o.value === line.type)?.label || line.type}</td>
                <td style={{ padding: '0.6rem 1rem' }}>{line.quantity}</td>
                <td style={{ padding: '0.6rem 1rem' }}>{fmt(line.unitPrice)}</td>
                <td style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>{fmt(line.lineTotal)}</td>
                <td style={{ padding: '0.6rem 1rem' }}>
                  {invoice.status === 'DRAFT' && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => handleEditLine(line)} style={{ background: '#dbeafe', color: '#1a56db', border: 'none', borderRadius: 5, padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
                        <i className="fas fa-pen"></i>
                      </button>
                      <button onClick={() => handleDeleteLine(line.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 5, padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1.25rem', minWidth: 280 }}>
          {[
            { label: 'Sous-total HT', value: fmt(invoice.amountHT) },
            { label: `TVA (${((invoice.taxRate || 0.19) * 100).toFixed(0)}%)`, value: fmt(invoice.amountTVA) },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7689' }}>
              <span>{r.label}</span><span>{r.value}</span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #1a56db', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#1a1f2e' }}>
            <span>TOTAL TTC</span><span style={{ color: '#1a56db' }}>{fmt(invoice.amountTTC)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem', color: '#059669' }}>
              <span>Déjà alloué</span><span>{fmt(invoice.amountPaid)}</span>
            </div>
          )}
          {invoice.amountDue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>
              <span>Reste dû</span><span>{fmt(invoice.amountDue)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
