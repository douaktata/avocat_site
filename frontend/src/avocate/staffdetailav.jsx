import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getTasksByAssignee, updateUser, deleteUser, createTask } from '../api';
import './Staffdetail.css';

const mapTaskStatus = (s) => ({ PENDING: 'En attente', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé' }[s] || s);

const getRoleColor = (role) => {
  const colors = { 'Secrétaire': '#3b82f6', 'Stagiaire': '#10b981' };
  return colors[role] || '#64748b';
};

const StaffDetailav = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membre, setMembre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', deadline: '', priority: 'MEDIUM' });
  const [taskSaving, setTaskSaving] = useState(false);

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
        const roleLabel = isStage ? 'Stagiaire' : 'Secrétaire';
        const poste = isStage ? 'Stagiaire avocat' : 'Secrétaire juridique';

        const taches = (tasksRes.data || []).map(t => ({
          titre: t.title,
          statut: mapTaskStatus(t.status),
        }));

        setMembre({
          id: u.idu,
          nom: u.nom || '',
          prenom: u.prenom || '',
          poste,
          role: roleLabel,
          email: u.email || '',
          tel: u.tel || '—',
          statut: u.statut || 'Actif',
          competences: [],
          taches,
          formations: [],
          dateEmbauche: u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—',
        });
        setLoading(false);
      } catch (_) {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const openEdit = () => {
    setEditForm({ nom: membre.nom, prenom: membre.prenom, email: membre.email, tel: membre.tel === '—' ? '' : membre.tel, adresse: membre.adresse || '' });
    setShowEdit(true);
  };

  const handleToggleStatut = () => {
    const newStatut = membre.statut === 'Actif' ? 'Inactif' : 'Actif';
    updateUser(id, { statut: newStatut })
      .then(() => setMembre(prev => ({ ...prev, statut: newStatut })))
      .catch(() => alert('Erreur lors du changement de statut'));
  };

  const handleDelete = () => {
    if (!window.confirm(`Supprimer ${membre.prenom} ${membre.nom} ? Cette action est irréversible.`)) return;
    deleteUser(id)
      .then(() => navigate(-1))
      .catch(() => alert('Erreur lors de la suppression'));
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    setTaskSaving(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    createTask({
      title: taskForm.title,
      deadline: taskForm.deadline ? taskForm.deadline + 'T00:00:00' : null,
      priority: taskForm.priority,
      status: 'PENDING',
      assignedTo: { idu: parseInt(id) },
      createdBy: { idu: currentUser.idu },
    })
      .then(res => {
        setMembre(prev => ({ ...prev, taches: [...prev.taches, { titre: res.data.title, statut: 'En attente' }] }));
        setTaskForm({ title: '', deadline: '', priority: 'MEDIUM' });
        setShowTask(false);
      })
      .catch(() => alert('Erreur lors de la création de la tâche'))
      .finally(() => setTaskSaving(false));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditSaving(true);
    updateUser(id, editForm)
      .then(res => {
        const u = res.data;
        setMembre(prev => ({ ...prev, nom: u.nom || prev.nom, prenom: u.prenom || prev.prenom, email: u.email || prev.email, tel: u.tel || prev.tel }));
        setShowEdit(false);
      })
      .catch(err => alert(err.response?.data?.message || 'Erreur'))
      .finally(() => setEditSaving(false));
  };

  if (loading) return <div className="staff-detail-page"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  if (!membre) {
    return (
      <div className="staff-detail-page">
        <div className="not-found">
          <i className="fas fa-user-slash"></i>
          <h2>Membre non trouvé</h2>
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-detail-page">

      {/* HEADER */}
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>

        <div className="detail-title-section">
          <div
            className="detail-avatar-large"
            style={{ background: `linear-gradient(135deg, ${getRoleColor(membre.role)}, ${getRoleColor(membre.role)}cc)` }}
          >
            {membre.prenom.charAt(0)}{membre.nom.charAt(0)}
          </div>
          <div>
            <h1 className="detail-title">{membre.prenom} {membre.nom}</h1>
            <p style={{ fontSize: '1.125rem', margin: '0.5rem 0', color: '#64748b' }}>{membre.poste}</p>
            <span className={`detail-status status-${(membre.statut || '').toLowerCase()}`}>{membre.statut}</span>
          </div>
        </div>

        <div className="detail-actions">
          <a href={`mailto:${membre.email}`} className="btn-action btn-email">
            <i className="fas fa-envelope"></i> Envoyer un email
          </a>
          <button className="btn-action btn-edit" onClick={openEdit}>
            <i className="fas fa-edit"></i> Modifier
          </button>
          <button
            className="btn-action"
            style={{ background: membre.statut === 'Actif' ? '#fef3c7' : '#d1fae5', color: membre.statut === 'Actif' ? '#92400e' : '#065f46', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600 }}
            onClick={handleToggleStatut}
          >
            <i className={`fas fa-${membre.statut === 'Actif' ? 'lock' : 'lock-open'}`}></i>
            {membre.statut === 'Actif' ? ' Bloquer' : ' Débloquer'}
          </button>
          <button className="btn-action" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600 }} onClick={handleDelete}>
            <i className="fas fa-trash"></i> Supprimer
          </button>
          <button className="btn-action" style={{ background: '#ede9fe', color: '#5b21b6', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600 }} onClick={() => setShowTask(true)}>
            <i className="fas fa-tasks"></i> Assigner tâche
          </button>
        </div>
      </div>

      {/* INFORMATIONS */}
      <div className="detail-section">
        <h2 className="section-title"><i className="fas fa-info-circle"></i> Informations personnelles</h2>
        <div className="info-grid">
          <div className="info-card">
            <i className="fas fa-briefcase"></i>
            <div><label>Poste</label><p>{membre.poste}</p></div>
          </div>
          <div className="info-card">
            <i className="fas fa-tag"></i>
            <div><label>Rôle</label><p style={{ color: getRoleColor(membre.role) }}>{membre.role}</p></div>
          </div>
          <div className="info-card">
            <i className="fas fa-calendar-plus"></i>
            <div><label>Date d'embauche</label><p>{membre.dateEmbauche}</p></div>
          </div>
          <div className="info-card">
            <i className="fas fa-phone"></i>
            <div><label>Téléphone</label><p>{membre.tel}</p></div>
          </div>
          <div className="info-card info-full">
            <i className="fas fa-envelope"></i>
            <div><label>Email</label><p>{membre.email}</p></div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card stat-dossiers">
          <div className="stat-icon"><i className="fas fa-tasks"></i></div>
          <div className="stat-content">
            <span className="stat-number">{membre.taches.filter(t => t.statut === 'En cours').length}</span>
            <span className="stat-label">Tâches en cours</span>
          </div>
        </div>
        <div className="stat-card stat-rdv">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="stat-content">
            <span className="stat-number">{membre.taches.filter(t => t.statut === 'Terminé').length}</span>
            <span className="stat-label">Tâches terminées</span>
          </div>
        </div>
        <div className="stat-card stat-paiements">
          <div className="stat-icon"><i className="fas fa-graduation-cap"></i></div>
          <div className="stat-content">
            <span className="stat-number">{membre.formations.length}</span>
            <span className="stat-label">Formations</span>
          </div>
        </div>
      </div>

      {/* TÂCHES */}
      <div className="detail-section">
        <h2 className="section-title"><i className="fas fa-tasks"></i> Tâches</h2>
        {membre.taches.length === 0 ? (
          <div className="empty-state"><i className="fas fa-tasks"></i><p>Aucune tâche assignée</p></div>
        ) : (
          <div className="table-container">
            <table className="detail-table">
              <thead><tr><th>Tâche</th><th>Statut</th></tr></thead>
              <tbody>
                {membre.taches.map((tache, i) => (
                  <tr key={i} className={tache.statut === 'En cours' ? 'row-highlight' : ''}>
                    <td className="td-bold">{tache.titre}</td>
                    <td>
                      <span className={`status-pill ${tache.statut === 'En cours' ? 'badge-progress' : tache.statut === 'Terminé' ? 'badge-paid' : 'badge-upcoming'}`}>
                        {tache.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Assigner Tâche ── */}
      {showTask && (
        <div className="modal-overlay" onClick={() => setShowTask(false)}>
          <div className="modal-panel" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-hero" style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}>
              <div className="modal-identity">
                <h2><i className="fas fa-tasks" style={{ marginRight: '0.5rem' }}></i>Assigner une tâche — {membre.prenom} {membre.nom}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTask(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="modal-body-scroll" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Titre de la tâche *</label>
                  <input className="form-input" type="text" required placeholder="Ex: Préparer les documents..." value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Date limite</label>
                    <input className="form-input" type="date" value={taskForm.deadline} onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Priorité</label>
                    <select className="form-input" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                      <option value="LOW">Basse</option>
                      <option value="MEDIUM">Normale</option>
                      <option value="HIGH">Haute</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="mfooter-btn mfooter-close" onClick={() => setShowTask(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="mfooter-btn mfooter-email" disabled={taskSaving} style={{ background: '#5b21b6' }}>
                  <i className="fas fa-paper-plane"></i> {taskSaving ? 'Envoi...' : 'Assigner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Modifier ── */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-hero" style={{ background: `linear-gradient(135deg, ${getRoleColor(membre.role)}, ${getRoleColor(membre.role)}cc)` }}>
              <div className="modal-identity">
                <h2><i className="fas fa-edit" style={{ marginRight: '0.5rem' }}></i>Modifier — {membre.prenom} {membre.nom}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body-scroll" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[['nom','Nom'],['prenom','Prénom'],['email','Email'],['tel','Téléphone'],['adresse','Adresse']].map(([field, label]) => (
                  <div key={field} style={{ display:'flex', flexDirection:'column', gap:'0.3rem', gridColumn: (field==='email'||field==='adresse') ? '1/-1' : undefined }}>
                    <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#64748b' }}>{label}</label>
                    <input className="form-input" type={field==='email'?'email':'text'} value={editForm[field]||''} onChange={e => setEditForm(p=>({...p,[field]:e.target.value}))} />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="mfooter-btn mfooter-close" onClick={() => setShowEdit(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="mfooter-btn mfooter-email" disabled={editSaving}>
                  <i className="fas fa-save"></i> {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffDetailav;
