import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getTasksByAssignee } from '../api';
import './Membredetailav.css';

const mapTaskStatus = (s) => ({ PENDING: 'En attente', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé' }[s] || s);

const getInitials = (m) => `${(m.prenom || '').charAt(0)}${(m.nom || '').charAt(0)}`;

const getStatusMeta = (statut) =>
  statut === 'Actif'
    ? { cls: 'status-actif', icon: 'fa-circle-check' }
    : { cls: 'status-inactif', icon: 'fa-circle-xmark' };

const MembreDetailav = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membre, setMembre] = useState(null);
  const [taches, setTaches] = useState([]);
  const [activeTab, setActiveTab] = useState('taches');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tasksRes] = await Promise.all([
          getUser(id),
          getTasksByAssignee(id).catch(() => ({ data: [] })),
        ]);
        const u = userRes.data;
        const roles = u.roles || [];
        const isStage = roles.includes('STAGIAIRE');
        const roleLabel = isStage ? 'Stagiaire avocat' : 'Secrétaire juridique';

        const mappedTaches = (tasksRes.data || []).map(t => ({
          id: t.id,
          titre: t.title,
          statut: mapTaskStatus(t.status),
          priorite: t.priority,
          deadline: t.deadline ? new Date(t.deadline).toLocaleDateString('fr-FR') : '—',
        }));

        setMembre({
          id: u.idu,
          nom: u.nom || '',
          prenom: u.prenom || '',
          titre: `${u.prenom || ''} ${u.nom || ''}`.trim(),
          specialite: roleLabel,
          email: u.email || '',
          tel: u.tel || '—',
          adresse: u.adresse || '—',
          statut: u.statut || 'Actif',
          anneeInscription: u.created_at ? new Date(u.created_at).getFullYear().toString() : '—',
        });
        setTaches(mappedTaches);
        setLoading(false);
        setTimeout(() => setVisible(true), 80);
      } catch (_) {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="md-wrapper"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  if (!membre) {
    return (
      <div className="md-not-found">
        <i className="fas fa-user-slash"></i>
        <h2>Membre introuvable</h2>
        <button onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
      </div>
    );
  }

  const statusMeta = getStatusMeta(membre.statut);
  const experience = membre.anneeInscription !== '—'
    ? new Date().getFullYear() - parseInt(membre.anneeInscription, 10)
    : '—';

  const tabs = [
    { key: 'taches',    label: 'Tâches assignées', icon: 'fa-tasks',         count: taches.length },
    { key: 'audiences', label: 'Audiences',         icon: 'fa-calendar-alt',  count: 0 },
    { key: 'formations',label: 'Formations',         icon: 'fa-graduation-cap',count: 0 },
  ];

  return (
    <div className={`md-wrapper ${visible ? 'md-visible' : ''}`}>

      {/* ── Back ── */}
      <button className="md-back-btn" onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i>
        <span>Retour aux membres</span>
      </button>

      {/* ── Hero ── */}
      <div className="md-hero">
        <div className="md-hero-bg-pattern" aria-hidden="true" />
        <div className="md-hero-orb md-orb1" aria-hidden="true" />
        <div className="md-hero-orb md-orb2" aria-hidden="true" />

        <div className="md-hero-content">
          <div className="md-avatar-ring">
            <div className="md-avatar">{getInitials(membre)}</div>
          </div>

          <div className="md-hero-identity">
            <div className="md-hero-badges">
              <span className={`md-status-badge ${statusMeta.cls}`}>
                <i className={`fas ${statusMeta.icon}`}></i>
                {membre.statut}
              </span>
            </div>

            <h1 className="md-hero-name">{membre.titre}</h1>

            <p className="md-hero-specialite">
              <i className="fas fa-briefcase"></i>
              {membre.specialite}
            </p>

            <div className="md-hero-contacts">
              <a href={`mailto:${membre.email}`} className="md-contact-chip">
                <i className="fas fa-envelope"></i>
                {membre.email}
              </a>
              <a href={`tel:${membre.tel}`} className="md-contact-chip">
                <i className="fas fa-phone"></i>
                {membre.tel}
              </a>
              {membre.adresse !== '—' && (
                <span className="md-contact-chip">
                  <i className="fas fa-map-marker-alt"></i>
                  {membre.adresse}
                </span>
              )}
            </div>
          </div>

          <div className="md-hero-actions">
            <a href={`mailto:${membre.email}`} className="md-action-btn md-btn-email">
              <i className="fas fa-paper-plane"></i>
              Envoyer un e-mail
            </a>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="md-kpi-strip">
          <div className="md-kpi-item">
            <span className="md-kpi-number">{experience}</span>
            <span className="md-kpi-label">Ans d'exp.</span>
          </div>
          <div className="md-kpi-divider" />
          <div className="md-kpi-item">
            <span className="md-kpi-number">{membre.anneeInscription}</span>
            <span className="md-kpi-label">Rejoint</span>
          </div>
          <div className="md-kpi-divider" />
          <div className="md-kpi-item">
            <span className="md-kpi-number">{taches.length}</span>
            <span className="md-kpi-label">Tâches</span>
          </div>
          <div className="md-kpi-divider" />
          <div className="md-kpi-item">
            <span className="md-kpi-number">{taches.filter(t => t.statut === 'En cours').length}</span>
            <span className="md-kpi-label">En cours</span>
          </div>
          <div className="md-kpi-divider" />
          <div className="md-kpi-item">
            <span className="md-kpi-number">{taches.filter(t => t.statut === 'Terminé').length}</span>
            <span className="md-kpi-label">Terminées</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="md-body">
        <div className="md-tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`md-tab-btn ${activeTab === tab.key ? 'md-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
              <span className="md-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Tâches ── */}
        {activeTab === 'taches' && (
          <div className="md-tab-content md-appear">
            {taches.length === 0 ? (
              <EmptyState icon="fa-tasks" message="Aucune tâche assignée" />
            ) : (
              <div className="md-table-wrap">
                <table className="md-table">
                  <thead>
                    <tr>
                      <th><i className="fas fa-tasks"></i> Tâche</th>
                      <th><i className="fas fa-flag"></i> Priorité</th>
                      <th><i className="fas fa-calendar"></i> Échéance</th>
                      <th><i className="fas fa-info-circle"></i> Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taches.map((t, i) => (
                      <tr key={i} className="md-table-row">
                        <td>{t.titre}</td>
                        <td>{t.priorite || '—'}</td>
                        <td>{t.deadline}</td>
                        <td>
                          <span className={`md-num-badge ${t.statut === 'En cours' ? '' : ''}`}>
                            {t.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Audiences ── */}
        {activeTab === 'audiences' && (
          <div className="md-tab-content md-appear">
            <EmptyState icon="fa-calendar-times" message="Aucune audience programmée" />
          </div>
        )}

        {/* ── Tab: Formations ── */}
        {activeTab === 'formations' && (
          <div className="md-tab-content md-appear">
            <EmptyState icon="fa-graduation-cap" message="Aucune formation enregistrée" />
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, message }) => (
  <div className="md-empty">
    <div className="md-empty-icon"><i className={`fas ${icon}`}></i></div>
    <p>{message}</p>
  </div>
);

export default MembreDetailav;
