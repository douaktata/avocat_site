import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, downloadClientInvoicePdf } from '../api';
import { useAuth } from '../AuthContext';
import './Facturedetail.css';

const STATUS_LABEL = {
  DRAFT: 'Brouillon', ISSUED: 'Émise', PARTIAL: 'Partiel', PAID: 'Payée', VOID: 'Annulée',
};
const STATUS_CLASS = {
  DRAFT: 'statut-attente', ISSUED: 'statut-emise', PARTIAL: 'statut-attente',
  PAID: 'statut-paye', VOID: 'statut-annulee',
};

const fmt = (val) => Number(val || 0).toFixed(2);

const FactureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getInvoice(id)
      .then(res => setInvoice(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    if (!user) return;
    downloadClientInvoicePdf(user.idu, id)
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${invoice?.invoiceNumber || id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        window.print();
      });
  };

  if (loading) {
    return <div className="facture-detail-page"><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  }

  if (!invoice) {
    return (
      <div className="facture-detail-page">
        <div className="not-found">
          <i className="fas fa-file-invoice"></i>
          <h2>Facture non trouvée</h2>
          <button className="btn-back" onClick={() => navigate('/client/factures')}>
            <i className="fas fa-arrow-left"></i> Retour aux factures
          </button>
        </div>
      </div>
    );
  }

  const lines = invoice.lines || [];
  const statusLabel = STATUS_LABEL[invoice.status] || invoice.status;
  const statusClass = STATUS_CLASS[invoice.status] || 'statut-attente';

  return (
    <div className="facture-detail-page">

      {/* Actions */}
      <div className="facture-actions no-print">
        <button className="btn-back" onClick={() => navigate('/client/factures')}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
        <div className="facture-actions-right">
          <button className="btn-action btn-print" onClick={handlePrint}>
            <i className="fas fa-print"></i> Imprimer
          </button>
          <button className="btn-action btn-download" onClick={handleDownloadPDF}>
            <i className="fas fa-download"></i> Télécharger PDF
          </button>
        </div>
      </div>

      {/* Facture */}
      <div className="facture-container">

        {/* Header */}
        <div className="facture-header">
          <div className="facture-logo">
            <i className="fas fa-balance-scale"></i>
            <div>
              <h1>JurisHub</h1>
              <p>Cabinet d'Avocat Me. Hajaij</p>
            </div>
          </div>
          <div className="facture-title">
            <h2>FACTURE</h2>
            <p className="facture-numero">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="facture-parties">
          <div className="partie-info">
            <h3>Cabinet d'Avocat Maitre Hajaij</h3>
            <p><strong>JurisHub</strong></p>
            <p>Hammamet Nord, Nabeul</p>
            <p>8050, avenue Koweit</p>
            <p>Tél: +216 72 282 755</p>
            <p>Email: cabinet.maitre.hajaij@gmail.com</p>
          </div>
          <div className="partie-info">
            <h3>Facturé à</h3>
            <p><strong>{invoice.clientFullName || '-'}</strong></p>
            {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
          </div>
        </div>

        {/* Infos facture */}
        <div className="facture-infos">
          <div className="info-row">
            <span className="info-label">Date d'émission :</span>
            <span className="info-value">
              {invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString('fr-FR') : (invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('fr-FR') : '-')}
            </span>
          </div>
          {invoice.dueDate && (
            <div className="info-row">
              <span className="info-label">Date d'échéance :</span>
              <span className="info-value">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          {invoice.caseNumber && (
            <div className="info-row">
              <span className="info-label">Dossier :</span>
              <span className="info-value">{invoice.caseNumber}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Statut :</span>
            <span className={`facture-statut ${statusClass}`}>{statusLabel}</span>
          </div>
        </div>

        {/* Lignes */}
        <div className="facture-table-container">
          <table className="facture-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire HT</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>Aucune ligne</td></tr>
              ) : (
                lines.map((line, i) => (
                  <tr key={line.id || i}>
                    <td>{line.description || '-'}</td>
                    <td className="td-center">{fmt(line.quantity)}</td>
                    <td className="td-right">{fmt(line.unitPrice)} TND</td>
                    <td className="td-right td-bold">{fmt(line.lineTotal)} TND</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="facture-totaux">
          <div className="totaux-row">
            <span>Sous-total HT :</span>
            <span>{fmt(invoice.amountHT)} TND</span>
          </div>
          <div className="totaux-row">
            <span>TVA ({fmt(invoice.taxRate)}%) :</span>
            <span>{fmt(invoice.amountTVA)} TND</span>
          </div>
          <div className="totaux-row totaux-total">
            <span>Total TTC :</span>
            <span>{fmt(invoice.amountTTC)} TND</span>
          </div>
          {Number(invoice.amountPaid) > 0 && (
            <>
              <div className="totaux-separator"></div>
              <div className="totaux-row">
                <span>Total payé :</span>
                <span className="text-success">{fmt(invoice.amountPaid)} TND</span>
              </div>
              <div className="totaux-row totaux-solde">
                <span>Solde restant :</span>
                <span className={Number(invoice.amountDue) > 0 ? 'text-danger' : 'text-success'}>
                  {fmt(invoice.amountDue)} TND
                </span>
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="facture-notes">
            <h4>Notes</h4>
            <p>{invoice.notes}</p>
          </div>
        )}
        <div className="facture-notes">
          <h4>Conditions de paiement</h4>
          <p>Paiement à réception de facture. En cas de retard de paiement, des pénalités de retard au taux de 10% pourront être appliquées.</p>
          <p className="note-legale">En cas de litige, seuls les tribunaux de Tunis sont compétents.</p>
        </div>

        {/* Footer */}
        <div className="facture-footer">
          <p>JurisHub - Cabinet d'Avocats | Hammamet Nord, Nabeul</p>
          <p>Tél: +216 72 282 755 | Email: cabinet.maitre.hajaij@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default FactureDetail;
