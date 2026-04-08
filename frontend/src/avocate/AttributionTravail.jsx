import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole, getCases, createTask, getDocumentsByCase } from '../api';
import { useAuth } from '../AuthContext';
import './AttributionTravail.css';

const PRIO_MAP = { basse: 'LOW', moyenne: 'MEDIUM', haute: 'HIGH' };

const AttributionTravail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stagiaires, setStagiaires] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [documentsJuridiques, setDocumentsJuridiques] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getUsersByRole('STAGIAIRE')
      .then(res => setStagiaires(res.data.map(u => ({
        id: u.idu,
        nom: u.nom || '',
        prenom: u.prenom || '',
        email: u.email || '',
        specialite: '-',
        photo: u.photo_url ? `http://localhost:8081${u.photo_url}` : null,
      }))))
      .catch(console.error);

    getCases()
      .then(res => setDossiers(res.data.map(c => ({
        id: c.idc,
        numero: c.case_number || '-',
        nom: c.description || c.case_number || '-',
        type: c.case_type || '-',
        statut: c.status === 'PENDING' ? 'Urgent' : 'En cours',
      }))))
      .catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    titre: '',
    type: 'Document juridique',
    description: '',
    priorite: 'moyenne',
    dateEcheance: '',
    dossierAssocie: '',
    stagiaireIds: [],
    documentsAcces: [],
    instructions: '',
  });

  useEffect(() => {
    if (!formData.dossierAssocie) {
      setDocumentsJuridiques([]);
      return;
    }
    setLoadingDocs(true);
    setFormData(prev => ({ ...prev, documentsAcces: [] }));
    getDocumentsByCase(formData.dossierAssocie)
      .then(res => setDocumentsJuridiques(res.data.map(d => ({
        id: d.idd,
        nom: d.file_name || '-',
        type: d.file_type || '-',
      }))))
      .catch(console.error)
      .finally(() => setLoadingDocs(false));
  }, [formData.dossierAssocie]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleStagiaireToggle = (stagiaireId) => {
    setFormData(prev => ({
      ...prev,
      stagiaireIds: prev.stagiaireIds.includes(stagiaireId)
        ? prev.stagiaireIds.filter(id => id !== stagiaireId)
        : [...prev.stagiaireIds, stagiaireId]
    }));
  };

  const handleDocumentToggle = (docId) => {
    setFormData(prev => ({
      ...prev,
      documentsAcces: prev.documentsAcces.includes(docId)
        ? prev.documentsAcces.filter(id => id !== docId)
        : [...prev.documentsAcces, docId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.titre || !formData.description || formData.stagiaireIds.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires et sélectionner au moins un stagiaire');
      return;
    }

    setSubmitting(true);
    const deadline = formData.dateEcheance ? `${formData.dateEcheance}T00:00:00` : null;
    const calls = formData.stagiaireIds.map(stagiaireId =>
      createTask({
        title: formData.titre,
        description: formData.description,
        deadline,
        status: 'PENDING',
        priority: PRIO_MAP[formData.priorite] || 'MEDIUM',
        assignedTo: { idu: stagiaireId },
        createdBy: user ? { idu: user.idu } : null,
      })
    );
    Promise.all(calls)
      .then(() => setShowSuccessModal(true))
      .catch(() => alert('Erreur lors de l\'attribution du travail'))
      .finally(() => setSubmitting(false));
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate('/avocat/validation-travaux');
  };

  const getTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'pdf') return 'fas fa-file-pdf';
    if (t === 'docx' || t === 'doc') return 'fas fa-file-word';
    if (t === 'xlsx' || t === 'xls') return 'fas fa-file-excel';
    if (t === 'jpg' || t === 'jpeg' || t === 'png') return 'fas fa-file-image';
    return 'fas fa-file';
  };

  const renderDocumentsContent = () => {
    if (!formData.dossierAssocie) {
      return (
        <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          <i className="fas fa-folder" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }} />
          <p>Sélectionnez un dossier associé pour voir ses documents</p>
        </div>
      );
    }
    if (loadingDocs) {
      return <p style={{ padding: '1rem', color: '#94a3b8' }}>Chargement des documents...</p>;
    }
    if (documentsJuridiques.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          <i className="fas fa-file" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }} />
          <p>Aucun document trouvé pour ce dossier</p>
        </div>
      );
    }
    return (
      <>
        <div className="documents-grid">
          {documentsJuridiques.map(doc => {
            const checked = formData.documentsAcces.includes(doc.id);
            return (
              <label
                key={doc.id}
                aria-label={doc.nom}
                className={`document-card ${checked ? 'selected' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleDocumentToggle(doc.id)}
                  style={{ display: 'none' }}
                />
                <div className="document-checkbox">
                  <i className={`fas ${checked ? 'fa-check-circle' : 'fa-circle'}`} />
                </div>
                <div className="document-icon">
                  <i className={getTypeIcon(doc.type)} />
                </div>
                <div className="document-info">
                  <h4>{doc.nom}</h4>
                  <div className="document-meta">
                    <span className="document-type">{doc.type}</span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        {formData.documentsAcces.length > 0 && (
          <div className="selection-summary">
            <i className="fas fa-book" />
            {formData.documentsAcces.length} document{formData.documentsAcces.length > 1 ? 's' : ''} sélectionné{formData.documentsAcces.length > 1 ? 's' : ''}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="attribution-travail">
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attribuer un Travail</h1>
          <p className="page-description">Créez une nouvelle demande de travail et donnez accès aux ressources nécessaires</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/avocat/validation-travaux')}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="attribution-form">
        
        {/* Informations du travail */}
        <section className="form-section">
          <h2 className="section-title">
            <i className="fas fa-info-circle"></i>
            Informations du travail
          </h2>
          
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Titre du travail *</label>
              <input
                type="text"
                required
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder="Ex: Rédaction conclusions divorce"
              />
            </div>

            <div className="form-group">
              <label>Type de travail *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Document juridique">Document juridique</option>
                <option value="Recherche">Recherche jurisprudentielle</option>
                <option value="Procédure">Procédure</option>
                <option value="Note">Note de synthèse</option>
                <option value="Consultation">Consultation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priorité *</label>
              <select
                required
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
              >
                <option value="basse">Basse</option>
                <option value="moyenne">Moyenne</option>
                <option value="haute">Haute</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date d'échéance *</label>
              <input
                type="date"
                required
                value={formData.dateEcheance}
                onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Dossier associé (optionnel)</label>
              <select
                value={formData.dossierAssocie}
                onChange={(e) => setFormData({ ...formData, dossierAssocie: e.target.value })}
              >
                <option value="">Aucun dossier</option>
                {dossiers.map(dossier => (
                  <option key={dossier.id} value={dossier.id}>
                    {dossier.id} - {dossier.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Description du travail *</label>
              <textarea
                required
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez en détail ce qui est attendu..."
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label>Instructions complémentaires</label>
              <textarea
                rows="3"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Consignes particulières, format attendu, délais intermédiaires..."
              ></textarea>
            </div>
          </div>
        </section>

        {/* Sélection des stagiaires */}
        <section className="form-section">
          <h2 className="section-title">
            <i className="fas fa-users"></i>
            Attribuer à (sélectionnez un ou plusieurs stagiaires) *
          </h2>
          
          <div className="stagiaires-grid">
            {stagiaires.map(stagiaire => (
              <div
                key={stagiaire.id}
                className={`stagiaire-card ${formData.stagiaireIds.includes(stagiaire.id) ? 'selected' : ''}`}
                onClick={() => handleStagiaireToggle(stagiaire.id)}
              >
                <div className="stagiaire-checkbox">
                  <i className={`fas ${formData.stagiaireIds.includes(stagiaire.id) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                </div>
                <div className="stagiaire-avatar">
                  {stagiaire.photo
                    ? <img src={stagiaire.photo} alt={`${stagiaire.prenom} ${stagiaire.nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <>{stagiaire.prenom.charAt(0)}{stagiaire.nom.charAt(0)}</>
                  }
                </div>
                <div className="stagiaire-info">
                  <h3>{stagiaire.prenom} {stagiaire.nom}</h3>
                  <p className="stagiaire-email">{stagiaire.email}</p>
                  <span className="stagiaire-specialite">{stagiaire.specialite}</span>
                </div>
              </div>
            ))}
          </div>
          
          {formData.stagiaireIds.length > 0 && (
            <div className="selection-summary">
              <i className="fas fa-check-circle"></i>
              {formData.stagiaireIds.length} stagiaire{formData.stagiaireIds.length > 1 ? 's' : ''} sélectionné{formData.stagiaireIds.length > 1 ? 's' : ''}
            </div>
          )}
        </section>

        {/* Accès aux documents du dossier */}
        <section className="form-section">
          <h2 className="section-title">
            <i className="fas fa-book"></i>
            Documents du dossier (optionnel)
          </h2>
          <p className="section-help">
            Sélectionnez un dossier ci-dessus pour afficher ses documents et autoriser l'accès aux stagiaires
          </p>

          {renderDocumentsContent()}
        </section>

        {/* Résumé et soumission */}
        <section className="form-section summary-section">
          <h2 className="section-title">
            <i className="fas fa-clipboard-check"></i>
            Résumé
          </h2>
          
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Stagiaires assignés:</span>
              <span className="summary-value">{formData.stagiaireIds.length} stagiaire{formData.stagiaireIds.length > 1 ? 's' : ''}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Accès documents:</span>
              <span className="summary-value">{formData.documentsAcces.length} document{formData.documentsAcces.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/avocat/validation-travaux')}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <i className="fas fa-paper-plane"></i>
              {submitting ? 'Envoi...' : 'Attribuer le travail'}
            </button>
          </div>
        </section>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={handleCloseSuccess}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Travail attribué avec succès !</h2>
            <p>Les stagiaires sélectionnés ont reçu la notification et ont maintenant accès aux ressources.</p>
            <div className="success-details">
              <div className="success-detail">
                <i className="fas fa-users"></i>
                <span>{formData.stagiaireIds.length} stagiaire{formData.stagiaireIds.length > 1 ? 's' : ''} notifié{formData.stagiaireIds.length > 1 ? 's' : ''}</span>
              </div>
              {formData.documentsAcces.length > 0 && (
                <div className="success-detail">
                  <i className="fas fa-book"></i>
                  <span>{formData.documentsAcces.length} document{formData.documentsAcces.length > 1 ? 's' : ''} accessible{formData.documentsAcces.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleCloseSuccess}>
              <i className="fas fa-check"></i>
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributionTravail;
