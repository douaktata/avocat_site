import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getDocumentsByUser, getTasksByAssignee, uploadDocument, downloadDocument, deleteDocument } from '../api';
import './DocumentsStagiaire.css';

const DocumentsStagiaire = () => {
  const { user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ selectedFile: null });

  const loadAll = () => {
    if (!user?.idu) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getDocumentsByUser(user.idu),
      getTasksByAssignee(user.idu),
    ])
      .then(([docsRes, tasksRes]) => {
        setDocuments(docsRes.data);
        setTasks(tasksRes.data);
      })
      .catch(() => setError('Impossible de charger les documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [user]);

  // Build task map: id → title
  const taskMap = {};
  tasks.forEach(t => { taskMap[t.id] = t.title; });

  // Apply search/type filter
  const docsFiltres = documents.filter(doc => {
    const matchesType = filterType === '' || (doc.file_type || '').toUpperCase() === filterType.toUpperCase();
    const matchesSearch = (doc.file_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group documents by task_id
  const grouped = {};
  docsFiltres.forEach(doc => {
    const key = doc.task_id != null ? String(doc.task_id) : '__general__';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(doc);
  });

  // Sort groups: task groups first (by task title), then general
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '__general__') return 1;
    if (b === '__general__') return -1;
    return (taskMap[a] || '').localeCompare(taskMap[b] || '');
  });

  const stats = {
    total: documents.length,
    avecTache: documents.filter(d => d.task_id != null).length,
    pdf: documents.filter(d => (d.file_type || '').toUpperCase() === 'PDF').length,
    docx: documents.filter(d => (d.file_type || '').toUpperCase() === 'DOCX').length,
  };

  const getFileIcon = (type) => {
    const t = (type || '').toUpperCase();
    const map = {
      PDF:   { icon: 'fas fa-file-pdf',   color: '#ef4444' },
      DOCX:  { icon: 'fas fa-file-word',  color: '#3b82f6' },
      XLSX:  { icon: 'fas fa-file-excel', color: '#10b981' },
      IMAGE: { icon: 'fas fa-file-image', color: '#8b5cf6' },
    };
    return map[t] || { icon: 'fas fa-file', color: '#6b7280' };
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';

  const toggleGroup = (key) =>
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newDoc.selectedFile || !user?.idu) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', newDoc.selectedFile);
    formData.append('uploadedBy', user.idu);
    try {
      await uploadDocument(formData);
      setShowUploadModal(false);
      setNewDoc({ selectedFile: null });
      loadAll();
    } catch {
      alert('Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await downloadDocument(doc.idd);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger le document');
    }
  };

  const handleDelete = async (idd) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await deleteDocument(idd);
      setDocuments(prev => prev.filter(d => d.idd !== idd));
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <div><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error)   return <div><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div className="documents-stagiaire-page">

      <div className="docs-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-cloud-upload-alt"></i> Mes Documents
          </h1>
          <p className="page-description">Documents classés par tâche</p>
        </div>
        <button className="btn-upload-main" onClick={() => setShowUploadModal(true)}>
          <i className="fas fa-upload"></i> Uploader un document
        </button>
      </div>

      {/* Stats */}
      <div className="docs-stats">
        <div className="dstat-card dstat-total">
          <div className="dstat-icon"><i className="fas fa-file-alt"></i></div>
          <div className="dstat-info">
            <span className="dstat-number">{stats.total}</span>
            <span className="dstat-label">Total</span>
          </div>
        </div>
        <div className="dstat-card dstat-approved">
          <div className="dstat-icon"><i className="fas fa-clipboard-check"></i></div>
          <div className="dstat-info">
            <span className="dstat-number">{stats.avecTache}</span>
            <span className="dstat-label">Liés à une tâche</span>
          </div>
        </div>
        <div className="dstat-card dstat-pending">
          <div className="dstat-icon"><i className="fas fa-file-pdf"></i></div>
          <div className="dstat-info">
            <span className="dstat-number">{stats.pdf}</span>
            <span className="dstat-label">PDF</span>
          </div>
        </div>
        <div className="dstat-card dstat-rejected">
          <div className="dstat-icon"><i className="fas fa-file-word"></i></div>
          <div className="dstat-info">
            <span className="dstat-number">{stats.docx}</span>
            <span className="dstat-label">Word</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="docs-filters">
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="filter-buttons">
          {[['', 'fa-list', 'Tous'], ['PDF', 'fa-file-pdf', 'PDF'], ['DOCX', 'fa-file-word', 'Word'], ['XLSX', 'fa-file-excel', 'Excel']].map(([val, icon, label]) => (
            <button
              key={val}
              className={`filter-btn ${filterType === val ? 'active' : ''}`}
              onClick={() => setFilterType(val)}
            >
              <i className={`fas ${icon}`}></i> {label}
            </button>
          ))}
        </div>
        <div className="results-count">
          {docsFiltres.length} document{docsFiltres.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grouped documents */}
      {docsFiltres.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>Aucun document trouvé</p>
          <small>Modifiez vos filtres ou uploadez un nouveau document</small>
        </div>
      ) : (
        <div className="docs-groups">
          {groupKeys.map(key => {
            const isGeneral = key === '__general__';
            const groupTitle = isGeneral
              ? 'Documents généraux'
              : (taskMap[key] || `Tâche #${key}`);
            const groupDocs = grouped[key];
            const collapsed = collapsedGroups[key];

            return (
              <div key={key} className="doc-group">
                <button
                  className={`doc-group-header ${isGeneral ? 'group-general' : 'group-task'}`}
                  onClick={() => toggleGroup(key)}
                >
                  <div className="group-header-left">
                    <i className={`fas ${isGeneral ? 'fa-folder' : 'fa-clipboard-list'}`}></i>
                    <span className="group-title">{groupTitle}</span>
                    <span className="group-badge">{groupDocs.length}</span>
                  </div>
                  <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'} group-chevron`}></i>
                </button>

                {!collapsed && (
                  <div className="doc-group-body">
                    {groupDocs.map(doc => {
                      const fileIcon = getFileIcon(doc.file_type);
                      return (
                        <div key={doc.idd} className="doc-card">
                          <div className="doc-file-icon" style={{ color: fileIcon.color }}>
                            <i className={fileIcon.icon}></i>
                          </div>
                          <div className="doc-main-info">
                            <h3>{doc.file_name}</h3>
                            <div className="doc-meta-row">
                              <span className="doc-date">
                                <i className="fas fa-calendar"></i> {formatDate(doc.uploaded_at)}
                              </span>
                              {doc.case_number && (
                                <span className="doc-linked-to">
                                  <i className="fas fa-folder"></i> Dossier : <strong>{doc.case_number}</strong>
                                </span>
                              )}
                            </div>
                            <div className="doc-type-badge">{doc.file_type || 'AUTRE'}</div>
                          </div>
                          <div className="doc-status-actions">
                            <div className="doc-actions">
                              <button className="doc-action-btn btn-download" onClick={() => handleDownload(doc)} title="Télécharger">
                                <i className="fas fa-download"></i>
                              </button>
                              <button className="doc-action-btn btn-delete" onClick={() => handleDelete(doc.idd)} title="Supprimer" style={{ color: '#ef4444' }}>
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-upload"></i> Uploader un document</h2>
              <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label><i className="fas fa-file"></i> Fichier *</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => setNewDoc({ selectedFile: e.target.files[0] })}
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                      required
                    />
                    {newDoc.selectedFile && (
                      <div className="selected-file">
                        <i className="fas fa-file"></i>
                        <span>{newDoc.selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  <small>Formats acceptés : PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  <i className="fas fa-upload"></i> {uploading ? 'Envoi...' : 'Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsStagiaire;
