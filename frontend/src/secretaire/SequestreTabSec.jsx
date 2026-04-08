import { useState, useEffect } from 'react';
import { getTrustAccount, getTrustDeposits, addTrustDeposit } from '../api';

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const METHOD_LABELS = {
  ESPECES:  'Espèces',
  CHEQUE:   'Chèque',
  VIREMENT: 'Virement',
  CARTE:    'Carte bancaire',
};

const STATUS_INFO = {
  PENDING: { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
  ACTIVE:  { label: 'Actif',      color: '#059669', bg: '#d1fae5' },
  CLOSED:  { label: 'Clôturé',    color: '#6b7280', bg: '#f3f4f6' },
};

const inp = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  border: '1px solid #e8ecf0',
  borderRadius: 6,
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};
const lbl = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6b7689',
  marginBottom: '0.3rem',
};

export default function SequestreTabSec({ caseId }) {
  const [trust,        setTrust]        = useState(null);
  const [deposits,     setDeposits]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showDeposit,  setShowDeposit]  = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [depForm,      setDepForm]      = useState({
    amount: '',
    paymentMethod: 'ESPECES',
    paymentDate: new Date().toISOString().slice(0, 10),
    checkNumber: '',
    bankName: '',
    notes: '',
  });

  const load = () => {
    Promise.all([
      getTrustAccount(caseId).catch(() => ({ data: null })),
      getTrustDeposits(caseId).catch(() => ({ data: [] })),
    ]).then(([tRes, dRes]) => {
      setTrust(tRes.data);
      setDeposits(dRes.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [caseId]);

  const handleDeposit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await addTrustDeposit(caseId, {
        amount:        parseFloat(depForm.amount),
        paymentMethod: depForm.paymentMethod,
        paymentDate:   depForm.paymentDate,
        checkNumber:   depForm.checkNumber  || null,
        bankName:      depForm.bankName     || null,
        notes:         depForm.notes        || null,
      });
      setShowDeposit(false);
      setDepForm({
        amount: '', paymentMethod: 'ESPECES',
        paymentDate: new Date().toISOString().slice(0, 10),
        checkNumber: '', bankName: '', notes: '',
      });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du dépôt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#9aa3b4' }}>
      <i className="fas fa-spinner fa-spin"></i>
    </div>
  );

  const balance   = trust ? Number(trust.balance || 0) : 0;
  const requested = trust ? Number(trust.requestedAmount || 0) : 0;
  const deposited = trust ? Number(trust.totalDeposited  || 0) : 0;
  const progress  = requested > 0 ? Math.min((deposited / requested) * 100, 100) : 0;
  const isExhausted = trust?.status === 'ACTIVE' && balance <= 0;
  const si = trust
    ? (isExhausted
        ? { label: 'Provision épuisée', color: '#dc2626', bg: '#fee2e2' }
        : (STATUS_INFO[trust.status] || STATUS_INFO.PENDING))
    : null;

  /* ── Pas de séquestre créé par l'avocat ── */
  if (!trust) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <i className="fas fa-vault" style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem', display: 'block' }}></i>
        <p style={{ color: '#6b7280', marginBottom: '0.5rem', fontWeight: 600 }}>
          Aucun compte séquestre pour ce dossier
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
          L'avocat doit d'abord créer le compte séquestre avant d'y enregistrer des versements.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Carte résumé ── */}
      <div style={{ background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Compte Séquestre
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: balance >= 0 ? '#1e40af' : '#dc2626', marginTop: '0.25rem' }}>
              {fmt(balance)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem' }}>Solde disponible</div>
          </div>
          <span style={{ background: si.bg, color: si.color, borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
            {si.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Demandé</div>
            <div style={{ fontWeight: 700, color: '#374151' }}>{fmt(requested)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Déposé</div>
            <div style={{ fontWeight: 700, color: '#059669' }}>{fmt(deposited)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Alloué</div>
            <div style={{ fontWeight: 700, color: '#d97706' }}>{fmt(trust.totalReleased)}</div>
          </div>
        </div>

        {requested > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.3rem' }}>
              <span>Progression</span><span>{Math.round(progress)}%</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 99, height: 8 }}>
              <div style={{
                background: 'linear-gradient(90deg,#059669,#34d399)',
                borderRadius: 99, height: 8,
                width: `${progress}%`,
                transition: 'width 0.4s',
              }}></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bouton nouveau dépôt ── */}
      {trust.status !== 'CLOSED' && (
        <div style={{ marginBottom: '1.25rem' }}>
          <button className="dd-btn dd-btn-primary" onClick={() => setShowDeposit(s => !s)}>
            <i className={`fas ${showDeposit ? 'fa-times' : 'fa-plus'}`}></i>
            {showDeposit ? ' Annuler' : ' Nouveau versement client'}
          </button>
        </div>
      )}

      {/* ── Formulaire dépôt ── */}
      {showDeposit && (
        <form onSubmit={handleDeposit} style={{ background: '#f8f9fc', borderRadius: 10, padding: '1.25rem', border: '1px solid #e8ecf0', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <i className="fas fa-money-bill-wave" style={{ marginRight: '0.5rem', color: '#059669' }}></i>
            Enregistrer un versement
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Montant (DT) *</label>
              <input
                required type="number" step="0.001" min="0.001"
                value={depForm.amount}
                onChange={e => setDepForm({ ...depForm, amount: e.target.value })}
                placeholder="0.000"
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Mode de paiement *</label>
              <select
                value={depForm.paymentMethod}
                onChange={e => setDepForm({ ...depForm, paymentMethod: e.target.value })}
                style={inp}
              >
                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Date du versement *</label>
              <input
                required type="date"
                value={depForm.paymentDate}
                onChange={e => setDepForm({ ...depForm, paymentDate: e.target.value })}
                style={inp}
              />
            </div>
            {(depForm.paymentMethod === 'CHEQUE' || depForm.paymentMethod === 'VIREMENT') && (
              <div>
                <label style={lbl}>Banque</label>
                <input
                  value={depForm.bankName}
                  onChange={e => setDepForm({ ...depForm, bankName: e.target.value })}
                  style={inp}
                />
              </div>
            )}
            {depForm.paymentMethod === 'CHEQUE' && (
              <div>
                <label style={lbl}>N° Chèque</label>
                <input
                  value={depForm.checkNumber}
                  onChange={e => setDepForm({ ...depForm, checkNumber: e.target.value })}
                  style={inp}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={lbl}>Notes (optionnel)</label>
            <input
              value={depForm.notes}
              onChange={e => setDepForm({ ...depForm, notes: e.target.value })}
              style={inp}
            />
          </div>

          <button type="submit" disabled={saving} className="dd-btn dd-btn-primary">
            {saving
              ? <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
              : <><i className="fas fa-check"></i> Enregistrer le versement</>
            }
          </button>
        </form>
      )}

      {/* ── Historique des versements ── */}
      {deposits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9aa3b4' }}>
          <i className="fas fa-receipt" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
          Aucun versement enregistré
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
            Historique des versements
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fc' }}>
                {['Date', 'Montant', 'Mode', 'N° Reçu', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.78rem', borderBottom: '1px solid #e8ecf0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deposits.map(dep => (
                <tr key={dep.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#374151' }}>{fmtDate(dep.paymentDate)}</td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#059669' }}>{fmt(dep.amount)}</td>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#6b7280' }}>{METHOD_LABELS[dep.paymentMethod] || dep.paymentMethod}</td>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.78rem' }}>{dep.receiptNumber || '—'}</td>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#9ca3af', fontSize: '0.8rem' }}>{dep.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
