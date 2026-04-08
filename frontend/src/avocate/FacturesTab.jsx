import { useState, useEffect, useCallback } from 'react';
import { getInvoicesByCase, getTrustAccount, createCaseInvoice, updateCaseInvoice, issueInvoice, voidCaseInvoice, deleteCaseInvoice, allocateFromTrust, resendInvoiceEmail } from '../api';

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const TYPE_OPTIONS = [
  { value: 'HONORAIRES',     label: 'Honoraires avocat' },
  { value: 'FRAIS_TRIBUNAL', label: 'Frais de tribunal' },
  { value: 'FRAIS_ADMIN',    label: 'Frais administratifs' },
  { value: 'AUTRE',          label: 'Autre' },
];

const STATUS_INFO = {
  DRAFT:   { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6' },
  ISSUED:  { label: 'Émise',     color: '#3b82f6', bg: '#dbeafe' },
  PARTIAL: { label: 'Partielle', color: '#d97706', bg: '#fef3c7' },
  PAID:    { label: 'Payée',     color: '#059669', bg: '#d1fae5' },
  VOID:    { label: 'Annulée',   color: '#ef4444', bg: '#fee2e2' },
};

const emptyLine = () => ({ description: '', quantity: '1', unitPrice: '', type: 'HONORAIRES' });

export default function FacturesTab({ caseId }) {
  const [invoices, setInvoices] = useState([]);
  const [trust, setTrust]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [allocModal, setAllocModal] = useState(null);
  const [allocAmount, setAllocAmount] = useState('');
  const [form, setForm] = useState({ lines: [emptyLine()], dueDate: '', notes: '' });

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

  const totalHT  = invoices.filter(i => i.status !== 'VOID').reduce((s,i) => s + Number(i.amountHT  || 0), 0);
  const totalTTC = invoices.filter(i => i.status !== 'VOID').reduce((s,i) => s + Number(i.amountTTC || 0), 0);
  const totalDue = invoices.filter(i => ['ISSUED','PARTIAL'].includes(i.status)).reduce((s,i) => s + Number(i.amountDue || 0), 0);

  const calcHT  = form.lines.reduce((s,l) => s + (parseFloat(l.quantity)||0)*(parseFloat(l.unitPrice)||0), 0);
  const calcTVA = calcHT * 0.19;
  const calcTTC = calcHT + calcTVA;

  const openCreate = () => { setEditInvoice(null); setForm({ lines: [emptyLine()], dueDate: '', notes: '' }); setShowForm(true); };
  const openEdit   = inv  => {
    setEditInvoice(inv);
    setForm({
      lines: (inv.lines || []).map(l => ({ description: l.description, quantity: String(l.quantity), unitPrice: String(l.unitPrice), type: l.type || 'HONORAIRES' })),
      dueDate: inv.dueDate || '',
      notes: inv.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.lines.some(l => !l.description || !l.unitPrice)) return alert('Remplissez toutes les lignes');
    setSaving(true);
    try {
      const payload = {
        lines: form.lines.map((l, i) => ({
          description: l.description,
          quantity: parseFloat(l.quantity) || 1,
          unitPrice: parseFloat(l.unitPrice),
          type: l.type,
          sortOrder: i,
        })),
        dueDate: form.dueDate || null,
        notes: form.notes || null,
      };
      if (editInvoice) {
        await updateCaseInvoice(caseId, editInvoice.id, payload);
      } else {
        await createCaseInvoice(caseId, payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleIssue = async id => {
    if (!window.confirm('Émettre cette facture ? Elle sera verrouillée et un email sera envoyé au client.')) return;
    try { await issueInvoice(caseId, id); load(); } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleVoid = async id => {
    if (!window.confirm('Annuler cette facture ?')) return;
    try { await voidCaseInvoice(caseId, id); load(); } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Supprimer ce brouillon ?')) return;
    try { await deleteCaseInvoice(caseId, id); load(); } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const openAlloc = inv => {
    const trustBalance = trust ? Number(trust.balance || 0) : 0;
    const due = Number(inv.amountDue || 0);
    setAllocAmount(String(Math.min(trustBalance, due).toFixed(3)));
    setAllocModal(inv);
  };

  const handleAllocate = async () => {
    try {
      await allocateFromTrust(caseId, allocModal.id, { amount: parseFloat(allocAmount) });
      setAllocModal(null);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleResend = async id => {
    try { await resendInvoiceEmail(id); alert('Email renvoyé'); } catch { alert('Erreur envoi email'); }
  };

  const updateLine = (idx, field, val) => setForm(f => ({
    ...f, lines: f.lines.map((l,i) => i===idx ? {...l, [field]: val} : l)
  }));
  const addLine    = () => setForm(f => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = idx => setForm(f => ({ ...f, lines: f.lines.filter((_,i) => i!==idx) }));

  const inp = { padding: '0.45rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box', width: '100%' };
  const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#9aa3b4' }}><i className="fas fa-spinner fa-spin"></i></div>;

  return (
    <div>
      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.3rem' }}><i className="fas fa-file-invoice" style={{ marginRight: '0.3rem' }}></i>Total HT</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e40af' }}>{fmt(totalHT)}</div>
        </div>
        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '0.3rem' }}><i className="fas fa-receipt" style={{ marginRight: '0.3rem' }}></i>Total TTC</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6d28d9' }}>{fmt(totalTTC)}</div>
        </div>
        <div style={{ background: totalDue>0 ? '#fff7ed':'#f0fdf4', border: `1px solid ${totalDue>0?'#fed7aa':'#bbf7d0'}`, borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: totalDue>0?'#d97706':'#059669', textTransform: 'uppercase', marginBottom: '0.3rem' }}><i className={`fas ${totalDue>0?'fa-exclamation-circle':'fa-check-circle'}`} style={{ marginRight: '0.3rem' }}></i>Reste dû</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: totalDue>0?'#b45309':'#15803d' }}>{fmt(totalDue)}</div>
        </div>
      </div>

      {/* ── Bouton + formulaire ── */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="dd-btn dd-btn-primary" onClick={showForm ? () => setShowForm(false) : openCreate}>
          <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i> {showForm ? 'Fermer' : 'Nouvelle facture'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8f9fc', borderRadius: 10, padding: '1.25rem', border: '1px solid #e8ecf0', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: '1rem' }}>
            {editInvoice ? `Modifier le brouillon` : 'Nouvelle facture (brouillon)'}
          </div>

          {/* Lignes */}
          {form.lines.map((line, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.8fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
              <div>
                {idx === 0 && <label style={lbl}>Description *</label>}
                <input required value={line.description} onChange={e => updateLine(idx,'description',e.target.value)} placeholder="Ex: Consultation 2h" style={inp} />
              </div>
              <div>
                {idx === 0 && <label style={lbl}>Heures</label>}
                <input type="number" min="1" step="1" value={line.quantity} onChange={e => updateLine(idx,'quantity',e.target.value)} style={inp} />
              </div>
              <div>
                {idx === 0 && <label style={lbl}>Tarif/H (DT) *</label>}
                <input required type="number" min="0" step="0.001" value={line.unitPrice} onChange={e => updateLine(idx,'unitPrice',e.target.value)} placeholder="0.000" style={inp} />
              </div>
              <div>
                {idx === 0 && <label style={lbl}>Type</label>}
                <select value={line.type} onChange={e => updateLine(idx,'type',e.target.value)} style={inp}>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                {idx === 0 && <div style={{ height: '1.2rem' }}></div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                    {fmt((parseFloat(line.quantity)||0)*(parseFloat(line.unitPrice)||0))}
                  </span>
                  {form.lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 4, padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addLine} style={{ background: 'none', border: '1px dashed #93c5fd', color: '#3b82f6', borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <i className="fas fa-plus"></i> Ajouter une ligne
          </button>

          {/* Totaux */}
          <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', textAlign: 'right' }}>
            <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Sous-total HT : <strong>{fmt(calcHT)}</strong></div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>TVA 19% : <strong>{fmt(calcTVA)}</strong></div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e40af', marginTop: '0.25rem' }}>Total TTC : {fmt(calcTTC)}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Date limite (optionnel)</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} style={inp} />
            </div>
            <div>
              <label style={lbl}>Notes (optionnel)</label>
              <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={inp} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="dd-btn dd-btn-primary">
            {saving ? 'Enregistrement...' : <><i className="fas fa-save"></i> {editInvoice ? 'Mettre à jour' : 'Créer le brouillon'}</>}
          </button>
        </form>
      )}

      {/* ── Liste factures ── */}
      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9aa3b4' }}>
          <i className="fas fa-file-invoice" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
          Aucune facture pour ce dossier
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {invoices.map(inv => {
            const si = STATUS_INFO[inv.status] || STATUS_INFO.DRAFT;
            return (
              <div key={inv.id} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#1a56db', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber || `BROUILLON #${inv.id}`}
                      </span>
                      <span style={{ background: si.bg, color: si.color, borderRadius: 20, padding: '0.1rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>{si.label}</span>
                      {inv.issuedDate && <span style={{ fontSize: '0.75rem', color: '#9aa3b4' }}>Émise le {fmtDate(inv.issuedDate)}</span>}
                      {inv.dueDate    && <span style={{ fontSize: '0.75rem', color: '#9aa3b4' }}>Échéance {fmtDate(inv.dueDate)}</span>}
                    </div>
                    {inv.lines?.length > 0 && (
                      <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.3rem' }}>
                        {inv.lines.map((l,i) => <span key={i} style={{ marginRight: '1rem' }}>{l.description} ({fmt(l.lineTotal)})</span>)}
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                      <span style={{ marginRight: '1rem' }}>HT : {fmt(inv.amountHT)}</span>
                      <span style={{ marginRight: '1rem' }}>TVA : {fmt(inv.amountTVA)}</span>
                      <strong>TTC : {fmt(inv.amountTTC)}</strong>
                      {Number(inv.amountPaid) > 0 && <span style={{ marginLeft: '1rem', color: '#059669' }}>Payé : {fmt(inv.amountPaid)}</span>}
                      {Number(inv.amountDue) > 0  && <span style={{ marginLeft: '0.5rem', color: '#d97706', fontWeight: 700 }}>Reste : {fmt(inv.amountDue)}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {inv.status === 'DRAFT' && <>
                      <button onClick={() => openEdit(inv)} title="Modifier"
                        style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleIssue(inv.id)} title="Émettre"
                        style={{ background: '#dbeafe', color: '#1a56db', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                        <i className="fas fa-paper-plane"></i> Émettre
                      </button>
                      <button onClick={() => handleDelete(inv.id)} title="Supprimer"
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </>}
                    {(inv.status === 'ISSUED' || inv.status === 'PARTIAL') && <>
                      <button onClick={() => openAlloc(inv)} title="Allouer du séquestre"
                        style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                        <i className="fas fa-link"></i> Allouer
                      </button>
                      <button onClick={() => handleResend(inv.id)} title="Renvoyer email"
                        style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <i className="fas fa-paper-plane"></i>
                      </button>
                      <button onClick={() => handleVoid(inv.id)} title="Annuler"
                        style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                        <i className="fas fa-ban"></i> Annuler
                      </button>
                    </>}
                    {inv.status === 'PAID' && (
                      <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, padding: '0.3rem 0.5rem' }}>
                        <i className="fas fa-check-circle"></i> Soldée
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal allocation ── */}
      {allocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', fontWeight: 700, color: '#1a1f2e' }}>Allouer depuis le séquestre</h3>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ color: '#6b7280' }}>Solde séquestre : <strong style={{ color: '#059669' }}>{fmt(trust?.balance)}</strong></div>
              <div style={{ color: '#6b7280' }}>Reste dû sur facture : <strong style={{ color: '#d97706' }}>{fmt(allocModal.amountDue)}</strong></div>
            </div>
            <label style={lbl}>Montant à allouer (DT) *</label>
            <input type="number" step="0.001" min="0.001" value={allocAmount}
              onChange={e => setAllocAmount(e.target.value)}
              style={{ ...inp, marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700, textAlign: 'right' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="dd-btn dd-btn-primary" onClick={handleAllocate} style={{ flex: 1 }}>
                <i className="fas fa-check"></i> Confirmer l'allocation
              </button>
              <button className="dd-btn" onClick={() => setAllocModal(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
