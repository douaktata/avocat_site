import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getClientInvoices } from '../api';
import './ClientPages.css';

const STATUS_LABEL = { PAID: 'Paye', ISSUED: 'En attente', DRAFT: 'Brouillon', VOID: 'Annule' };
const STATUS_BADGE = { PAID: 'badge-green', ISSUED: 'badge-amber', DRAFT: 'badge-gray', VOID: 'badge-gray' };

const PaiementsClient = () => {
  const { user } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user?.idu) return;
    getClientInvoices(user.idu)
      .then(res => setInvoices(res.data))
      .catch(() => setError('Impossible de charger les paiements'))
      .finally(() => setLoading(false));
  }, [user]);

  const visible = invoices.filter(inv => inv.status !== 'DRAFT');
  const filtered = filter ? visible.filter(inv => inv.status === filter) : visible;

  const total = visible.reduce((a, inv) => a + Number(inv.amountTTC || 0), 0);
  const paye = visible.filter(inv => inv.status === 'PAID').reduce((a, inv) => a + Number(inv.amountPaid || 0), 0);
  const enAttente = visible.filter(inv => inv.status === 'ISSUED').reduce((a, inv) => a + Number(inv.amountDue || 0), 0);

  const formatAmount = (n) => Number(n || 0).toLocaleString('fr-FR');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  if (loading) return <div><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="paiements-client">
      <div className="page-header">
        <div>
          <h1 className="page-title">Paiements</h1>
          <p className="page-subtitle">Suivi de vos honoraires et reglements</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-file-invoice-dollar"></i></div>
          <span className="stat-number">{formatAmount(total)} TND</span>
          <span className="stat-label">Total engage</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><i className="fas fa-check-circle"></i></div>
          <span className="stat-number">{formatAmount(paye)} TND</span>
          <span className="stat-label">Regle</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><i className="fas fa-hourglass-half"></i></div>
          <span className="stat-number">{formatAmount(enAttente)} TND</span>
          <span className="stat-label">En attente</span>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Toutes les factures</option>
          <option value="PAID">Payees</option>
          <option value="ISSUED">En attente</option>
          <option value="VOID">Annulees</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Dossier</th>
              <th>Montant TTC</th>
              <th>Regle</th>
              <th>Reste du</th>
              <th>Statut</th>
              <th>N° Facture</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#9aa3b4' }}>
                  Aucune facture trouvee
                </td>
              </tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id}>
                  <td>{formatDate(inv.issuedDate || inv.invoiceDate)}</td>
                  <td>
                    {inv.caseNumber
                      ? <span style={{ background: '#f1f3f7', padding: '0.2rem 0.65rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, color: '#4a5568' }}>{inv.caseNumber}</span>
                      : <span style={{ color: '#cdd3df' }}>-</span>}
                  </td>
                  <td className="table-amount">{formatAmount(inv.amountTTC)} TND</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>{formatAmount(inv.amountPaid)} TND</td>
                  <td style={{ color: inv.amountDue > 0 ? '#d97706' : '#6b7280', fontWeight: inv.amountDue > 0 ? 600 : 400 }}>
                    {formatAmount(inv.amountDue)} TND
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[inv.status] || 'badge-gray'}`}>
                      {STATUS_LABEL[inv.status] || inv.status}
                    </span>
                  </td>
                  <td style={{ color: '#9aa3b4', fontSize: '0.8rem' }}>{inv.invoiceNumber || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {enAttente > 0 && (
        <div style={{
          marginTop: '1.5rem',
          background: '#fdf6e3',
          border: '1px solid #e8d5a3',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#92400e' }}>
              <i className="fas fa-exclamation-circle"></i>{' '}
              Vous avez {formatAmount(enAttente)} TND en attente de reglement
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: '#b45309' }}>
              Merci de contacter le cabinet pour effectuer votre paiement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaiementsClient;
