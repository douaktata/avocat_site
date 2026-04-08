import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole } from '../api';
import './ClientsSecretaire.css';

const API_BASE = 'http://localhost:8081';

const ClientsSecretaire = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    getUsersByRole('CLIENT')
      .then(res => setClients(res.data))
      .catch(() => setError('Impossible de charger les clients'))
      .finally(() => setLoading(false));
  }, []);

  const filteredClients = clients.filter(client => {
    const fullName = `${client.prenom || ''} ${client.nom || ''}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.tel || '').includes(searchTerm)
    );
  });

  const getInitials = (client) =>
    `${(client.prenom || '?').charAt(0)}${(client.nom || '?').charAt(0)}`.toUpperCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  if (loading) return <div className="clients-page"><p style={{padding:'2rem'}}>Chargement...</p></div>;
  if (error) return <div className="clients-page"><p style={{padding:'2rem',color:'red'}}>{error}</p></div>;

  return (
    <div className="clients-page">
      <div className="clients-header">
        <div>
          <h1 className="page-title">Gestion des Clients</h1>
          <p className="page-description">Gérez votre portefeuille clients et leurs informations</p>
        </div>
      </div>

      <div className="clients-kpi">
        <div className="kpi-item kpi-total">
          <i className="fas fa-users"></i>
          <div><span>{clients.length}</span><p>Total</p></div>
        </div>
      </div>

      <div className="clients-toolbar">
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <span className="results-count">{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredClients.length > 0 ? (
        <div className="clients-grid">
          {filteredClients.map(client => (
            <div key={client.idu} className="client-card">
              <div className="ccard-top">
                <div className="ccard-avatar" style={client.photo_url ? { overflow: 'hidden', padding: 0 } : {}}>
                  {client.photo_url
                    ? <img src={`${API_BASE}${client.photo_url}`} alt={`${client.prenom} ${client.nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                    : getInitials(client)
                  }
                </div>
                <div className="ccard-identity">
                  <h3>{client.prenom} {client.nom}</h3>
                </div>
              </div>
              <div className="ccard-info">
                <div className="cinfo-row">
                  <i className="fas fa-envelope"></i>
                  <span>{client.email || '—'}</span>
                </div>
                <div className="cinfo-row">
                  <i className="fas fa-phone"></i>
                  <span>{client.tel || '—'}</span>
                </div>
                <div className="cinfo-row">
                  <i className="fas fa-id-card"></i>
                  <span>{client.CIN || client.cin || '—'}</span>
                </div>
                <div className="cinfo-row">
                  <i className="fas fa-birthday-cake"></i>
                  <span>{formatDate(client.date_naissance)}</span>
                </div>
              </div>
              <div className="ccard-actions">
                <button className="ccard-btn ccard-btn-primary" onClick={() => setSelectedClient(client)}>
                  <i className="fas fa-eye"></i> Aperçu
                </button>
                <button
                  className="ccard-btn ccard-btn-secondary"
                  onClick={() => navigate(`/secretaire/clients/${client.idu}`)}
                >
                  <i className="fas fa-arrow-right"></i> Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>Aucun client trouvé</p>
          <small>Essayez de modifier vos critères de recherche</small>
        </div>
      )}

      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal-panel modal-simple" onClick={e => e.stopPropagation()}>
            <div className="modal-hero">
              <div className="modal-avatar" style={selectedClient.photo_url ? { overflow: 'hidden', padding: 0 } : {}}>
                {selectedClient.photo_url
                  ? <img src={`${API_BASE}${selectedClient.photo_url}`} alt={`${selectedClient.prenom} ${selectedClient.nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                  : getInitials(selectedClient)
                }
              </div>
              <div className="modal-identity">
                <h2>{selectedClient.prenom} {selectedClient.nom}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedClient(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-simple">
              <h3 className="section-title"><i className="fas fa-info-circle"></i> Informations générales</h3>
              <div className="modal-info-grid">
                <div className="minfo-item">
                  <i className="fas fa-id-card"></i>
                  <div><label>CIN</label><p>{selectedClient.CIN || selectedClient.cin || '—'}</p></div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-phone"></i>
                  <div><label>Téléphone</label><p>{selectedClient.tel || '—'}</p></div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-envelope"></i>
                  <div><label>Email</label><p>{selectedClient.email || '—'}</p></div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-birthday-cake"></i>
                  <div><label>Date de naissance</label><p>{formatDate(selectedClient.date_naissance)}</p></div>
                </div>
                <div className="minfo-item minfo-full">
                  <i className="fas fa-map-marker-alt"></i>
                  <div><label>Adresse</label><p>{selectedClient.adresse || '—'}</p></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="mfooter-btn mfooter-close" onClick={() => setSelectedClient(null)}>
                <i className="fas fa-times"></i> Fermer
              </button>
              <button className="mfooter-btn mfooter-details" onClick={() => navigate(`/secretaire/clients/${selectedClient.idu}`)}>
                <i className="fas fa-arrow-right"></i> Plus de détails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsSecretaire;
