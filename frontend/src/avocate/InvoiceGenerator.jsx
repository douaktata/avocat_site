import { useState, useEffect } from 'react';
import { getTimesheetInvoiceLines, getProvisionsByCase, createInvoice, addInvoiceLine, updateInvoice } from '../api';

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';

export default function InvoiceGenerator({ caseId, clientId, onClose, onCreated }) {
  const [lines, setLines] = useState([]);
  const [provisions, setProvisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxRate] = useState(0.19);

  useEffect(() => {
    Promise.all([
      getTimesheetInvoiceLines(caseId),
      getProvisionsByCase(caseId),
    ])
      .then(([linesRes, provRes]) => {
        setLines(linesRes.data.map(l => ({ ...l, included: true })));
        setProvisions(provRes.data.filter(p => p.status === 'RECUE'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  const subtotalHT = lines
    .filter(l => l.included)
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  const taxAmount = subtotalHT * taxRate;
  const totalTTC = subtotalHT + taxAmount;
  const totalProvisions = provisions.reduce((s, p) => s + Number(p.amount || 0), 0);
  const balanceDue = Math.max(0, totalTTC - totalProvisions);

  const handleGenerate = async () => {
    if (lines.filter(l => l.included).length === 0) return alert('Aucune ligne sélectionnée');
    setSaving(true);
    try {
      // 1. Créer la facture
      const invRes = await createInvoice({
        client: { idu: parseInt(clientId) },
        caseEntity: { idc: parseInt(caseId) },
        provisionsApplied: totalProvisions,
      });
      const invoiceId = invRes.data.id;

      // 2. Ajouter les lignes
      for (const line of lines.filter(l => l.included)) {
        await addInvoiceLine(invoiceId, {
          description: line.description,
          category: line.category,
          hours: Number(line.totalHours),
          hourlyRate: Number(line.hourlyRate),
        });
      }

      // 3. Passer en EMISE
      await updateInvoice(invoiceId, { status: 'EMISE', provisionsApplied: totalProvisions });

      onCreated && onCreated(invRes.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la génération');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2rem' }}>Chargement...</div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: 640, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e' }}>
            <i className="fas fa-file-invoice" style={{ marginRight: '0.5rem', color: '#1a56db' }}></i>
            Générer la facture finale
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9aa3b4' }}>×</button>
        </div>

        {/* Lignes depuis timesheets */}
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4a5568', marginBottom: '0.75rem' }}>
          Travail effectué (depuis feuilles de temps)
        </h3>
        {lines.length === 0 ? (
          <p style={{ color: '#9aa3b4', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Aucune feuille de temps enregistrée. Ajoutez des prestations d'abord.
          </p>
        ) : (
          <div style={{ border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fc' }}>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4a5568', width: 32 }}></th>
                  {['Description', 'Heures', 'Taux/H', 'Montant HT'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4a5568' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f3f7', opacity: l.included ? 1 : 0.4 }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <input type="checkbox" checked={l.included}
                        onChange={e => setLines(prev => prev.map((x, j) => j === i ? { ...x, included: e.target.checked } : x))} />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{l.description}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{Number(l.totalHours).toFixed(2)}h</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{l.hourlyRate} TND</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{fmt(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Résumé financier */}
        <div style={{ background: '#f8f9fc', borderRadius: 10, padding: '1rem', border: '1px solid #e8ecf0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#6b7689' }}>
            <span>Sous-total HT</span><span>{fmt(subtotalHT)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#6b7689' }}>
            <span>TVA (19%)</span><span>{fmt(taxAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 700, color: '#1a1f2e' }}>
            <span>Total TTC</span><span>{fmt(totalTTC)}</span>
          </div>
          {totalProvisions > 0 && (
            <>
              <div style={{ borderTop: '1px solid #e8ecf0', margin: '0.5rem 0' }}></div>
              {provisions.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#10b981' }}>
                  <span><i className="fas fa-minus-circle" style={{ marginRight: '0.3rem' }}></i>Provision reçue ({p.provisionNumber})</span>
                  <span>- {fmt(p.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#dbeafe', borderRadius: 8, fontWeight: 700, fontSize: '1rem', color: '#1a56db' }}>
                <span>SOLDE À PAYER</span><span>{fmt(balanceDue)}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose}
            style={{ padding: '0.6rem 1.25rem', border: '1px solid #e8ecf0', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleGenerate} disabled={saving || lines.filter(l => l.included).length === 0}
            style={{ padding: '0.6rem 1.5rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className="fas fa-file-invoice"></i> {saving ? 'Génération...' : 'Générer & Émettre'}
          </button>
        </div>
      </div>
    </div>
  );
}
