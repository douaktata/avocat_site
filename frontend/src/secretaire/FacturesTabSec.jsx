import { useState, useEffect, useCallback } from 'react';
import { getInvoicesByCase, getTrustAccount, allocateFromTrust } from '../api';

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const STATUS_INFO = {
  DRAFT:   { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6' },
  ISSUED:  { label: 'Émise',     color: '#3b82f6', bg: '#dbeafe' },
  PARTIAL: { label: 'Partielle', color: '#d97706', bg: '#fef3c7' },
  PAID:    { label: 'Payée',     color: '#059669', bg: '#d1fae5' },
  VOID:    { label: 'Annulée',   color: '#ef4444', bg: '#fee2e2' },
};

export default function FacturesTabSec({ caseId }) {
  const [invoices,     setInvoices]     = useState([]);
  const [trust,        setTrust]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [allocModal,   setAllocModal]   = useState(null); // invoice or null
  const [allocAmount,  setAllocAmount]  = useState('');
  const [allocating,   setAllocating]   = useState(false);

  const load = useCallback(() => {
    Promise.all([
      getInvoicesByCase(caseId).catch(() => ({ data: [] })),
      getTrustAccount(caseId).catch(() => ({ data: null })),
    ]).then(([invRes, trustRes]) => {
      setInvoices(invRes.data || []);
      setTrust(trustRes.data);
    }).finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  const openAlloc = inv => {
    const trustBalance = trust ? Number(trust.balance || 0) : 0;
    const due = Number(inv.amountDue || 0);
    setAllocAmount(String(Math.min(trustBalance, due).toFixed(3)));
    setAllocModal(inv);
  };

  const handleAllocate = async () => {
    if (!allocModal || !allocAmount) return;
    setAllocating(true);
    try {
      await allocateFromTrust(caseId, allocModal.id, { amount: parseFloat(allocAmount) });
      setAllocModal(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'allocation');
    } finally {
      setAllocating(false);
    }
  };

  const active   = invoices.filter(i => i.status !== 'VOID');
  const totalHT  = active.reduce((s, i) => s + Number(i.amountHT  || 0), 0);
  const totalTTC = active.reduce((s, i) => s + Number(i.amountTTC || 0), 0);
  const totalDue = invoices.filter(i => ['ISSUED', 'PARTIAL'].includes(i.status))
                           .reduce((s, i) => s + Number(i.amountDue || 0), 0);
  const trustBalance = trust ? Number(trust.balance || 0) : 0;

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#9aa3b4' }}>
      <i className="fas fa-spinner fa-spin"></i>
    </div>
  );

  return (
    <div>
      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            <i className="fas fa-file-invoice" style={{ marginRight: '0.3rem' }}></i>Total HT
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e40af' }}>{fmt(totalHT)}</div>
        </div>
        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            <i className="fas fa-receipt" style={{ marginRight: '0.3rem' }}></i>Total TTC
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6d28d9' }}>{fmt(totalTTC)}</div>
        </div>
        <div style={{ background: totalDue > 0 ? '#fff7ed' : '#f0fdf4', border: `1px solid ${totalDue > 0 ? '#fed7aa' : '#bbf7d0'}`, borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: totalDue > 0 ? '#d97706' : '#059669', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            <i className={`fas ${totalDue > 0 ? 'fa-exclamation-circle' : 'fa-check-circle'}`} style={{ marginRight: '0.3rem' }}></i>Reste dû
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: totalDue > 0 ? '#b45309' : '#15803d' }}>{fmt(totalDue)}</div>
        </div>
      </div>

      {/* ── Solde séquestre dispo ── */}
      {trust && trustBalance > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#065f46' }}>
          <i className="fas fa-vault"></i>
          <span>Séquestre disponible : <strong>{fmt(trustBalance)}</strong> — vous pouvez allouer ces fonds aux factures impayées.</span>
        </div>
      )}

      {/* ── Notice lecture seule (création) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef9ee', border: '1px solid #fde68a', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#92400e' }}>
        <i className="fas fa-lock"></i>
        <span>La création et l'émission des factures sont réservées à l'avocat. Vous pouvez allouer des fonds du séquestre aux factures impayées.</span>
      </div>

      {/* ── Liste factures ── */}
      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9aa3b4' }}>
          <i className="fas fa-file-invoice" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block' }}></i>
          Aucune facture pour ce dossier
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {invoices.map(inv => {
            const si = STATUS_INFO[inv.status] || STATUS_INFO.DRAFT;
            const canAlloc = ['ISSUED', 'PARTIAL'].includes(inv.status) && trustBalance > 0 && Number(inv.amountDue || 0) > 0;
            return (
              <div key={inv.id} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#1a56db', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber || `BROUILLON #${inv.id}`}
                      </span>
                      <span style={{ background: si.bg, color: si.color, borderRadius: 20, padding: '0.1rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>
                        {si.label}
                      </span>
                      {inv.issuedDate && (
                        <span style={{ fontSize: '0.75rem', color: '#9aa3b4' }}>Émise le {fmtDate(inv.issuedDate)}</span>
                      )}
                      {inv.dueDate && (
                        <span style={{ fontSize: '0.75rem', color: '#9aa3b4' }}>Échéance {fmtDate(inv.dueDate)}</span>
                      )}
                    </div>

                    {inv.lines?.length > 0 && (
                      <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.3rem' }}>
                        {inv.lines.map((l, i) => (
                          <span key={i} style={{ marginRight: '1rem' }}>{l.description} ({fmt(l.lineTotal)})</span>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                      <span style={{ marginRight: '1rem' }}>HT : {fmt(inv.amountHT)}</span>
                      <span style={{ marginRight: '1rem' }}>TVA : {fmt(inv.amountTVA)}</span>
                      <strong>TTC : {fmt(inv.amountTTC)}</strong>
                      {Number(inv.amountPaid) > 0 && (
                        <span style={{ marginLeft: '1rem', color: '#059669' }}>Payé : {fmt(inv.amountPaid)}</span>
                      )}
                      {Number(inv.amountDue) > 0 && (
                        <span style={{ marginLeft: '0.5rem', color: '#d97706', fontWeight: 700 }}>Reste : {fmt(inv.amountDue)}</span>
                      )}
                    </div>

                    {inv.notes && (
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.3rem', fontStyle: 'italic' }}>
                        {inv.notes}
                      </div>
                    )}
                  </div>

                  {/* Bouton allocation */}
                  {canAlloc && (
                    <button
                      onClick={() => openAlloc(inv)}
                      style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: 7, padding: '0.35rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <i className="fas fa-vault"></i> Allouer séquestre
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal allocation ── */}
      {allocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setAllocModal(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '1.75rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.3rem 0', color: '#1e3a8a', fontSize: '1rem' }}>
              <i className="fas fa-vault" style={{ marginRight: '0.5rem', color: '#059669' }}></i>
              Allouer depuis le séquestre
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 1.25rem 0' }}>
              Facture <strong style={{ fontFamily: 'monospace' }}>{allocModal.invoiceNumber || `#${allocModal.id}`}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Solde séquestre</div>
                <div style={{ fontWeight: 800, color: '#15803d' }}>{fmt(trustBalance)}</div>
              </div>
              <div style={{ background: '#fff7ed', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Reste à payer</div>
                <div style={{ fontWeight: 800, color: '#b45309' }}>{fmt(allocModal.amountDue)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                Montant à allouer (DT) *
              </label>
              <input
                type="number" step="0.001" min="0.001"
                max={Math.min(trustBalance, Number(allocModal.amountDue || 0))}
                value={allocAmount}
                onChange={e => setAllocAmount(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setAllocModal(null)}
                style={{ padding: '0.5rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem' }}>
                Annuler
              </button>
              <button onClick={handleAllocate} disabled={allocating || !allocAmount}
                style={{ padding: '0.5rem 1.2rem', border: 'none', borderRadius: 8, background: '#059669', color: '#fff', cursor: allocating ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: allocating ? 0.7 : 1 }}>
                {allocating
                  ? <><i className="fas fa-spinner fa-spin"></i> En cours...</>
                  : <><i className="fas fa-check"></i> Confirmer</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
