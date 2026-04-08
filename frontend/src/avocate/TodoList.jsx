import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getUsersByRole } from '../api';
import { useAuth } from '../AuthContext';
import './TodoList.css';

const BACKEND = 'http://localhost:8081';

const PRIO_CONFIG = {
  HIGH:   { label: 'Urgent',  color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
  MEDIUM: { label: 'Normal',  color: '#d97706', bg: '#fef3c7', border: '#f59e0b' },
  LOW:    { label: 'Faible',  color: '#2563eb', bg: '#dbeafe', border: '#60a5fa' },
};

const STATUS_CONFIG = {
  PENDING:     { label: 'À faire',  icon: 'fas fa-clock',         color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  IN_PROGRESS: { label: 'En cours', icon: 'fas fa-hourglass-half', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  COMPLETED:   { label: 'Terminé',  icon: 'fas fa-check-circle',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const mapTask = t => ({
  id: t.id,
  title: t.title || '',
  description: t.description || '',
  priority: t.priority || 'MEDIUM',
  status: t.status || 'PENDING',
  deadline: t.deadline ? t.deadline.split('T')[0] : '',
  assignedToId: t.assignedToId || null,
  assignedToName: t.assignedToName || null,
  assignedToPhotoUrl: t.assignedToPhotoUrl
    ? (t.assignedToPhotoUrl.startsWith('http') ? t.assignedToPhotoUrl : `${BACKEND}${t.assignedToPhotoUrl}`)
    : null,
  createdById: t.createdById || null,
  createdByName: t.createdByName || null,
  feedback: t.feedback || '',
});

const EMPTY_FORM = { title: '', description: '', priority: 'MEDIUM', status: 'PENDING', deadline: '', assignedToId: '' };

const AssigneeAvatar = ({ photoUrl, name, size = 32 }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';
  if (photoUrl) {
    return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const TodoList = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    Promise.all([
      getTasks(),
      getUsersByRole('AVOCAT').catch(() => ({ data: [] })),
      getUsersByRole('STAGIAIRE').catch(() => ({ data: [] })),
      getUsersByRole('SECRETAIRE').catch(() => ({ data: [] })),
    ]).then(([tasksRes, avocats, stagiaires, secretaires]) => {
      setTasks(tasksRes.data.map(mapTask));
      setStaff([...avocats.data, ...stagiaires.data, ...secretaires.data]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // ── Derived ──────────────────────────────────────────────────────
  const isOverdue = (t) => {
    if (!t.deadline || t.status === 'COMPLETED') return false;
    return new Date(t.deadline) < new Date(new Date().toDateString());
  };

  const applyFilters = (list) => list.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    const matchPrio = !filterPriority || t.priority === filterPriority;
    return matchSearch && matchPrio;
  });

  const sortCards = (list) => [...list].sort((a, b) => {
    if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
    const prioOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (prioOrder[a.priority] !== prioOrder[b.priority]) return prioOrder[a.priority] - prioOrder[b.priority];
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    return 0;
  });

  const filtered = applyFilters(tasks);
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    todo: tasks.filter(t => t.status === 'PENDING').length,
    overdue: tasks.filter(t => isOverdue(t)).length,
  };
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // ── CRUD ─────────────────────────────────────────────────────────
  const buildPayload = (f, taskId = null) => ({
    ...(taskId ? { id: taskId } : {}),
    title: f.title,
    description: f.description,
    deadline: f.deadline ? f.deadline + 'T00:00:00' : null,
    status: f.status,
    priority: f.priority,
    assignedTo: f.assignedToId ? { idu: parseInt(f.assignedToId) } : null,
    createdBy: user?.idu ? { idu: user.idu } : null,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    const isEdit = !!editTask;
    const call = isEdit ? updateTask(editTask.id, buildPayload(form, editTask.id)) : createTask(buildPayload(form));
    call
      .then(res => {
        const saved = mapTask(res.data);
        setTasks(prev => isEdit ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]);
        closeModal();
      })
      .catch(() => alert('Erreur lors de la sauvegarde'))
      .finally(() => setSaving(false));
  };

  const handleStatusChange = (task, newStatus) => {
    const payload = buildPayload({ ...task, status: newStatus, assignedToId: task.assignedToId }, task.id);
    updateTask(task.id, payload)
      .then(res => setTasks(prev => prev.map(t => t.id === task.id ? mapTask(res.data) : t)))
      .catch(console.error);
  };

  const handleDelete = (id) => {
    deleteTask(id)
      .then(() => setTasks(prev => prev.filter(t => t.id !== id)))
      .catch(console.error)
      .finally(() => setDeleteConfirm(null));
  };

  const openCreate = () => {
    setEditTask(null);
    setForm({ ...EMPTY_FORM, status: 'PENDING' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description, priority: task.priority, status: task.status, deadline: task.deadline, assignedToId: task.assignedToId ? String(task.assignedToId) : '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTask(null); setForm(EMPTY_FORM); };

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>;

  return (
    <>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}><i className="fas fa-tasks"></i> Gestion des Tâches</h1>
          <p className="page-description" style={{ margin: '0.3rem 0 0', color: '#64748b' }}>Organisez et suivez les tâches du cabinet</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="view-toggle">
            <button className={`view-btn${view === 'kanban' ? ' active' : ''}`} onClick={() => setView('kanban')} title="Vue Kanban"><i className="fas fa-th-large"></i></button>
            <button className={`view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} title="Vue Liste"><i className="fas fa-list"></i></button>
          </div>
          <button className="btn-add-task" onClick={() => openCreate()}><i className="fas fa-plus"></i> Nouvelle tâche</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><i className="fas fa-clipboard-list"></i></div>
          <div className="stat-content"><h3>{stats.total}</h3><p>Total des tâches</p></div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="stat-content"><h3>{stats.completed}</h3><p>Terminées</p></div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-icon"><i className="fas fa-hourglass-half"></i></div>
          <div className="stat-content"><h3>{stats.inProgress}</h3><p>En cours</p></div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
          <div className="stat-content"><h3>{stats.overdue}</h3><p>En retard</p></div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {stats.total > 0 && (
        <div className="progress-bar-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Avancement global</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>{completionPct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
            {STATUS_ORDER.map(s => (
              <span key={s} style={{ fontSize: '0.78rem', color: STATUS_CONFIG[s].color, fontWeight: 600 }}>
                <i className={STATUS_CONFIG[s].icon} style={{ marginRight: '0.3rem' }}></i>
                {tasks.filter(t => t.status === s).length} {STATUS_CONFIG[s].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="filters-container">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Rechercher une tâche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><i className="fas fa-times"></i></button>}
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="filter-select">
          <option value="">Toutes les priorités</option>
          <option value="HIGH">Urgent</option>
          <option value="MEDIUM">Normal</option>
          <option value="LOW">Faible</option>
        </select>
      </div>

      {/* ── KANBAN VIEW ── */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {STATUS_ORDER.map(status => {
            const cfg = STATUS_CONFIG[status];
            const col = sortCards(filtered.filter(t => t.status === status));
            return (
              <div key={status} className="kanban-column" style={{ '--col-border': cfg.border, '--col-bg': cfg.bg }}>
                <div className="kanban-col-header" style={{ borderBottom: `2px solid ${cfg.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <i className={cfg.icon} style={{ color: cfg.color }}></i>
                    <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.95rem' }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="col-count" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{col.length}</span>
                    {status === 'PENDING' && (
                      <button className="col-add-btn" onClick={() => openCreate()} title="Ajouter une tâche"><i className="fas fa-plus"></i></button>
                    )}
                  </div>
                </div>
                <div className="kanban-cards">
                  {col.length === 0 && (
                    status === 'PENDING' ? (
                      <div className="col-empty" onClick={() => openCreate()}>
                        <i className="fas fa-plus-circle"></i>
                        <span>Ajouter une tâche</span>
                      </div>
                    ) : (
                      <div className="col-empty-static">
                        <i className="fas fa-inbox"></i>
                        <span>Aucune tâche</span>
                      </div>
                    )
                  )}
                  {col.map(task => {
                    const prio = PRIO_CONFIG[task.priority] || PRIO_CONFIG.MEDIUM;
                    const overdue = isOverdue(task);
                    const idx = STATUS_ORDER.indexOf(status);
                    return (
                      <div key={task.id} className={`task-card${overdue ? ' task-card-overdue' : ''}`} style={{ borderLeft: `4px solid ${prio.border}` }}>
                        {overdue && <div className="overdue-ribbon"><i className="fas fa-exclamation-triangle"></i> En retard</div>}

                        <div className="task-card-body" onClick={() => openEdit(task)}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span className={`task-card-title${task.status === 'COMPLETED' ? ' completed' : ''}`}>{task.title}</span>
                            <span className="prio-dot" style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.border}` }}>{prio.label}</span>
                          </div>
                          {task.description && (
                            <p className="task-card-desc">{task.description.substring(0, 90)}{task.description.length > 90 ? '…' : ''}</p>
                          )}
                        </div>

                        <div className="task-card-footer">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {task.assignedToName ? (
                              <>
                                <AssigneeAvatar photoUrl={task.assignedToPhotoUrl} name={task.assignedToName} size={26} />
                                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{task.assignedToName}</span>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Non assigné</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {task.deadline && (
                              <span style={{ fontSize: '0.75rem', color: overdue ? '#ef4444' : '#64748b', fontWeight: overdue ? 700 : 400 }}>
                                <i className="fas fa-calendar-alt" style={{ marginRight: '0.25rem' }}></i>{formatDate(task.deadline)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="task-card-actions">
                          {idx > 0 && (
                            <button className="move-btn move-left" onClick={() => handleStatusChange(task, STATUS_ORDER[idx - 1])} title={`Déplacer vers "${STATUS_CONFIG[STATUS_ORDER[idx - 1]].label}"`}>
                              <i className="fas fa-arrow-left"></i>
                            </button>
                          )}
                          <button className="action-edit" onClick={() => openEdit(task)} title="Modifier"><i className="fas fa-pencil-alt"></i></button>
                          <button className="action-delete" onClick={() => setDeleteConfirm(task.id)} title="Supprimer"><i className="fas fa-trash-alt"></i></button>
                          {idx < STATUS_ORDER.length - 1 && (
                            <button className="move-btn move-right" onClick={() => handleStatusChange(task, STATUS_ORDER[idx + 1])} title={`Déplacer vers "${STATUS_CONFIG[STATUS_ORDER[idx + 1]].label}"`}>
                              <i className="fas fa-arrow-right"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="no-tasks"><i className="fas fa-clipboard-list"></i><p>Aucune tâche trouvée</p></div>
          ) : (
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Tâche</th>
                  <th>Assigné à</th>
                  <th>Priorité</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortCards(filtered).map(task => {
                  const prio = PRIO_CONFIG[task.priority] || PRIO_CONFIG.MEDIUM;
                  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task.id} className={overdue ? 'row-overdue' : ''}>
                      <td>
                        <div className="task-cell">
                          <div className="task-title-row">
                            <span className={`task-title${task.status === 'COMPLETED' ? ' completed' : ''}`}>{task.title}</span>
                            {overdue && <span className="overdue-badge"><i className="fas fa-exclamation-triangle"></i> Retard</span>}
                          </div>
                          {task.description && <p className="task-description">{task.description.substring(0, 100)}{task.description.length > 100 ? '…' : ''}</p>}
                        </div>
                      </td>
                      <td>
                        {task.assignedToName ? (
                          <div className="assigned-info">
                            <AssigneeAvatar photoUrl={task.assignedToPhotoUrl} name={task.assignedToName} size={36} />
                            <span className="assigned-name">{task.assignedToName}</span>
                          </div>
                        ) : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>}
                      </td>
                      <td>
                        <span className="priority-badge" style={{ background: prio.bg, color: prio.color }}>
                          {prio.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.88rem', color: overdue ? '#ef4444' : '#64748b', fontWeight: overdue ? 700 : 400 }}>
                          <i className="fas fa-calendar-alt" style={{ marginRight: '0.4rem', color: overdue ? '#ef4444' : '#1e3a8a' }}></i>
                          {task.deadline ? formatDate(task.deadline) : '—'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task, e.target.value)}
                          className={`status-select status-${task.status.toLowerCase().replace('_', '-')}`}
                          style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                        >
                          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-action btn-edit" onClick={() => openEdit(task)} title="Modifier"><i className="fas fa-pencil-alt"></i></button>
                          <button className="btn-action btn-delete" onClick={() => setDeleteConfirm(task.id)} title="Supprimer"><i className="fas fa-trash-alt"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODAL CREATE / EDIT ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className={`fas fa-${editTask ? 'pencil-alt' : 'plus-circle'}`}></i> {editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
              <button className="btn-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label><i className="fas fa-heading"></i> Titre *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre de la tâche" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-align-left"></i> Description</label>
                  <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description détaillée (optionnel)" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fas fa-exclamation-circle"></i> Priorité</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="LOW">Faible</option>
                      <option value="MEDIUM">Normal</option>
                      <option value="HIGH">Urgent</option>
                    </select>
                  </div>
                  {editTask && (
                    <div className="form-group">
                      <label><i className="fas fa-tasks"></i> Statut</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label><i className="fas fa-calendar-alt"></i> Date d'échéance</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div className="form-group form-group-highlight">
                  <label htmlFor="assignee-select"><i className="fas fa-user-check"></i> Assigné à</label>
                  <select id="assignee-select" value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                    <option value="">— Non assigné —</option>
                    {staff.map(s => (
                      <option key={s.idu} value={s.idu}>{s.nom} {s.prenom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}><i className="fas fa-times"></i> Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <i className={`fas fa-${saving ? 'spinner fa-spin' : 'check'}`}></i> {editTask ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
              <h2><i className="fas fa-trash-alt"></i> Supprimer la tâche</h2>
              <button className="btn-close" onClick={() => setDeleteConfirm(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#475569', lineHeight: 1.6 }}>Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}>
                <i className="fas fa-trash-alt"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TodoList;
