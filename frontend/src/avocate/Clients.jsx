import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole, register, getCasesByClient, updateUser, deleteUser } from '../api';
import './Clients.css';

const API_BASE = 'http://localhost:8081';

const Clients = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsersByRole('CLIENT')
      .then(res => {
        const users = res.data;
        return Promise.all(
          users.map(u =>
            getCasesByClient(u.idu)
              .then(r => r.data)
              .catch(() => [])
              .then(cases => ({
                id: u.idu,
                nom: u.nom || '',
                prenom: u.prenom || '',
                email: u.email || '',
                tel: u.tel || '-',
                adresse: u.adresse || '-',
                cin: u.cin || u.CIN || '-',
                dateNaissance: u.date_naissance || '-',
                status: u.statut || 'Actif',
                photo_url: u.photo_url || null,
                dossiers: cases,
                rdv: [],
                paiements: [],
              }))
          )
        );
      })
      .then(mapped => {
        setClients(mapped);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les clients');
        setLoading(false);
      });
  }, []);


  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [newClient, setNewClient] = useState({ nom: '', prenom: '', email: '', tel: '', adresse: '', CIN: '', date_naissance: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const generateTempPassword = (nom, prenom) => {
    const base = `${prenom.charAt(0).toUpperCase()}${nom.charAt(0).toUpperCase()}`;
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${base}@${rand}2026`;
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    const password = generateTempPassword(newClient.nom || 'X', newClient.prenom || 'X');
    setSaving(true);
    register({ ...newClient, password })
      .then(res => {
        const u = res.data;
        setClients(prev => [...prev, {
          id: u.idu,
          nom: newClient.nom,
          prenom: newClient.prenom,
          email: newClient.email,
          tel: newClient.tel || '-',
          adresse: newClient.adresse || '-',
          cin: newClient.CIN || '-',
          dateNaissance: newClient.date_naissance || '-',
          status: 'Actif',
          dossiers: [], rdv: [], paiements: [],
        }]);
        setTempPassword(password);
        setNewClient({ nom: '', prenom: '', email: '', tel: '', adresse: '', CIN: '', date_naissance: '' });
        setShowAddModal(false);
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Erreur lors de la création';
        alert(msg);
      })
      .finally(() => setSaving(false));
  };

  const filteredClients = clients.filter(client => {
    const fullName = `${client.prenom} ${client.nom}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.tel.includes(searchTerm);
    const matchesStatus = statusFilter === '' || client.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (client) => {
    setSelectedClient(client);
  };

  const handleCloseModal = () => {
    setSelectedClient(null);
  };

  const handleViewDetails = (clientId) => {
    navigate(`/avocat/clients/${clientId}`);
  };

  const handleToggleBlock = (client, e) => {
    e.stopPropagation();
    const newStatut = client.status === 'Bloqué' ? 'Actif' : 'Bloqué';
    updateUser(client.id, { statut: newStatut })
      .then(() => setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: newStatut } : c)))
      .catch(() => alert('Erreur lors de la mise à jour'));
  };

  const handleDeleteClient = (client, e) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer définitivement ${client.prenom} ${client.nom} ? Cette action est irréversible.`)) return;
    deleteUser(client.id)
      .then(() => {
        setClients(prev => prev.filter(c => c.id !== client.id));
        if (selectedClient?.id === client.id) setSelectedClient(null);
      })
      .catch(() => alert('Erreur lors de la suppression'));
  };

  const handleOpenEdit = (client, e) => {
    e.stopPropagation();
    setEditClient({ ...client, CIN: client.cin, date_naissance: client.dateNaissance === '-' ? '' : client.dateNaissance });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setSavingEdit(true);
    updateUser(editClient.id, {
      nom: editClient.nom,
      prenom: editClient.prenom,
      email: editClient.email,
      tel: editClient.tel,
      adresse: editClient.adresse,
      CIN: editClient.CIN,
      date_naissance: editClient.date_naissance || null,
    })
      .then(() => {
        setClients(prev => prev.map(c => c.id === editClient.id ? {
          ...c,
          nom: editClient.nom,
          prenom: editClient.prenom,
          email: editClient.email,
          tel: editClient.tel || '-',
          adresse: editClient.adresse || '-',
          cin: editClient.CIN || '-',
          dateNaissance: editClient.date_naissance || '-',
        } : c));
        setShowEditModal(false);
        setEditClient(null);
      })
      .catch(err => alert(err.response?.data?.message || 'Erreur lors de la modification'))
      .finally(() => setSavingEdit(false));
  };

  const getStatusClass = (status) => {
    const classes = {
      Actif: 'status-actif',
      Prospect: 'status-prospect',
      Inactif: 'status-inactif',
      'Bloqué': 'status-bloqué',
    };
    return classes[status] || '';
  };

  const stats = {
    total: clients.length,
    actifs: clients.filter(c => c.status === 'Actif').length,
    prospects: clients.filter(c => c.status === 'Prospect').length,
    inactifs: clients.filter(c => c.status === 'Inactif').length,
    bloques: clients.filter(c => c.status === 'Bloqué').length,
  };

  const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' };
  const inp = { width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };

  if (loading) return <div className="clients-page"><p style={{padding:'2rem'}}>Chargement...</p></div>;
  if (error) return <div className="clients-page"><p style={{padding:'2rem',color:'red'}}>{error}</p></div>;

  return (
    <div className="clients-page">

      {/* ── Header ── */}
      <div className="clients-header">
        <div>
          <h1 className="page-title">Gestion des Clients</h1>
          <p className="page-description">Gérez votre portefeuille clients et leurs informations</p>
        </div>
        <button className="btn-add-client" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-user-plus"></i> Ajouter un client
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="clients-kpi">
        <div className="kpi-item kpi-total">
          <i className="fas fa-users"></i>
          <div><span>{stats.total}</span><p>Total</p></div>
        </div>
        <div className="kpi-item kpi-actif">
          <i className="fas fa-user-check"></i>
          <div><span>{stats.actifs}</span><p>Actifs</p></div>
        </div>
        <div className="kpi-item kpi-prospect">
          <i className="fas fa-user-clock"></i>
          <div><span>{stats.prospects}</span><p>Prospects</p></div>
        </div>
        <div className="kpi-item kpi-inactif">
          <i className="fas fa-user-slash"></i>
          <div><span>{stats.inactifs}</span><p>Inactifs</p></div>
        </div>
        <div className="kpi-item" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <i className="fas fa-ban" style={{ color: '#dc2626' }}></i>
          <div><span style={{ color: '#dc2626' }}>{stats.bloques}</span><p>Bloqués</p></div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
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
        <div className="filter-wrap">
          <i className="fas fa-filter"></i>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="prospect">Prospect</option>
            <option value="inactif">Inactif</option>
            <option value="bloqué">Bloqué</option>
          </select>
        </div>
        <span className="results-count">{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Clients Grid ── */}
      {filteredClients.length > 0 ? (
        <div className="clients-grid">
          {filteredClients.map(client => (
            <div key={client.id} className="client-card">
              {/* Card Top */}
              <div className="ccard-top">
                <div className="ccard-avatar">
                  {client.photo_url
                    ? <img src={`${API_BASE}${client.photo_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                    : <>{client.prenom.charAt(0)}{client.nom.charAt(0)}</>}
                </div>
                <div className="ccard-identity">
                  <h3>{client.prenom} {client.nom}</h3>
                  <span className={`ccard-status ${getStatusClass(client.status)}`}>
                    {client.status}
                  </span>
                </div>
              </div>

              {/* Card Info */}
              <div className="ccard-info">
                <div className="cinfo-row">
                  <i className="fas fa-envelope"></i>
                  <span>{client.email}</span>
                </div>
                <div className="cinfo-row">
                  <i className="fas fa-phone"></i>
                  <span>{client.tel}</span>
                </div>
                <div className="cinfo-row">
                  <i className="fas fa-folder"></i>
                  <span>{client.dossiers.length} dossier(s)</span>
                </div>
                <div className="cinfo-row">
                  <i className="fas fa-calendar"></i>
                  <span>{client.rdv.filter(r => r.statut === 'À venir').length} RDV à venir</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="ccard-actions">
                <button
                  className="ccard-btn ccard-btn-primary"
                  onClick={() => handleOpenModal(client)}
                >
                  <i className="fas fa-eye"></i> Aperçu
                </button>
                <button
                  className="ccard-btn ccard-btn-secondary"
                  onClick={(e) => handleOpenEdit(client, e)}
                >
                  <i className="fas fa-edit"></i> Modifier
                </button>
                <button
                  className={`ccard-btn ${client.status === 'Bloqué' ? 'ccard-btn-unblock' : 'ccard-btn-block'}`}
                  onClick={(e) => handleToggleBlock(client, e)}
                  title={client.status === 'Bloqué' ? 'Débloquer' : 'Bloquer'}
                >
                  <i className={`fas fa-${client.status === 'Bloqué' ? 'unlock' : 'ban'}`}></i>
                  {client.status === 'Bloqué' ? ' Débloquer' : ' Bloquer'}
                </button>
                <button
                  className="ccard-btn ccard-btn-danger"
                  onClick={(e) => handleDeleteClient(client, e)}
                  title="Supprimer"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>Aucun client trouvé</p>
          <small>Essayez de modifier vos filtres de recherche</small>
        </div>
      )}

      {/* ══ POPUP MOT DE PASSE TEMPORAIRE ══ */}
      {tempPassword && (
        <div className="modal-overlay" onClick={() => setTempPassword(null)}>
          <div className="modal-panel modal-simple" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body-simple" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: '#15803d', marginBottom: '0.5rem' }}>Client créé avec succès</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Communiquez ce mot de passe temporaire au client. Il pourra le modifier après connexion.
              </p>
              <div style={{ background: '#f1f5f9', border: '1.5px dashed #94a3b8', borderRadius: '10px', padding: '1rem', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '2px', color: '#1e3a8a', fontFamily: 'monospace' }}>
                {tempPassword}
              </div>
            </div>
            <div className="modal-footer">
              <button className="mfooter-btn mfooter-details" onClick={() => setTempPassword(null)}>
                <i className="fas fa-check"></i> Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL AJOUTER CLIENT ══ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-panel modal-simple" onClick={e => e.stopPropagation()}>
            <div className="modal-hero" style={{ paddingBottom: '1rem' }}>
              <div className="modal-avatar" style={{ background: '#1e3a8a' }}>
                <i className="fas fa-user-plus" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
              </div>
              <div className="modal-identity">
                <h2>Nouveau client</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Le client recevra un accès à l'espace client</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddClient}>
              <div className="modal-body-simple">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={lbl}>Prénom *</label>
                    <input style={inp} required placeholder="Prénom" value={newClient.prenom} onChange={e => setNewClient({ ...newClient, prenom: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Nom *</label>
                    <input style={inp} required placeholder="Nom" value={newClient.nom} onChange={e => setNewClient({ ...newClient, nom: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <input style={inp} type="email" required placeholder="email@exemple.com" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Téléphone</label>
                    <input style={inp} placeholder="25 356 180 " value={newClient.tel} onChange={e => setNewClient({ ...newClient, tel: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>CIN</label>
                    <input style={inp} placeholder="N° CIN" value={newClient.CIN} onChange={e => setNewClient({ ...newClient, CIN: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Date de naissance</label>
                    <input style={inp} type="date" value={newClient.date_naissance} onChange={e => setNewClient({ ...newClient, date_naissance: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Adresse</label>
                    <input style={inp} placeholder="Adresse" value={newClient.adresse} onChange={e => setNewClient({ ...newClient, adresse: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="mfooter-btn mfooter-close" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="mfooter-btn mfooter-details" disabled={saving}>
                  <i className="fas fa-user-plus"></i> {saving ? 'Création...' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL APERÇU RAPIDE (SIMPLIFIÉ)
      ══════════════════════════════ */}
      {/* ══ MODAL MODIFIER CLIENT ══ */}
      {showEditModal && editClient && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-panel modal-simple" onClick={e => e.stopPropagation()}>
            <div className="modal-hero" style={{ paddingBottom: '1rem' }}>
              <div className="modal-avatar" style={{ background: '#1e3a8a' }}>
                <i className="fas fa-user-edit" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
              </div>
              <div className="modal-identity">
                <h2>Modifier le client</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{editClient.prenom} {editClient.nom}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body-simple">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={lbl}>Prénom *</label>
                    <input style={inp} required placeholder="Prénom" value={editClient.prenom} onChange={e => setEditClient({ ...editClient, prenom: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Nom *</label>
                    <input style={inp} required placeholder="Nom" value={editClient.nom} onChange={e => setEditClient({ ...editClient, nom: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <input style={inp} type="email" required value={editClient.email} onChange={e => setEditClient({ ...editClient, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Téléphone</label>
                    <input style={inp} placeholder="Téléphone" value={editClient.tel === '-' ? '' : editClient.tel} onChange={e => setEditClient({ ...editClient, tel: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>CIN</label>
                    <input style={inp} placeholder="N° CIN" value={editClient.CIN === '-' ? '' : editClient.CIN} onChange={e => setEditClient({ ...editClient, CIN: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Date de naissance</label>
                    <input style={inp} type="date" value={editClient.date_naissance || ''} onChange={e => setEditClient({ ...editClient, date_naissance: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Adresse</label>
                    <input style={inp} placeholder="Adresse" value={editClient.adresse === '-' ? '' : editClient.adresse} onChange={e => setEditClient({ ...editClient, adresse: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="mfooter-btn mfooter-close" onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="mfooter-btn mfooter-details" disabled={savingEdit}>
                  <i className="fas fa-save"></i> {savingEdit ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-panel modal-simple" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="modal-hero">
              <div className="modal-avatar">
                {selectedClient.photo_url
                  ? <img src={`${API_BASE}${selectedClient.photo_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                  : <>{selectedClient.prenom.charAt(0)}{selectedClient.nom.charAt(0)}</>}
              </div>
              <div className="modal-identity">
                <h2>{selectedClient.prenom} {selectedClient.nom}</h2>
                <span className={`ccard-status ${getStatusClass(selectedClient.status)}`}>
                  {selectedClient.status}
                </span>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body - Infos générales SEULEMENT */}
            <div className="modal-body-simple">
              <h3 className="section-title">
                <i className="fas fa-info-circle"></i> Informations générales
              </h3>
              
              <div className="modal-info-grid">
                <div className="minfo-item">
                  <i className="fas fa-id-card"></i>
                  <div>
                    <label>CIN / Identifiant</label>
                    <p>{selectedClient.cin}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <label>Téléphone</label>
                    <p>{selectedClient.tel}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <label>Email</label>
                    <p>{selectedClient.email}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-birthday-cake"></i>
                  <div>
                    <label>Date de naissance</label>
                    <p>{selectedClient.dateNaissance}</p>
                  </div>
                </div>
<div className="minfo-item minfo-full">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <label>Adresse</label>
                    <p>{selectedClient.adresse}</p>
                  </div>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="quick-stats">
                <div className="quick-stat">
                  <i className="fas fa-folder"></i>
                  <div>
                    <span className="stat-number">{selectedClient.dossiers.length}</span>
                    <span className="stat-label">Dossier(s)</span>
                  </div>
                </div>
                <div className="quick-stat">
                  <i className="fas fa-calendar"></i>
                  <div>
                    <span className="stat-number">{selectedClient.rdv.filter(r => r.statut === 'À venir').length}</span>
                    <span className="stat-label">RDV à venir</span>
                  </div>
                </div>
                <div className="quick-stat">
                  <i className="fas fa-euro-sign"></i>
                  <div>
                    <span className="stat-number">{selectedClient.paiements.length}</span>
                    <span className="stat-label">Paiement(s)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Actions principales */}
            <div className="modal-footer">
              <button className="mfooter-btn mfooter-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i> Fermer
              </button>
              <button 
                className="mfooter-btn mfooter-details"
                onClick={() => handleViewDetails(selectedClient.id)}
              >
                <i className="fas fa-arrow-right"></i> Plus de détails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;