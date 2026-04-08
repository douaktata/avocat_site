import { useState, useEffect } from 'react';
import { getPaymentTimeline } from '../api';

const ACTION_CONFIG = {
  FACTURE_EMISE:    { label: 'Facture émise',        icon: 'fa-file-invoice', color: '#3b82f6', bg: '#dbeafe' },
  RAPPEL_ENVOYE:    { label: 'Rappel envoyé',         icon: 'fa-bell',         color: '#8b5cf6', bg: '#ede9fe' },
  PAIEMENT_RECU:    { label: 'Paiement reçu',         icon: 'fa-check-circle', color: '#10b981', bg: '#d1fae5' },
  PAIEMENT_ANNULE:  { label: 'Paiement annulé',       icon: 'fa-times-circle', color: '#ef4444', bg: '#fee2e2' },
  PENALITE_AJOUTEE: { label: 'Pénalité appliquée',    icon: 'fa-exclamation-triangle', color: '#f59e0b', bg: '#fef3c7' },
  LITIGE_DEPOSE:    { label: 'Litige déposé',         icon: 'fa-gavel',        color: '#dc2626', bg: '#fee2e2' },
  RECU_GENERE:      { label: 'Reçu généré',           icon: 'fa-receipt',      color: '#059669', bg: '#d1fae5' },
  RECU_ENVOYE:      { label: 'Reçu envoyé',           icon: 'fa-envelope',     color: '#0891b2', bg: '#cffafe' },
};

const fmtDateTime = dt => dt
  ? new Date(dt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

export default function PaymentTimeline({ paymentId }) {
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterAction, setFilter]     = useState('');

  useEffect(() => {
    if (!paymentId) return;
    setLoading(true);
    getPaymentTimeline(paymentId)
      .then(r => setEvents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [paymentId]);

  const filtered = filterAction ? events.filter(e => e.action === filterAction) : events;

  if (loading) return <div style={{ padding: '1rem', color: '#9aa3b4', fontSize: '0.875rem' }}>Chargement...</div>;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1f2e' }}>
          <i className="fas fa-history" style={{ marginRight: '0.5rem', color: '#1a56db' }}></i>
          Historique
        </h3>
        <select value={filterAction} onChange={e => setFilter(e.target.value)}
          style={{ border: '1px solid #e8ecf0', borderRadius: 8, padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#9aa3b4', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>Aucun événement</p>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: '0.85rem', top: 8, bottom: 8, width: 2, background: '#e8ecf0' }}></div>

          {filtered.map((ev, i) => {
            const cfg = ACTION_CONFIG[ev.action] || { label: ev.action, icon: 'fa-circle', color: '#6b7689', bg: '#f1f3f7' };
            return (
              <div key={ev.id || i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', position: 'relative' }}>
                {/* Dot */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: cfg.bg,
                  border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, position: 'absolute', left: -13, top: 2, zIndex: 1,
                }}>
                  <i className={`fas ${cfg.icon}`} style={{ fontSize: '0.65rem', color: cfg.color }}></i>
                </div>

                {/* Content */}
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: cfg.color }}>{cfg.label}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9aa3b4' }}>{fmtDateTime(ev.timestamp)}</span>
                  </div>
                  <div style={{ marginTop: '0.3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {ev.actor && (
                      <span style={{ fontSize: '0.78rem', color: '#6b7689' }}>
                        <i className="fas fa-user" style={{ marginRight: 4 }}></i>{ev.actor}
                      </span>
                    )}
                    {ev.channel && (
                      <span style={{ fontSize: '0.78rem', color: '#6b7689' }}>
                        <i className="fas fa-satellite-dish" style={{ marginRight: 4 }}></i>{ev.channel}
                      </span>
                    )}
                    {ev.amount && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#10b981' }}>
                        {Number(ev.amount).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                      </span>
                    )}
                  </div>
                  {ev.notes && (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#6b7689', fontStyle: 'italic' }}>{ev.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
