import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Recherche.css';

const Recherche = () => {
  const navigate = useNavigate();

  const searchCategories = [
    { id: 'clients', icon: 'fas fa-users', title: 'Clients', description: 'Rechercher parmi vos clients', path: '/clients' },
    { id: 'membre', icon: 'fas fa-user-friends', title: 'Membres', description: 'Rechercher parmi les membres', path: '/membre' },
    { id: 'staff', icon: 'fas fa-briefcase', title: 'Staff', description: 'Rechercher dans le personnel', path: '/staff' },
    { id: 'affaires', icon: 'fas fa-gavel', title: 'Affaires Judiciaires', description: 'Rechercher parmi vos dossiers', path: '/affjud' }
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Recherche Avancée</h1>
        <p className="page-description">Sélectionnez une catégorie pour accéder aux outils de recherche spécifiques.</p>
      </div>

      <div className="search-section">
        <div className="search-options">
          {searchCategories.map((category) => (
            <div key={category.id} className="search-option">
              <i className={category.icon}></i>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <button className="search-btn" onClick={() => navigate(category.path)}>
                <i className="fas fa-arrow-right"></i> Accéder
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Recherche;
