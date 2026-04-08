import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getCasesByClient } from '../api';
import './ClientPages.css';

const STATUS_LABEL = { OPEN: 'En cours', PENDING: 'En attente', CLOSED: 'Cloture' };
const STATUS_BADGE = { OPEN: 'badge-blue', PENDING: 'badge-amber', CLOSED: 'badge-gray' };
const typeColor = { Famille: '#e91e8c', Commercial: '#2451a3', Immobilier: '#059669', Penal: '#c0392b', Travail: '#d97706' };

const MesDossiersClient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user?.idu) return;
    getCasesByClient(user.idu)
      .then(res => setDossiers(res.data))
      .catch(() => setError('Impossible de charger les dossiers'))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = dossiers.filter(d => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (d.case_number || '').toLowerCase().includes(q) || (d.case_type || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: dossiers.length,
    enCours: dossiers.filter(d => d.status === 'OPEN').length,
    enAttente: dossiers.filter(d => d.status === 'PENDING').length,
    clotures: dossiers.filter(d => d.status === 'CLOSED').length,
  };

  if (loading) return <div><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="mes-dossiers-client">

      <div className="page-header">
        <div>
          <h1 className="page-title">Mes Dossiers</h1>
          <p className="page-subtitle">Suivez l'avancement de vos affaires juridiques</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-folder-open"></i></div>
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><i className="fas fa-spinner"></i></div>
          <span className="stat-number">{stats.enCours}</span>
          <span className="stat-label">En cours</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><i className="fas fa-clock"></i></div>
          <span className="stat-number">{stats.enAttente}</span>
          <span className="stat-label">En attente</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <span className="stat-number">{stats.clotures}</span>
          <span className="stat-label">Clotures</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par numero ou type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-control"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="OPEN">En cours</option>
          <option value="PENDING">En attente</option>
          <option value="CLOSED">Cloture</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-folder-open"></i>
          <p>Aucun dossier trouve</p>
        </div>
      ) : (
        <div className="dossiers-list">
          {filtered.map(d => {
            const color = typeColor[d.case_type] || '#64748b';
            const statutLabel = STATUS_LABEL[d.status] || d.status;
            const badgeClass = STATUS_BADGE[d.status] || 'badge-gray';
            return (
              <div key={d.idc} className="dossier-card" onClick={() => navigate(`/client/dossiers/${d.idc}`)}>
                <div className="dossier-card-top">
                  <div className="dossier-type-badge" style={{ background: `${color}18`, color }}>
                    <i className="fas fa-folder"></i>
                  </div>
                  <div className="dossier-card-info">
                    <span className="dossier-number">{d.case_number}</span>
                    <h3 className="dossier-name">{d.case_type || '-'}</h3>
                  </div>
                  <span className={`badge ${badgeClass}`}>{statutLabel}</span>
                </div>
                <div className="dossier-card-footer">
                  <span><i className="fas fa-user"></i> {d.client_full_name || '-'}</span>
                  <span><i className="fas fa-calendar"></i> {d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '-'}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    <i className="fas fa-arrow-right" style={{ color: '#9aa3b4' }}></i>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MesDossiersClient;
