import React, { useState } from 'react';
import './RechercheGlob.css';

const RechercheGlob = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Données de recherche
  const [dataClients] = useState([
    { id: 1, nom: 'Jean Dubois', type: 'client', tel: '06 12 34 56 78', status: 'Actif', dossiers: 2 },
    { id: 2, nom: 'Sophie Martin', type: 'client', tel: '06 23 45 67 89', status: 'Actif', dossiers: 1 },
    { id: 3, nom: 'Pierre Bernard', type: 'client', tel: '06 34 56 78 90', status: 'Inactif', dossiers: 1 },
    { id: 4, nom: 'Marie Lefebvre', type: 'client', tel: '06 45 67 89 01', status: 'Actif', dossiers: 2 },
  ]);

  const [dataMembres] = useState([
    { id: 1, nom: 'Maître Hajaij', type: 'avocat', specialite: 'Droit civil', barreau: 'Paris' },
    { id: 2, nom: 'Maître Dupont', type: 'avocat', specialite: 'Droit pénal', barreau: 'Lyon' },
    { id: 3, nom: 'Maître Rousseau', type: 'avocat', specialite: 'Droit commercial', barreau: 'Paris' },
  ]);

  const [dataAffaires] = useState([
    { id: 1, numero: 'AFF-2024-001', nom: 'Divorce contentieux', type: 'Famille', client: 'Jean Dubois', statut: 'En cours' },
    { id: 2, numero: 'AFF-2024-003', nom: 'Rupture de contrat', type: 'Commercial', client: 'Sophie Martin', statut: 'En cours' },
    { id: 3, numero: 'AFF-2023-005', nom: 'Succession familiale', type: 'Famille', client: 'Pierre Bernard', statut: 'Clôturé' },
    { id: 4, numero: 'AFF-2024-004', nom: 'Litige locatif', type: 'Immobilier', client: 'Marie Lefebvre', statut: 'En cours' },
  ]);

  const [dataStaff] = useState([
    { id: 1, nom: 'Stagiaire Junior', type: 'staff', poste: 'Stagiaire', email: 'stagiaire@cabinet.com', tel: '06 11 22 33 44' },
    { id: 2, nom: 'Sophie Secrétaire', type: 'staff', poste: 'Secrétaire', email: 'secretaire@cabinet.com', tel: '06 22 33 44 55' },
    { id: 3, nom: 'Marc Comptable', type: 'staff', poste: 'Comptable', email: 'comptable@cabinet.com', tel: '06 33 44 55 66' },
  ]);

  const categories = [
    { key: 'all', label: 'Tout', icon: 'fas fa-th' },
    { key: 'clients', label: 'Clients', icon: 'fas fa-users' },
    { key: 'barreau', label: 'Membres du barreau', icon: 'fas fa-gavel' },
    { key: 'affaires', label: 'Affaires juridiques', icon: 'fas fa-folder-open' },
    { key: 'staff', label: 'Staff', icon: 'fas fa-user-tie' },
  ];

  // Fonction de recherche
  const getFilteredResults = () => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return [];

    let results = [];

    const addResults = (data, category) => {
      if (activeCategory === 'all' || activeCategory === category) {
        const filtered = data.filter(item => 
          item.nom.toLowerCase().includes(query) ||
          (item.numero && item.numero.toLowerCase().includes(query)) ||
          (item.tel && item.tel.includes(query)) ||
          (item.email && item.email.toLowerCase().includes(query))
        );
        results.push(...filtered.map(item => ({ ...item, category })));
      }
    };

    if (activeCategory === 'all' || activeCategory === 'clients') addResults(dataClients, 'clients');
    if (activeCategory === 'all' || activeCategory === 'barreau') addResults(dataMembres, 'barreau');
    if (activeCategory === 'all' || activeCategory === 'affaires') addResults(dataAffaires, 'affaires');
    if (activeCategory === 'all' || activeCategory === 'staff') addResults(dataStaff, 'staff');

    return results;
  };

  const filteredResults = getFilteredResults();

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.label : '';
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.icon : 'fas fa-circle';
  };

  return (
    <div className="recherche-globale-page">
      
      {/* Header */}
      <div className="recherche-header">
        <h1 className="recherche-title">
          <i className="fas fa-search"></i> Recherche Globale
        </h1>
        <p className="recherche-description">
          Recherchez rapidement dans toutes les données du cabinet
        </p>
      </div>

      {/* Barre de recherche principale */}
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
            <button 
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filtres par catégorie */}
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

      {/* Résultats */}
      {searchQuery.trim() ? (
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
                <div key={`${item.category}-${item.id}-${index}`} className="result-card">
                  
                  {/* Badge catégorie */}
                  <div className={`result-category-badge ${item.category}`}>
                    <i className={getCategoryIcon(item.category)}></i>
                    <span>{getCategoryLabel(item.category)}</span>
                  </div>

                  {/* Contenu selon le type */}
                  {item.category === 'clients' && (
                    <>
                      <h3 className="result-title">{item.nom}</h3>
                      <div className="result-meta">
                        <span><i className="fas fa-phone"></i> {item.tel}</span>
                        <span><i className="fas fa-folder"></i> {item.dossiers} dossier(s)</span>
                        <span className={`status-badge ${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </div>
                    </>
                  )}

                  {item.category === 'barreau' && (
                    <>
                      <h3 className="result-title">{item.nom}</h3>
                      <div className="result-meta">
                        <span><i className="fas fa-balance-scale"></i> {item.specialite}</span>
                        <span><i className="fas fa-map-marker-alt"></i> Barreau de {item.barreau}</span>
                      </div>
                    </>
                  )}

                  {item.category === 'affaires' && (
                    <>
                      <div className="result-numero">{item.numero}</div>
                      <h3 className="result-title">{item.nom}</h3>
                      <div className="result-meta">
                        <span><i className="fas fa-tag"></i> {item.type}</span>
                        <span><i className="fas fa-user"></i> {item.client}</span>
                        <span className={`status-badge ${item.statut === 'En cours' ? 'encours' : 'cloture'}`}>
                          {item.statut}
                        </span>
                      </div>
                    </>
                  )}

                  {item.category === 'staff' && (
                    <>
                      <h3 className="result-title">{item.nom}</h3>
                      <div className="result-meta">
                        <span><i className="fas fa-briefcase"></i> {item.poste}</span>
                        <span><i className="fas fa-envelope"></i> {item.email}</span>
                        <span><i className="fas fa-phone"></i> {item.tel}</span>
                      </div>
                    </>
                  )}

                  {/* Actions */}
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
          
          <div className="search-suggestions">
            <h4>Exemples de recherche :</h4>
            <div className="suggestion-pills">
              <button className="suggestion-pill" onClick={() => setSearchQuery('Dubois')}>
                <i className="fas fa-user"></i> Dubois
              </button>
              <button className="suggestion-pill" onClick={() => setSearchQuery('AFF-2024')}>
                <i className="fas fa-folder"></i> AFF-2024
              </button>
              <button className="suggestion-pill" onClick={() => setSearchQuery('Maître')}>
                <i className="fas fa-gavel"></i> Maître
              </button>
              <button className="suggestion-pill" onClick={() => setSearchQuery('Stagiaire')}>
                <i className="fas fa-user-tie"></i> Stagiaire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RechercheGlob;