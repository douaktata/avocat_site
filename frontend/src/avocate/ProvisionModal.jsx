import { useState } from 'react';
import { createProvision, markProvisionReceived, deleteProvision } from '../api';

const STATUS_INFO = {
  DEMANDEE:           { label: 'Demandée',       color: '#6b7689', bg: '#f1f3f7' },
  EN_ATTENTE_PAIEMENT:{ label: 'En attente',      color: '#f59e0b', bg: '#fef3c7' },
  RECUE:              { label: 'Reçue',           color: '#10b981', bg: '#d1fae5' },
  APPLIQUEE:          { label: 'Appliquée',       color: '#3b82f6', bg: '#dbeafe' },
  REMBOURSEE:         { label: 'Remboursée',      color: '#9ca3af', bg: '#f3f4f6' },
};

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function ProvisionModal({ caseId, clientId, provisions, onRefresh, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', termsText: '', type: 'PROVISION' });
  const [saving, setSaving] = useState(false);
  const [receivingId, setReceivingId] = useState(null);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().slice(0, 16));

  const totalReceived = provisions
    .filter(p => p.status === 'RECUE' || p.status === 'APPLIQUEE')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const handleCreate = e => {
    e.preventDefault();
    if (!clientId) { alert('Ce dossier n\'a pas de client assigné. Impossible de créer une provision.'); return; }
    setSaving(true);
    createProvision({
      caseId: parseInt(caseId),
      clientId: parseInt(clientId),
      amount: parseFloat(form.amount),
      description: form.description,
      termsText: form.termsText || 'Provision d\'honoraires remboursable si solde final inférieur au montant reçu.',
      type: form.type,
    })
      .then(() => { onRefresh(); setShowForm(false); setForm({ amount: '', description: '', termsText: '', type: 'PROVISION' }); })
      .catch(err => alert(err.response?.data?.message || 'Erreur'))
      .finally(() => setSaving(false));
  };

  const handleMarkReceived = id => {
    markProvisionReceived(id, receiveDate)
      .then(() => { onRefresh(); setReceivingId(null); })
      .catch(() => alert('Erreur'));
  };

  const handleDelete = id => {
    if (!window.confirm('Supprimer cette provision ?')) return;
    deleteProvision(id).then(onRefresh).catch(() => alert('Erreur'));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: 600, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e' }}>
              <i className="fas fa-hand-holding-usd" style={{ marginRight: '0.5rem', color: '#1a56db' }}></i>
              Provisions d'honoraires
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7689' }}>
              Total reçu : <strong style={{ color: '#10b981' }}>{fmt(totalReceived)}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9aa3b4' }}>×</button>
        </div>

        {/* Liste provisions */}
        {provisions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9aa3b4', padding: '1.5rem' }}>Aucune provision pour ce dossier</p>
        ) : provisions.map(p => {
          const si = STATUS_INFO[p.status] || STATUS_INFO.DEMANDEE;
          return (
            <div key={p.id} style={{ border: '1px solid #e8ecf0', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#1a56db', fontSize: '0.9rem' }}>{p.provisionNumber}</span>
                  <span style={{ marginLeft: '0.75rem', background: si.bg, color: si.color, borderRadius: 20, padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>{si.label}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>{fmt(p.amount)}</span>
              </div>
              {p.description && <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#6b7689' }}>{p.description}</p>}
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#9aa3b4' }}>
                Demandée : {fmtDate(p.requestedDate)}
                {p.receivedDate && <> · Reçue : {fmtDate(p.receivedDate)}</>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {p.status === 'DEMANDEE' || p.status === 'EN_ATTENTE_PAIEMENT' ? (
                  receivingId === p.id ? (
                    <>
                      <input type="datetime-local" value={receiveDate} onChange={e => setReceiveDate(e.target.value)}
                        style={{ border: '1px solid #e8ecf0', borderRadius: 6, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} />
                      <button onClick={() => handleMarkReceived(p.id)}
                        style={{ background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        <i className="fas fa-check"></i> Confirmer réception
                      </button>
                      <button onClick={() => setReceivingId(null)}
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <i className="fas fa-times"></i>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setReceivingId(p.id)}
                      style={{ background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      <i className="fas fa-money-bill-wave"></i> Marquer reçue
                    </button>
                  )
                ) : null}
                <button onClick={() => handleDelete(p.id)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          );
        })}

        {/* Formulaire nouvelle provision */}
        {showForm ? (
          <form onSubmit={handleCreate} style={{ background: '#f8f9fc', borderRadius: 10, padding: '1rem', marginTop: '1rem', border: '1px solid #e8ecf0' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700 }}>Nouvelle provision</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Montant (TND) *</label>
                <input required type="number" step="0.001" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem' }}>
                  <option value="PROVISION">Provision</option>
                  <option value="RETAINER">Retainer</option>
                  <option value="AVANCE_HONORAIRES">Avance d'honoraires</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Description *</label>
              <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Ex : Provision pour dossier divorce estimé 3 mois"
                style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Conditions (clauses)</label>
              <textarea value={form.termsText} onChange={e => setForm({ ...form, termsText: e.target.value })}
                rows={2} placeholder="Provision remboursable si solde final < montant reçu..."
                style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e8ecf0', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>Annuler</button>
              <button type="submit" disabled={saving}
                style={{ padding: '0.5rem 1.25rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                {saving ? 'Enregistrement...' : 'Demander la provision'}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            <i className="fas fa-plus"></i> Demander une provision
          </button>
        )}
      </div>
    </div>
  );
}
