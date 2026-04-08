import React, { useState, useEffect } from 'react';
import { getUsersByRole, getCases } from '../api';
import './RechercheGlobale.css';

const RechercheGlobale = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [dataClients, setDataClients]   = useState([]);
  const [dataMembres, setDataMembres]   = useState([]);
  const [dataAffaires, setDataAffaires] = useState([]);
  const [dataStaff, setDataStaff]       = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      getUsersByRole('CLIENT').catch(() => ({ data: [] })),
      getUsersByRole('AVOCAT').catch(() => ({ data: [] })),
      getCases().catch(() => ({ data: [] })),
      getUsersByRole('STAGIAIRE').catch(() => ({ data: [] })),
      getUsersByRole('SECRETAIRE').catch(() => ({ data: [] })),
    ]).then(([clientsRes, avocatsRes, casesRes, stagiairesRes, secretairesRes]) => {
      setDataClients(clientsRes.data || []);
      setDataMembres(avocatsRes.data || []);
      setDataAffaires(casesRes.data || []);
      setDataStaff([...(stagiairesRes.data || []), ...(secretairesRes.data || [])]);
    }).finally(() => setLoading(false));
  }, []);

  const categories = [
    { key: 'all',      label: 'Tout',                icon: 'fas fa-th' },
    { key: 'clients',  label: 'Clients',             icon: 'fas fa-users' },
    { key: 'barreau',  label: 'Membres du barreau',  icon: 'fas fa-gavel' },
    { key: 'affaires', label: 'Affaires juridiques', icon: 'fas fa-folder-open' },
    { key: 'staff',    label: 'Staff',               icon: 'fas fa-user-tie' },
  ];

  const getFilteredResults = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    const results = [];

    const matchUser = (u) => {
      const fullName = `${u.prenom || ''} ${u.nom || ''}`.toLowerCase();
      return fullName.includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.tel || '').includes(query);
    };

    const matchCase = (c) =>
      (c.case_number || '').toLowerCase().includes(query) ||
      (c.client_full_name || '').toLowerCase().includes(query) ||
      (c.case_type || '').toLowerCase().includes(query);

    if (activeCategory === 'all' || activeCategory === 'clients') {
      dataClients.filter(matchUser).forEach(u =>
        results.push({ ...u, category: 'clients', _name: `${u.prenom || ''} ${u.nom || ''}`.trim() })
      );
    }
    if (activeCategory === 'all' || activeCategory === 'barreau') {
      dataMembres.filter(matchUser).forEach(u =>
        results.push({ ...u, category: 'barreau', _name: `${u.prenom || ''} ${u.nom || ''}`.trim() })
      );
    }
    if (activeCategory === 'all' || activeCategory === 'affaires') {
      dataAffaires.filter(matchCase).forEach(c =>
        results.push({ ...c, category: 'affaires' })
      );
    }
    if (activeCategory === 'all' || activeCategory === 'staff') {
      dataStaff.filter(matchUser).forEach(u =>
        results.push({ ...u, category: 'staff', _name: `${u.prenom || ''} ${u.nom || ''}`.trim() })
      );
    }

    return results;
  };

  const filteredResults = getFilteredResults();

  const getCategoryLabel = (category) => categories.find(c => c.key === category)?.label || '';
  const getCategoryIcon  = (category) => categories.find(c => c.key === category)?.icon || 'fas fa-circle';

  const STATUS_MAP = { OPEN: 'En cours', CLOSED: 'Clôturé', PENDING: 'En attente' };

  return (
    <div className="recherche-globale-page">

      <div className="recherche-header">
        <h1 className="recherche-title">
          <i className="fas fa-search"></i> Recherche Globale
        </h1>
        <p className="recherche-description">
          Recherchez rapidement dans toutes les données du cabinet
        </p>
      </div>

      <div className="search-main-wrapper">
        <div className="search-main-input">
          <i className="fas fa-search search-main-icon"></i>
          <input
            type="text"
            placeholder="Rechercher un client, une affaire, un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      <div className="category-filters">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`category-btn ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <i className={cat.icon}></i>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="search-placeholder">
          <i className="fas fa-spinner fa-spin"></i>
          <h3>Chargement des données...</h3>
        </div>
      ) : searchQuery.trim() ? (
        <div className="results-section">
          <div className="results-header">
            <span className="results-count">
              {filteredResults.length} résultat{filteredResults.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>Aucun résultat trouvé</p>
              <small>Essayez avec d'autres mots-clés</small>
            </div>
          ) : (
            <div className="results-grid">
              {filteredResults.map((item, index) => (
                <div key={`${item.category}-${item.idu || item.idc || index}`} className="result-card">

                  <div className={`result-category-badge ${item.category}`}>
                    <i className={getCategoryIcon(item.category)}></i>
                    <span>{getCategoryLabel(item.category)}</span>
                  </div>

                  {(item.category === 'clients' || item.category === 'barreau' || item.category === 'staff') && (
                    <>
                      <h3 className="result-title">{item._name || '—'}</h3>
                      <div className="result-meta">
                        {item.tel && <span><i className="fas fa-phone"></i> {item.tel}</span>}
                        {item.email && <span><i className="fas fa-envelope"></i> {item.email}</span>}
                        {item.category === 'staff' && item.roles && (
                          <span><i className="fas fa-briefcase"></i> {Array.isArray(item.roles) ? item.roles[0] : item.roles}</span>
                        )}
                      </div>
                    </>
                  )}

                  {item.category === 'affaires' && (
                    <>
                      <div className="result-numero">{item.case_number}</div>
                      <h3 className="result-title">{item.case_type || '—'}</h3>
                      <div className="result-meta">
                        {item.case_type && <span><i className="fas fa-tag"></i> {item.case_type}</span>}
                        {item.client_full_name && <span><i className="fas fa-user"></i> {item.client_full_name}</span>}
                        {item.status && (
                          <span className={`status-badge ${item.status === 'OPEN' ? 'encours' : 'cloture'}`}>
                            {STATUS_MAP[item.status] || item.status}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  <div className="result-actions">
                    <button className="result-btn btn-view">
                      <i className="fas fa-eye"></i> Voir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="search-placeholder">
          <i className="fas fa-search"></i>
          <h3>Commencez votre recherche</h3>
          <p>Tapez un nom, un numéro de dossier, un téléphone ou un email</p>
        </div>
      )}
    </div>
  );
};

export default RechercheGlobale;
