import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Facturedetail.css';

const FactureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const factureRef = useRef();

  // Données de la facture (à remplacer par API)
  const factures = {
    'FACT-2024-001': {
      numero: 'FACT-2024-001',
      date: '2024-02-12',
      dateEcheance: '2024-03-12',
      statut: 'Payé',
      client: {
        nom: 'Jean Dubois',
        adresse: '15 Rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
        cin: '12345678'
      },
      dossier: {
        numero: 'DOS-2024-001',
        nom: 'Divorce contentieux'
      },
      prestations: [
        { description: 'Consultation initiale', quantite: 1, prixUnitaire: 200, tva: 19 },
        { description: 'Rédaction requête en divorce', quantite: 1, prixUnitaire: 500, tva: 19 },
        { description: 'Audiences (3 séances)', quantite: 3, prixUnitaire: 150, tva: 19 },
        { description: 'Correspondances et démarches', quantite: 1, prixUnitaire: 50, tva: 19 },
      ],
      paiements: [
        { date: '2024-02-12', montant: 1200, methode: 'Virement bancaire' }
      ]
    },
    'FACT-2024-002': {
      numero: 'FACT-2024-002',
      date: '2024-01-04',
      dateEcheance: '2024-02-04',
      statut: 'Payé',
      client: {
        nom: 'Jean Dubois',
        adresse: '15 Rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
        cin: '12345678'
      },
      dossier: {
        numero: 'DOS-2024-001',
        nom: 'Divorce contentieux'
      },
      prestations: [
        { description: 'Ouverture du dossier', quantite: 1, prixUnitaire: 300, tva: 19 },
        { description: 'Analyse préliminaire du dossier', quantite: 1, prixUnitaire: 200, tva: 19 },
      ],
      paiements: [
        { date: '2024-01-04', montant: 500, methode: 'Chèque' }
      ]
    },
    'FACT-2024-003': {
      numero: 'FACT-2024-003',
      date: '2024-03-15',
      dateEcheance: '2024-04-15',
      statut: 'En attente',
      client: {
        nom: 'Jean Dubois',
        adresse: '15 Rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
        cin: '12345678'
      },
      dossier: {
        numero: 'DOS-2024-001',
        nom: 'Divorce contentieux'
      },
      prestations: [
        { description: 'Provision sur honoraires pour procédure', quantite: 1, prixUnitaire: 1680.67, tva: 19 },
      ],
      paiements: []
    },
  };

  const facture = factures[id];

  if (!facture) {
    return (
      <div className="facture-detail-page">
        <div className="not-found">
          <i className="fas fa-file-invoice"></i>
          <h2>Facture non trouvée</h2>
          <button className="btn-back" onClick={() => navigate('/client/paiements')}>
            <i className="fas fa-arrow-left"></i> Retour aux paiements
          </button>
        </div>
      </div>
    );
  }

  // Calculs
  const calculerTotaux = () => {
    let sousTotal = 0;
    let totalTVA = 0;

    facture.prestations.forEach(p => {
      const montantHT = p.quantite * p.prixUnitaire;
      const montantTVA = montantHT * (p.tva / 100);
      sousTotal += montantHT;
      totalTVA += montantTVA;
    });

    const total = sousTotal + totalTVA;
    const totalPaye = facture.paiements.reduce((acc, p) => acc + p.montant, 0);
    const solde = total - totalPaye;

    return { sousTotal, totalTVA, total, totalPaye, solde };
  };

  const totaux = calculerTotaux();

  // Impression
  const handlePrint = () => {
    window.print();
  };

  // Téléchargement PDF
  const handleDownloadPDF = () => {
    alert('Pour télécharger en PDF : Utilisez Ctrl+P (ou Cmd+P sur Mac) puis sélectionnez "Enregistrer au format PDF"');
    window.print();
  };

  return (
    <div className="facture-detail-page">
      
      {/* Actions (cachées à l'impression) */}
      <div className="facture-actions no-print">
        <button className="btn-back" onClick={() => navigate('/avocat/paiements')}>
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
      <div className="facture-container" ref={factureRef}>
        
        {/* Header */}
        <div className="facture-header">
          <div className="facture-logo">
            <i className="fas fa-balance-scale"></i>
            <div>
              <h1>JurisHub</h1>
              <p>Cabinet d'Avocats</p>
            </div>
          </div>
          <div className="facture-title">
            <h2>FACTURE</h2>
            <p className="facture-numero">{facture.numero}</p>
          </div>
        </div>

        {/* Infos Cabinet et Client */}
        <div className="facture-parties">
          <div className="partie-info">
            <h3>Cabinet d'Avocats</h3>
            <p><strong>JurisHub</strong></p>
            <p>Avenue Habib Bourguiba</p>
            <p>1000 Tunis, Tunisie</p>
            <p>Tél: +216 71 123 456</p>
            <p>Email: contact@jurishub.tn</p>
          </div>
          <div className="partie-info">
            <h3>Facturé à</h3>
            <p><strong>{facture.client.nom}</strong></p>
            <p>CIN: {facture.client.cin}</p>
            <p>{facture.client.adresse}</p>
            <p>{facture.client.codePostal} {facture.client.ville}</p>
            <p>{facture.client.pays}</p>
          </div>
        </div>

        {/* Infos Facture */}
        <div className="facture-infos">
          <div className="info-row">
            <span className="info-label">Date d'émission:</span>
            <span className="info-value">{new Date(facture.date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date d'échéance:</span>
            <span className="info-value">{new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Dossier concerné:</span>
            <span className="info-value">{facture.dossier.numero} - {facture.dossier.nom}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Statut:</span>
            <span className={`facture-statut ${facture.statut === 'Payé' ? 'statut-paye' : 'statut-attente'}`}>
              {facture.statut}
            </span>
          </div>
        </div>

        {/* Tableau Prestations */}
        <div className="facture-table-container">
          <table className="facture-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire HT</th>
                <th>TVA</th>
                <th>Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              {facture.prestations.map((p, i) => {
                const montantHT = p.quantite * p.prixUnitaire;
                const montantTVA = montantHT * (p.tva / 100);
                const montantTTC = montantHT + montantTVA;
                
                return (
                  <tr key={i}>
                    <td>{p.description}</td>
                    <td className="td-center">{p.quantite}</td>
                    <td className="td-right">{p.prixUnitaire.toFixed(2)} TND</td>
                    <td className="td-center">{p.tva}%</td>
                    <td className="td-right td-bold">{montantTTC.toFixed(2)} TND</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="facture-totaux">
          <div className="totaux-row">
            <span>Sous-total HT:</span>
            <span>{totaux.sousTotal.toFixed(2)} TND</span>
          </div>
          <div className="totaux-row">
            <span>TVA (19%):</span>
            <span>{totaux.totalTVA.toFixed(2)} TND</span>
          </div>
          <div className="totaux-row totaux-total">
            <span>Total TTC:</span>
            <span>{totaux.total.toFixed(2)} TND</span>
          </div>
          
          {facture.paiements.length > 0 && (
            <>
              <div className="totaux-separator"></div>
              <div className="totaux-row">
                <span>Total payé:</span>
                <span className="text-success">{totaux.totalPaye.toFixed(2)} TND</span>
              </div>
              <div className="totaux-row totaux-solde">
                <span>Solde restant:</span>
                <span className={totaux.solde > 0 ? 'text-danger' : 'text-success'}>
                  {totaux.solde.toFixed(2)} TND
                </span>
              </div>
            </>
          )}
        </div>

        {/* Paiements effectués */}
        {facture.paiements.length > 0 && (
          <div className="facture-paiements">
            <h3>Paiements effectués</h3>
            <table className="paiements-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Méthode</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {facture.paiements.map((p, i) => (
                  <tr key={i}>
                    <td>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td>{p.methode}</td>
                    <td className="td-right td-bold">{p.montant.toFixed(2)} TND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        <div className="facture-notes">
          <h4>Conditions de paiement</h4>
          <p>Paiement à réception de facture. En cas de retard de paiement, des pénalités de retard au taux de 10% pourront être appliquées.</p>
          <p className="note-legale">
            En cas de litige, seuls les tribunaux de Tunis sont compétents.
          </p>
        </div>

        {/* Footer */}
        <div className="facture-footer">
          <p>JurisHub - Cabinet d'Avocats | Avenue Habib Bourguiba, 1000 Tunis</p>
          <p>Tél: +216 71 123 456 | Email: contact@jurishub.tn</p>
        </div>
      </div>
    </div>
  );
};

export default FactureDetail;