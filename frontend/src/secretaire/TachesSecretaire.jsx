import React, { useState, useEffect, useMemo } from 'react';
import { getTasks, createTask, updateTask, getUsersByRole } from '../api';
import { useAuth } from '../AuthContext';
import './TachesSecretaire.css';

const API_BASE = 'http://localhost:8081';

const PRIORITY = {
  HIGH:   { label: 'Haute',   color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', icon: 'fa-arrow-up',   stripe: '#ef4444' },
  MEDIUM: { label: 'Moyenne', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', icon: 'fa-minus',      stripe: '#f59e0b' },
  LOW:    { label: 'Basse',   color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', icon: 'fa-arrow-down', stripe: '#10b981' },
};

const COLUMNS = [
  { key: 'PENDING',     label: 'À faire',  icon: 'fa-circle-dot',   color: '#64748b', headerBg: '#f8fafc', accentBg: '#f1f5f9' },
  { key: 'IN_PROGRESS', label: 'En cours', icon: 'fa-spinner',       color: '#3b82f6', headerBg: '#eff6ff', accentBg: '#dbeafe' },
  { key: 'COMPLETED',   label: 'Terminé',  icon: 'fa-circle-check',  color: '#10b981', headerBg: '#f0fdf4', accentBg: '#d1fae5' },
];

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
const isOverdue = d => d && new Date(d) < Date.now();
const isDueSoon = d => {
  if (!d) return false;
  const diff = new Date(d) - Date.now();
  return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
};

const Initials = ({ name }) => {
  const parts = (name || '?').split(' ');
  return <>{parts[0]?.[0]}{parts[1]?.[0]}</>;
};

const Avatar = ({ photoUrl, name, size = 28 }) => (
  <div className="tc-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
    {photoUrl
      ? <img src={`${API_BASE}${photoUrl}`} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
      : <Initials name={name} />
    }
  </div>
);

const TaskCard = ({ task, onStatus, listView }) => {
  const p = PRIORITY[task.priority] || PRIORITY.MEDIUM;
  const completed = task.status === 'COMPLETED';
  const overdue = !completed && isOverdue(task.deadline);
  const soon = !completed && !overdue && isDueSoon(task.deadline);

  return (
    <div className={`tc-card${completed ? ' tc-card-done' : ''}${listView ? ' tc-card-list' : ''}`}
         style={{ borderLeft: `4px solid ${p.stripe}` }}>

      {/* Top row: priority + (list: status badge) */}
      <div className="tc-card-top">
        <span className="tc-priority-pill" style={{ color: p.color, background: p.bg, border: `1px solid ${p.border}` }}>
          <i className={`fas ${p.icon}`}></i> {p.label}
        </span>
        {listView && (
          <span className="tc-status-pill" style={{
            color: COLUMNS.find(c => c.key === task.status)?.color || '#64748b',
            background: COLUMNS.find(c => c.key === task.status)?.accentBg || '#f1f5f9',
          }}>
            <i className={`fas ${COLUMNS.find(c => c.key === task.status)?.icon}`}></i>
            {COLUMNS.find(c => c.key === task.status)?.label}
          </span>
        )}
        {overdue && <span className="tc-overdue-pill"><i className="fas fa-triangle-exclamation"></i> En retard</span>}
      </div>

      {/* Title */}
      <h3 className={`tc-card-title${completed ? ' tc-done-text' : ''}`}>{task.title}</h3>

      {/* Description */}
      {task.description && (
        <p className={`tc-card-desc${completed ? ' tc-done-text' : ''}`}>{task.description}</p>
      )}

      {/* Footer: assignee + deadline */}
      <div className="tc-card-footer">
        {task.assignedToName ? (
          <div className="tc-assignee">
            <Avatar photoUrl={task.assignedToPhotoUrl} name={task.assignedToName} size={26} />
            <span>{task.assignedToName}</span>
          </div>
        ) : (
          <div className="tc-assignee tc-no-assignee">
            <i className="fas fa-user-slash"></i> Non assigné
          </div>
        )}

        {task.deadline && (
          <div className={`tc-deadline${overdue ? ' tc-deadline-overdue' : ''}${soon ? ' tc-deadline-soon' : ''}`}>
            <i className={`fas ${overdue ? 'fa-triangle-exclamation' : ''} ${soon ? 'fa-clock' : ''} ${!overdue && !soon ? 'fa-calendar' : ''}`}></i>
            {fmtDate(task.deadline)}
          </div>
        )}
      </div>

      {/* Created by */}
      {task.createdByName && (
        <div className="tc-created-by">
          <i className="fas fa-pen-to-square"></i> Par {task.createdByName}
        </div>
      )}

      {/* Actions */}
      {!completed && (
        <div className="tc-card-actions">
          {task.status === 'PENDING' && (
            <button className="tc-btn tc-btn-start" onClick={() => onStatus(task.id, 'IN_PROGRESS')}>
              <i className="fas fa-play"></i> Commencer
            </button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button className="tc-btn tc-btn-back" onClick={() => onStatus(task.id, 'PENDING')}>
              <i className="fas fa-rotate-left"></i>
            </button>
          )}
          <button className="tc-btn tc-btn-done" onClick={() => onStatus(task.id, 'COMPLETED')}>
            <i className="fas fa-check"></i> Terminer
          </button>
        </div>
      )}
      {completed && (
        <div className="tc-card-done-banner">
          <i className="fas fa-circle-check"></i> Tâche terminée
        </div>
      )}
    </div>
  );
};

const TachesSecretaire = () => {
  const { user } = useAuth();

  const [tasks,       setTasks]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [view,        setView]        = useState('kanban'); // 'kanban' | 'list'
  const [search,      setSearch]      = useState('');
  const [filterPrio,  setFilterPrio]  = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM',
    deadline: '', assignedToId: '',
  });

  useEffect(() => {
    Promise.all([
      getTasks().catch(() => ({ data: [] })),
      getUsersByRole('AVOCAT').catch(() => ({ data: [] })),
      getUsersByRole('SECRETAIRE').catch(() => ({ data: [] })),
      getUsersByRole('STAGIAIRE').catch(() => ({ data: [] })),
    ]).then(([tasksRes, av, sec, stag]) => {
      setTasks(tasksRes.data || []);
      setUsers([
        ...(av.data || []).map(u => ({ ...u, roleLabel: 'Avocat' })),
        ...(sec.data || []).map(u => ({ ...u, roleLabel: 'Secrétaire' })),
        ...(stag.data || []).map(u => ({ ...u, roleLabel: 'Stagiaire' })),
      ]);
    }).catch(() => setError('Impossible de charger les tâches'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { ...task, status: newStatus })
      .then(res => setTasks(prev => prev.map(t => t.id === taskId ? res.data : t)))
      .catch(console.error);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: 'PENDING',
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      assignedTo: form.assignedToId ? { idu: Number(form.assignedToId) } : null,
      createdBy: user?.idu ? { idu: user.idu } : null,
    };
    try {
      const res = await createTask(payload);
      setTasks(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '' });
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => tasks.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchPrio = !filterPrio || t.priority === filterPrio;
    return matchSearch && matchPrio;
  }), [tasks, search, filterPrio]);

  const stats = useMemo(() => ({
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed:  tasks.filter(t => t.status === 'COMPLETED').length,
    urgent:     tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length,
    overdue:    tasks.filter(t => t.status !== 'COMPLETED' && isOverdue(t.deadline)).length,
  }), [tasks]);

  if (loading) return (
    <div className="tc-page">
      <div className="tc-loading">
        <i className="fas fa-spinner fa-spin"></i> Chargement...
      </div>
    </div>
  );

  if (error) return (
    <div className="tc-page">
      <div className="tc-error"><i className="fas fa-exclamation-circle"></i> {error}</div>
    </div>
  );

  return (
    <div className="tc-page">

      {/* ── Header ── */}
      <div className="tc-header">
        <div>
          <h1 className="tc-title"><i className="fas fa-list-check"></i> To-Do Liste</h1>
          <p className="tc-subtitle">Suivez et gérez toutes les tâches du cabinet</p>
        </div>
        <button className="tc-add-btn" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Nouvelle tâche
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="tc-kpis">
        <div className="tc-kpi tc-kpi-total">
          <div className="tc-kpi-icon"><i className="fas fa-list-check"></i></div>
          <div><strong>{stats.total}</strong><span>Total</span></div>
        </div>
        <div className="tc-kpi tc-kpi-pending">
          <div className="tc-kpi-icon"><i className="fas fa-circle-dot"></i></div>
          <div><strong>{stats.pending}</strong><span>À faire</span></div>
        </div>
        <div className="tc-kpi tc-kpi-progress">
          <div className="tc-kpi-icon"><i className="fas fa-spinner"></i></div>
          <div><strong>{stats.inProgress}</strong><span>En cours</span></div>
        </div>
        <div className="tc-kpi tc-kpi-done">
          <div className="tc-kpi-icon"><i className="fas fa-circle-check"></i></div>
          <div><strong>{stats.completed}</strong><span>Terminées</span></div>
        </div>
        <div className="tc-kpi tc-kpi-urgent">
          <div className="tc-kpi-icon"><i className="fas fa-arrow-up"></i></div>
          <div><strong>{stats.urgent}</strong><span>Urgentes</span></div>
        </div>
        {stats.overdue > 0 && (
          <div className="tc-kpi tc-kpi-overdue">
            <div className="tc-kpi-icon"><i className="fas fa-triangle-exclamation"></i></div>
            <div><strong>{stats.overdue}</strong><span>En retard</span></div>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="tc-toolbar">
        <div className="tc-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="tc-clear" onClick={() => setSearch('')}><i className="fas fa-times"></i></button>}
        </div>
        <div className="tc-filter">
          <i className="fas fa-flag"></i>
          <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)}>
            <option value="">Toutes les priorités</option>
            <option value="HIGH">Haute</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Basse</option>
          </select>
        </div>
        <div className="tc-view-btns">
          <button
            className={`tc-view-btn${view === 'kanban' ? ' active' : ''}`}
            onClick={() => setView('kanban')}
            title="Vue Kanban"
          >
            <i className="fas fa-table-columns"></i>
          </button>
          <button
            className={`tc-view-btn${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')}
            title="Vue liste"
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
        <span className="tc-count">{filtered.length} tâche{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {/* ── Kanban ── */}
      {view === 'kanban' && (
        <div className="tc-kanban">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="tc-col">
                <div className="tc-col-header" style={{ background: col.headerBg, borderBottom: `2px solid ${col.accentBg}` }}>
                  <div className="tc-col-label">
                    <i className={`fas ${col.icon}`} style={{ color: col.color }}></i>
                    <span style={{ color: col.color }}>{col.label}</span>
                  </div>
                  <span className="tc-col-count" style={{ background: col.accentBg, color: col.color }}>
                    {colTasks.length}
                  </span>
                </div>
                <div className="tc-col-body">
                  {colTasks.length === 0 ? (
                    <div className="tc-col-empty">
                      <i className="fas fa-inbox"></i>
                      <p>Aucune tâche</p>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard key={task.id} task={task} onStatus={handleStatus} listView={false} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div className="tc-list">
          {filtered.length === 0 ? (
            <div className="tc-empty">
              <i className="fas fa-inbox"></i>
              <p>Aucune tâche trouvée</p>
              <small>Modifiez vos filtres ou créez une nouvelle tâche</small>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard key={task.id} task={task} onStatus={handleStatus} listView={true} />
            ))
          )}
        </div>
      )}

      {/* ── Modal création ── */}
      {showModal && (
        <div className="tc-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)} onKeyDown={e => e.key === 'Escape' && setShowModal(false)}>
          <div className="tc-modal">
            <div className="tc-modal-header">
              <h3><i className="fas fa-plus-circle"></i> Nouvelle tâche</h3>
              <button className="tc-modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="tc-modal-body">
              <div className="tc-form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  placeholder="Intitulé de la tâche..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="tc-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Détails de la tâche (optionnel)..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="tc-form-row">
                <div className="tc-form-group">
                  <label>Priorité</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="HIGH">Haute</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="LOW">Basse</option>
                  </select>
                </div>
                <div className="tc-form-group">
                  <label>Échéance</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  />
                </div>
              </div>
              <div className="tc-form-group">
                <label>Assigner à</label>
                <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
                  <option value="">— Non assigné —</option>
                  {users.map(u => (
                    <option key={u.idu} value={u.idu}>
                      {u.prenom} {u.nom} ({u.roleLabel})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="tc-modal-footer">
              <button className="tc-modal-cancel" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button
                className="tc-modal-submit"
                onClick={handleCreate}
                disabled={saving || !form.title.trim()}
              >
                {saving
                  ? <><i className="fas fa-spinner fa-spin"></i> Création...</>
                  : <><i className="fas fa-check"></i> Créer la tâche</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TachesSecretaire;
