import { useState, useEffect } from 'react';
import { getPayments, getUsersByRole, createPayment, deletePayment, markPaymentPaid } from '../api';
import PaymentTimeline from './PaymentTimeline';
import './Paiements.css';

const STATUS_MAP   = { PAYE: 'paid', AVANCE: 'partial' };
const METHOD_LABEL = { ESPECES: 'Espèces', CHEQUE: 'Chèque', VIREMENT: 'Virement', CARTE: 'Carte' };

const mapPayment = p => ({
  id:               p.id,
  clientId:         p.client_id || null,
  clientNom:        p.client_name || '-',
  dossier:          p.case_number || null,
  montant:          Number(p.amount) || 0,
  datePaiement:     p.payment_date ? p.payment_date.split('T')[0] : null,
  modePaiement:     METHOD_LABEL[p.payment_method] || p.payment_method || '-',
  paymentMethodRaw: p.payment_method || 'ESPECES',
  statut:           STATUS_MAP[p.status] || 'pending',
});

const STATUS_INFO = {
  paid:    { label: 'Payé',       cls: 'badge-paid',    icon: 'fa-check-circle',       color: '#10b981', bg: '#d1fae5' },
  partial: { label: 'Avance',     cls: 'badge-partial', icon: 'fa-circle-half-stroke', color: '#f59e0b', bg: '#fef3c7' },
  pending: { label: 'En attente', cls: 'badge-pending', icon: 'fa-clock',              color: '#3b82f6', bg: '#dbeafe' },
};

const fmt     = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initiales = name => name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
const COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];
const avatarColor = name => COLORS[name.charCodeAt(0) % COLORS.length];

export default function Paiements() {
  const [paiements,    setPaiements]    = useState([]);
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [timelineId,   setTimelineId]   = useState(null);
  const [form, setForm] = useState({
    clientId: '', montant: '', datePaiement: '', modePaiement: 'ESPECES', statut: 'AVANCE',
    notes: '', receiptReference: '',
    // method-specific details
    transferReference: '', bankAccount: '',
    chequeNumber: '', chequeBank: '', chequeDate: '',
    cardLast4: '', cardAuthCode: '',
  });

  useEffect(() => {
    Promise.all([getPayments(), getUsersByRole('CLIENT')])
      .then(([payRes, clientRes]) => {
        setPaiements(payRes.data.map(mapPayment));
        setClients(clientRes.data.map(u => ({ id: u.idu, nom: u.nom || '', prenom: u.prenom || '' })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:    paiements.reduce((s, p) => s + p.montant, 0),
    encaisse: paiements.filter(p => p.statut === 'paid').reduce((s, p) => s + p.montant, 0),
    attente:  paiements.filter(p => p.statut !== 'paid').reduce((s, p) => s + p.montant, 0),
    nbPaye:   paiements.filter(p => p.statut === 'paid').length,
  };

  const filtered = paiements.filter(p => {
    const q = searchTerm.toLowerCase();
    return (!q || p.clientNom.toLowerCase().includes(q) || (p.dossier || '').toLowerCase().includes(q) || `FACT-${p.id}`.includes(q))
        && (!filterStatus || p.statut === filterStatus);
  });

  const buildMethodDetails = () => {
    const m = form.modePaiement;
    if (m === 'VIREMENT') return JSON.stringify({ reference: form.transferReference, compte: form.bankAccount });
    if (m === 'CHEQUE')   return JSON.stringify({ numero: form.chequeNumber, banque: form.chequeBank, date: form.chequeDate });
    if (m === 'CARTE')    return JSON.stringify({ last4: form.cardLast4, authCode: form.cardAuthCode });
    return null;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.clientId) return alert('Sélectionnez un client');
    setSaving(true);
    createPayment({
      amount: parseFloat(form.montant),
      paymentDate: (form.datePaiement || new Date().toISOString().split('T')[0]) + 'T00:00:00',
      status: form.statut,
      paymentMethod: form.modePaiement,
      client: { idu: parseInt(form.clientId) },
      notes: form.notes || null,
      receiptReference: form.receiptReference || null,
      methodDetails: buildMethodDetails(),
    })
      .then(res => {
        setPaiements(prev => [mapPayment(res.data), ...prev]);
        setForm({ clientId: '', montant: '', datePaiement: '', modePaiement: 'ESPECES', statut: 'AVANCE', notes: '', receiptReference: '', transferReference: '', bankAccount: '', chequeNumber: '', chequeBank: '', chequeDate: '', cardLast4: '', cardAuthCode: '' });
        setShowAdd(false);
      })
      .catch(err => alert(err.response?.data?.message || 'Erreur'))
      .finally(() => setSaving(false));
  };

  const handleMarkPaid = (p) => {
    if (!window.confirm(`Marquer ${fmt(p.montant)} comme payé ? Un reçu sera envoyé au client.`)) return;
    markPaymentPaid(p.id, 'AVOCAT')
      .then(res => setPaiements(prev => prev.map(x => x.id === p.id ? mapPayment(res.data) : x)))
      .catch(() => alert('Erreur'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Supprimer ce paiement ?')) return;
    deletePayment(id)
      .then(() => setPaiements(prev => prev.filter(x => x.id !== id)))
      .catch(() => alert('Erreur'));
  };

  if (loading) return <div className="pay-page"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  return (
    <div className="pay-page">

      {/* ── Header ── */}
      <div className="pay-header">
        <div>
          <h1 className="pay-title">Paiements</h1>
          <p className="pay-subtitle">Suivi des paiements clients</p>
        </div>
        <button className="pay-add-btn" onClick={() => setShowAdd(true)}>
          <i className="fas fa-plus"></i> Nouveau paiement
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="pay-kpis">
        <div className="pay-kpi" style={{ '--kc': '#3b82f6' }}>
          <div className="kpi-icon"><i className="fas fa-folder-open"></i></div>
          <div className="kpi-text"><strong>{paiements.length}</strong><span>Total</span></div>
        </div>
        <div className="pay-kpi" style={{ '--kc': '#10b981' }}>
          <div className="kpi-icon"><i className="fas fa-check-circle"></i></div>
          <div className="kpi-text"><strong>{fmt(stats.encaisse)}</strong><span>Encaissé</span></div>
        </div>
        <div className="pay-kpi" style={{ '--kc': '#f59e0b' }}>
          <div className="kpi-icon"><i className="fas fa-hourglass-half"></i></div>
          <div className="kpi-text"><strong>{fmt(stats.attente)}</strong><span>En attente</span></div>
        </div>
        <div className="pay-kpi" style={{ '--kc': '#8b5cf6' }}>
          <div className="kpi-icon"><i className="fas fa-file-invoice"></i></div>
          <div className="kpi-text"><strong>{stats.nbPaye} / {paiements.length}</strong><span>Payées</span></div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="pay-toolbar">
        <div className="pay-search">
          <i className="fas fa-search"></i>
          <input placeholder="Client, dossier, facture..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>}
        </div>
        <select className="pay-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="paid">Payé</option>
          <option value="partial">Avance</option>
          <option value="pending">En attente</option>
        </select>
        <span className="pay-count">{filtered.length} paiement{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Cards Grid ── */}
      {filtered.length === 0 ? (
        <div className="pay-empty">
          <i className="fas fa-file-invoice-dollar"></i>
          <p>Aucun paiement trouvé</p>
        </div>
      ) : (
        <div className="pay-grid">
          {filtered.map(p => {
            const si = STATUS_INFO[p.statut] || STATUS_INFO.pending;
            const color = avatarColor(p.clientNom);
            return (
              <div key={p.id} className="pay-card">

                {/* Top strip with status color */}
                <div className="pay-card-strip" style={{ background: si.color }}></div>

                {/* Card body */}
                <div className="pay-card-body">

                  {/* Client row */}
                  <div className="pay-card-client">
                    <div className="pay-avatar" style={{ background: color }}>{initiales(p.clientNom)}</div>
                    <div>
                      <h3 className="pay-card-name">{p.clientNom}</h3>
                      {p.dossier
                        ? <span className="pay-card-dossier"><i className="fas fa-folder-open"></i>{p.dossier}</span>
                        : <span className="pay-card-nodossier">Consultation</span>}
                    </div>
                    <span className="pay-badge" style={{ background: si.bg, color: si.color }}>
                      <i className={`fas ${si.icon}`}></i>{si.label}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="pay-card-amount">{fmt(p.montant)}</div>

                  {/* Details */}
                  <div className="pay-card-details">
                    <div className="pay-card-row">
                      <span><i className="fas fa-file-alt"></i> Facture</span>
                      <span className="pay-fact">FACT-{p.id}</span>
                    </div>
                    <div className="pay-card-row">
                      <span><i className="fas fa-credit-card"></i> Mode</span>
                      <span>{p.modePaiement}</span>
                    </div>
                    <div className="pay-card-row">
                      <span><i className="fas fa-calendar-alt"></i> Date</span>
                      <span>{fmtDate(p.datePaiement)}</span>
                    </div>
                  </div>

                </div>

                {/* Actions */}
                <div className="pay-card-actions">
                  {p.statut !== 'paid' && (
                    <button className="pay-card-btn pay-btn-ok" onClick={() => handleMarkPaid(p)}>
                      <i className="fas fa-check-circle"></i> Marquer payé
                    </button>
                  )}
                  <button className="pay-card-btn" style={{ background: '#f1f3f7', color: '#4a5568', border: 'none', borderRadius: 6, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    onClick={() => setTimelineId(timelineId === p.id ? null : p.id)}>
                    <i className="fas fa-history"></i> Historique
                  </button>
                  <button className="pay-card-btn pay-btn-del" onClick={() => handleDelete(p.id)}>
                    <i className="fas fa-trash"></i> Supprimer
                  </button>
                </div>

                {/* Inline timeline */}
                {timelineId === p.id && (
                  <div style={{ padding: '0.75rem', borderTop: '1px solid #f1f3f7', marginTop: '0.5rem' }}>
                    <PaymentTimeline paymentId={p.id} />
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <div className="pay-overlay" onClick={() => setShowAdd(false)}>
          <div className="pay-modal" onClick={e => e.stopPropagation()}>
            <div className="pay-modal-header">
              <h2><i className="fas fa-plus-circle"></i> Nouveau paiement</h2>
              <button onClick={() => setShowAdd(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="pay-modal-body">
                <div className="pay-field">
                  <label>Client *</label>
                  <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                    <option value="">-- Sélectionner --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
                <div className="pay-row">
                  <div className="pay-field">
                    <label>Montant (DT) *</label>
                    <input type="number" step="0.01" min="0" required placeholder="0.00" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} />
                  </div>
                  <div className="pay-field">
                    <label>Date</label>
                    <input type="date" value={form.datePaiement} onChange={e => setForm({ ...form, datePaiement: e.target.value })} />
                  </div>
                </div>
                <div className="pay-row">
                  <div className="pay-field">
                    <label>Mode de paiement</label>
                    <select value={form.modePaiement} onChange={e => setForm({ ...form, modePaiement: e.target.value })}>
                      <option value="ESPECES">Espèces</option>
                      <option value="CHEQUE">Chèque</option>
                      <option value="VIREMENT">Virement bancaire</option>
                      <option value="CARTE">Carte bancaire</option>
                    </select>
                  </div>
                  <div className="pay-field">
                    <label>Statut</label>
                    <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                      <option value="AVANCE">Avance</option>
                      <option value="PAYE">Payé intégralement</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic fields per payment method */}
                {form.modePaiement === 'VIREMENT' && (
                  <div className="pay-row">
                    <div className="pay-field">
                      <label>Réf. virement</label>
                      <input placeholder="REF-2026-..." value={form.transferReference} onChange={e => setForm({ ...form, transferReference: e.target.value })} />
                    </div>
                    <div className="pay-field">
                      <label>Compte (masqué)</label>
                      <input placeholder="XX123456" value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
                    </div>
                  </div>
                )}
                {form.modePaiement === 'CHEQUE' && (
                  <div className="pay-row">
                    <div className="pay-field">
                      <label>N° chèque</label>
                      <input placeholder="123456" value={form.chequeNumber} onChange={e => setForm({ ...form, chequeNumber: e.target.value })} />
                    </div>
                    <div className="pay-field">
                      <label>Banque émettrice</label>
                      <input placeholder="BNA, STB..." value={form.chequeBank} onChange={e => setForm({ ...form, chequeBank: e.target.value })} />
                    </div>
                  </div>
                )}
                {form.modePaiement === 'CARTE' && (
                  <div className="pay-row">
                    <div className="pay-field">
                      <label>4 derniers chiffres</label>
                      <input maxLength={4} placeholder="4242" value={form.cardLast4} onChange={e => setForm({ ...form, cardLast4: e.target.value })} />
                    </div>
                    <div className="pay-field">
                      <label>Code d'autorisation</label>
                      <input placeholder="AUTH123" value={form.cardAuthCode} onChange={e => setForm({ ...form, cardAuthCode: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="pay-row">
                  <div className="pay-field">
                    <label>Référence reçu</label>
                    <input placeholder="Réf. optionnelle" value={form.receiptReference} onChange={e => setForm({ ...form, receiptReference: e.target.value })} />
                  </div>
                </div>
                <div className="pay-field">
                  <label>Notes internes</label>
                  <input placeholder="Notes pour le dossier..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="pay-modal-footer">
                <button type="button" className="pay-cancel-btn" onClick={() => setShowAdd(false)}>Annuler</button>
                <button type="submit" className="pay-submit-btn" disabled={saving}>
                  <i className="fas fa-check"></i> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
