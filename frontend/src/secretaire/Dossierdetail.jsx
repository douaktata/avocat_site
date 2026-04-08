import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCase, getDocumentsByCase, getAudiencesByCase, getTribunals, uploadDocument, downloadDocument, deleteDocument } from '../api';
import FacturesTabSec from './FacturesTabSec';
import SequestreTabSec from './SequestreTabSec';
import '../avocate/Dossierdetailav.css';
import './Dossierdetail.css';

/* ─── Méta ──────────────────────────────────────────────── */
const TYPE_META = {
  Divorce:    { icon: 'fa-heart-broken', color: '#ec4899', bg: '#fce7f3' },
  Commercial: { icon: 'fa-briefcase',    color: '#3b82f6', bg: '#dbeafe' },
  Succession: { icon: 'fa-scroll',       color: '#8b5cf6', bg: '#ede9fe' },
  Immobilier: { icon: 'fa-home',         color: '#10b981', bg: '#d1fae5' },
  Pénal:      { icon: 'fa-gavel',        color: '#ef4444', bg: '#fee2e2' },
  Travail:    { icon: 'fa-hard-hat',     color: '#f59e0b', bg: '#fef3c7' },
  Famille:    { icon: 'fa-users',        color: '#06b6d4', bg: '#cffafe' },
  Civil:      { icon: 'fa-balance-scale',color: '#0ea5e9', bg: '#e0f2fe' },
};

const STATUS_MAP  = { OPEN: 'en_cours', PENDING: 'en_attente', CLOSED: 'cloture' };
const STATUT_META = {
  en_cours:   { label: 'En cours',   cls: 'dd-s-progress', icon: 'fa-circle-notch' },
  en_attente: { label: 'En attente', cls: 'dd-s-waiting',  icon: 'fa-clock' },
  cloture:    { label: 'Clôturé',    cls: 'dd-s-closed',   icon: 'fa-check-circle' },
};
const PRIO_META = {
  urgente: { label: 'Urgente', cls: 'dd-p-urgent', dot: '#ef4444' },
  haute:   { label: 'Haute',   cls: 'dd-p-haute',  dot: '#f59e0b' },
  normale: { label: 'Normale', cls: 'dd-p-normal', dot: '#9ca3af' },
};
const AUD_STATUS = {
  SCHEDULED: { label: 'À venir',   cls: 'badge-upcoming' },
  COMPLETED: { label: 'Effectuée', cls: 'badge-done' },
  POSTPONED: { label: 'Reportée',  cls: 'badge-pending' },
  CANCELLED: { label: 'Annulée',   cls: 'badge-cancelled' },
};
const HEARING_TYPE_LABEL = {
  CONSULTATION: 'Consultation',
  JUGEMENT: 'Jugement',
  AUDIENCE: 'Audience générale',
  EXPERTISE: 'Expertise',
  MEDIATION: 'Médiation',
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

/* ─── Composant ──────────────────────────────────────────── */
const DossierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visible,    setVisible]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('documents');
  const [dossier,    setDossier]    = useState(null);
  const [caseData,   setCaseData]   = useState(null);
  const [documents,  setDocuments]  = useState([]);
  const [audiences,  setAudiences]  = useState([]);
  const [tribunals,  setTribunals]  = useState([]);
  const [statut,     setStatut]     = useState('en_cours');
  const [priorite,   setPriorite]   = useState('normale');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docFile,    setDocFile]    = useState(null);
  const [savingDoc,  setSavingDoc]  = useState(false);

  const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.idu; } catch { return null; } })();

  const loadDocuments = () =>
    getDocumentsByCase(id)
      .then(r => setDocuments(r.data.map(d => ({
        id: d.idd,
        nom: d.file_name || '-',
        type: d.file_type || '-',
        date: d.uploaded_at ? d.uploaded_at.split('T')[0] : null,
        uploadedBy: d.uploaded_by_name || '-',
      }))))
      .catch(console.error);

  useEffect(() => {
    Promise.all([
      getCase(id),
      getDocumentsByCase(id).catch(() => ({ data: [] })),
      getAudiencesByCase(id).catch(() => ({ data: [] })),
      getTribunals().catch(() => ({ data: [] })),
    ])
      .then(([caseRes, docsRes, audRes, tribRes]) => {
        const c = caseRes.data;
        setCaseData(c);
        setAudiences(audRes.data);
        setTribunals(tribRes.data);
        setStatut(STATUS_MAP[c.status] || 'en_cours');
        setPriorite(c.priority || 'normale');
        setDossier({
          id:            c.idc,
          numero:        c.case_number || '-',
          client:        c.client_full_name || '-',
          clientId:      c.client_id,
          type:          c.case_type || 'Autre',
          dateOuverture: c.created_at ? c.created_at.split('T')[0] : null,
        });
        setDocuments(docsRes.data.map(d => ({
          id: d.idd,
          nom: d.file_name || '-',
          type: d.file_type || '-',
          date: d.uploaded_at ? d.uploaded_at.split('T')[0] : null,
          uploadedBy: d.uploaded_by_name || '-',
        })));
        setTimeout(() => setVisible(true), 80);
      })
      .catch(() => setError('Impossible de charger ce dossier'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUploadDoc = e => {
    e.preventDefault();
    if (!docFile) return;
    setSavingDoc(true);
    const fd = new FormData();
    fd.append('file', docFile);
    fd.append('caseId', id);
    fd.append('uploadedBy', userId);
    uploadDocument(fd)
      .then(() => { loadDocuments(); setShowDocForm(false); setDocFile(null); })
      .catch(err => alert(err.response?.data?.message || 'Erreur lors du téléversement'))
      .finally(() => setSavingDoc(false));
  };

  const handleDeleteDoc = docId => {
    if (!window.confirm('Supprimer ce document ?')) return;
    deleteDocument(docId).then(loadDocuments).catch(() => alert('Erreur'));
  };

  const handleDownload = async docId => {
    try {
      const res = await downloadDocument(docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      const doc = documents.find(d => d.id === docId);
      a.download = doc?.nom || 'document';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Erreur lors du téléchargement'); }
  };

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7680', fontSize: '1rem' }}>
      <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Chargement...
    </div>
  );

  if (error || !dossier) return (
    <div className="dd-not-found">
      <div className="dd-nf-icon"><i className="fas fa-folder-open"></i></div>
      <h2>Dossier introuvable</h2>
      <p>{error || 'Ce dossier n\'existe pas ou a été supprimé.'}</p>
      <button onClick={() => navigate('/secretaire/dossiers')}>
        <i className="fas fa-arrow-left"></i> Retour
      </button>
    </div>
  );

  const tm = TYPE_META[dossier.type] || { icon: 'fa-folder', color: '#64748b', bg: '#f3f4f6' };
  const sm = STATUT_META[statut]     || { label: statut, cls: '', icon: 'fa-circle' };
  const pm = PRIO_META[priorite]     || PRIO_META.normale;

  const tribunalInfo = tribunals.find(t => t.id === caseData?.tribunalId) || null;

  const tabs = [
    { key: 'documents', label: 'Documents', icon: 'fa-file-alt',      count: documents.length },
    { key: 'audiences', label: 'Audiences', icon: 'fa-gavel',         count: audiences.length },
    { key: 'factures',  label: 'Factures',  icon: 'fa-file-invoice',  count: null },
    { key: 'sequestre', label: 'Séquestre', icon: 'fa-vault',         count: null },
    { key: 'tribunal',  label: 'Tribunal',  icon: 'fa-landmark',      count: caseData?.tribunalId ? 1 : 0 },
    { key: 'infos',     label: 'Infos',     icon: 'fa-info-circle',   count: null },
  ];

  return (
    <div className={`dd-wrapper ${visible ? 'dd-visible' : ''}`}>

      {/* ── Retour ── */}
      <button className="dd-back" onClick={() => navigate('/secretaire/dossiers')}>
        <i className="fas fa-arrow-left"></i>
        <span>Retour aux dossiers</span>
      </button>

      {/* ══════ HERO ══════ */}
      <div className="dd-hero">
        <div className="dd-hero-topbar" />
        <div className="dd-hero-main">
          <div className="dd-type-icon" style={{ background: tm.bg, color: tm.color }}>
            <i className={`fas ${tm.icon}`}></i>
          </div>
          <div className="dd-hero-identity">
            <div className="dd-hero-row1">
              <span className="dd-numero">
                <i className="fas fa-hashtag"></i>{dossier.numero}
              </span>
              <div className="dd-badges">
                <span className={`dd-statut ${sm.cls}`}>
                  <i className={`fas ${sm.icon}`}></i>{sm.label}
                </span>
                <span className="dd-prio" style={{ background: pm.dot + '22', color: pm.dot, border: `1px solid ${pm.dot}44`, borderRadius: '999px', padding: '0.2rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: pm.dot, display: 'inline-block' }}></span>
                  {pm.label}
                </span>
              </div>
            </div>
            <h1 className="dd-hero-title">
              {dossier.type} <span className="dd-hero-sep">·</span> {dossier.client}
            </h1>
          </div>
          <div className="dd-hero-actions">
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.5rem' }}>
              <i className="fas fa-eye" style={{ marginRight: '0.4rem' }}></i>Lecture seule
            </span>
          </div>
        </div>
      </div>

      {/* ══════ TABS ══════ */}
      <div className="dd-tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`dd-tab-btn ${activeTab === tab.key ? 'dd-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
            {tab.count !== null && (
              <span className="dd-tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>


      {/* ══════ DOCUMENTS ══════ */}
      {activeTab === 'documents' && (
        <div className="dd-section">
          <div className="dd-section-header">
            <h2><i className="fas fa-file-alt"></i> Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="dd-empty">
              <i className="fas fa-folder-open"></i>
              <p>Aucun document pour ce dossier</p>
            </div>
          ) : (
            <div className="dd-table-wrap">
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Nom du fichier</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Ajouté par</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="td-bold">
                        <i className="fas fa-file" style={{ marginRight: '0.5rem', color: '#64748b' }}></i>
                        {doc.nom}
                      </td>
                      <td><span className="dd-type-chip">{doc.type}</span></td>
                      <td>{fmtDate(doc.date)}</td>
                      <td>{doc.uploadedBy}</td>
                      <td>
                        <button className="dd-icon-btn" title="Télécharger" onClick={() => handleDownload(doc.id)}>
                          <i className="fas fa-download"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════ AUDIENCES ══════ */}
      {activeTab === 'audiences' && (
        <div className="dd-section">
          <div className="dd-section-header">
            <h2><i className="fas fa-gavel"></i> Audiences</h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
              <i className="fas fa-lock" style={{ marginRight: '0.4rem' }}></i>Gérées par l'avocat
            </span>
          </div>

          {audiences.length === 0 ? (
            <div className="dd-empty">
              <i className="fas fa-calendar-times"></i>
              <p>Aucune audience pour ce dossier</p>
            </div>
          ) : (
            <div className="dd-table-wrap">
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Date & heure</th>
                    <th>Type</th>
                    <th>Salle</th>
                    <th>Juge</th>
                    <th>Statut</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {audiences.map(aud => {
                    const as = AUD_STATUS[aud.status] || { label: aud.status, cls: '' };
                    return (
                      <tr key={aud.id} className={aud.status === 'SCHEDULED' ? 'dd-row-highlight' : ''}>
                        <td className="td-bold">{fmtDateTime(aud.hearingDate)}</td>
                        <td>{HEARING_TYPE_LABEL[aud.hearingType] || aud.hearingType || '—'}</td>
                        <td>{aud.roomNumber || '—'}</td>
                        <td>{aud.judgeName || '—'}</td>
                        <td>
                          <span className={`dd-badge ${as.cls}`}>{as.label}</span>
                          {aud.status === 'POSTPONED' && aud.postponeReason && (
                            <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.2rem' }}>
                              ↻ {aud.postponeReason}
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: 200, fontSize: '0.82rem', color: '#64748b' }}>{aud.description || aud.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════ FACTURES ══════ */}
      {activeTab === 'factures' && (
        <div className="dd-tab-content">
          <FacturesTabSec caseId={id} />
        </div>
      )}

      {/* ══════ SÉQUESTRE ══════ */}
      {activeTab === 'sequestre' && (
        <div className="dd-tab-content">
          <SequestreTabSec caseId={id} />
        </div>
      )}

      {/* ══════ TRIBUNAL ══════ */}
      {activeTab === 'tribunal' && (
        <div className="dd-section">
          <div className="dd-section-header">
            <h2><i className="fas fa-landmark"></i> Informations du Tribunal</h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
              <i className="fas fa-lock" style={{ marginRight: '0.4rem' }}></i>Gérées par l'avocat
            </span>
          </div>

          {!caseData?.tribunalId ? (
            <div className="dd-empty">
              <i className="fas fa-landmark"></i>
              <p>Aucun tribunal assigné à ce dossier</p>
            </div>
          ) : (
            <div className="dd-info-grid">
              <div className="dd-info-card">
                <i className="fas fa-landmark" style={{ color: '#3b82f6' }}></i>
                <div>
                  <label>Tribunal</label>
                  <p>{tribunalInfo?.name || caseData?.tribunalId || '—'}</p>
                </div>
              </div>
              <div className="dd-info-card">
                <i className="fas fa-hashtag" style={{ color: '#8b5cf6' }}></i>
                <div>
                  <label>N° dossier tribunal</label>
                  <p>{caseData?.courtCaseNumber || '—'}</p>
                </div>
              </div>
              <div className="dd-info-card">
                <i className="fas fa-user-tie" style={{ color: '#f59e0b' }}></i>
                <div>
                  <label>Juge assigné</label>
                  <p>{caseData?.judgeAssigned || '—'}</p>
                </div>
              </div>
              <div className="dd-info-card">
                <i className="fas fa-layer-group" style={{ color: '#10b981' }}></i>
                <div>
                  <label>Phase</label>
                  <p>{caseData?.casePhase || '—'}</p>
                </div>
              </div>
              <div className="dd-info-card">
                <i className="fas fa-calendar-plus" style={{ color: '#06b6d4' }}></i>
                <div>
                  <label>Date dépôt tribunal</label>
                  <p>{fmtDate(caseData?.dateFiledAtTribunal)}</p>
                </div>
              </div>
              {caseData?.notesJudicial && (
                <div className="dd-info-card" style={{ gridColumn: '1 / -1' }}>
                  <i className="fas fa-sticky-note" style={{ color: '#64748b' }}></i>
                  <div>
                    <label>Notes judiciaires</label>
                    <p>{caseData.notesJudicial}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════ INFOS ══════ */}
      {activeTab === 'infos' && (
        <div className="dd-section">
          <div className="dd-section-header">
            <h2><i className="fas fa-info-circle"></i> Informations générales</h2>
          </div>
          <div className="dd-info-grid">
            <div className="dd-info-card">
              <i className={`fas ${tm.icon}`} style={{ color: tm.color }}></i>
              <div>
                <label>Type de dossier</label>
                <p>{dossier.type}</p>
              </div>
            </div>
            <div className="dd-info-card">
              <i className="fas fa-user" style={{ color: '#3b82f6' }}></i>
              <div>
                <label>Client</label>
                <p>{dossier.client}</p>
              </div>
            </div>
            <div className="dd-info-card">
              <i className="fas fa-calendar-plus" style={{ color: '#10b981' }}></i>
              <div>
                <label>Date d'ouverture</label>
                <p>{fmtDate(dossier.dateOuverture)}</p>
              </div>
            </div>
            <div className="dd-info-card">
              <i className="fas fa-circle-notch" style={{ color: sm.cls === 'dd-s-progress' ? '#2563eb' : sm.cls === 'dd-s-waiting' ? '#f59e0b' : '#16a34a' }}></i>
              <div>
                <label>Statut</label>
                <p>{sm.label}</p>
              </div>
            </div>
            <div className="dd-info-card">
              <i className="fas fa-flag" style={{ color: pm.dot }}></i>
              <div>
                <label>Priorité</label>
                <p style={{ color: pm.dot, fontWeight: 600 }}>{pm.label}</p>
              </div>
            </div>
            <div className="dd-info-card">
              <i className="fas fa-file-alt" style={{ color: '#64748b' }}></i>
              <div>
                <label>Documents</label>
                <p>{documents.length} fichier{documents.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="dd-info-card">
              <i className="fas fa-gavel" style={{ color: '#64748b' }}></i>
              <div>
                <label>Audiences</label>
                <p>{audiences.length} audience{audiences.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Notice accès restreint */}
          <div style={{ marginTop: '1.5rem', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <i className="fas fa-info-circle" style={{ color: '#1e3a8a', fontSize: '1.25rem', marginTop: '0.1rem' }}></i>
            <div>
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#1e3a8a', fontSize: '0.9rem' }}>Accès restreint</h4>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Les notes juridiques, la gestion du statut et les audiences sont réservées à l'avocat. La secrétaire peut consulter les documents, les factures et le séquestre.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DossierDetail;
