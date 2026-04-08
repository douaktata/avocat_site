import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCase, getDocumentsByCase, patchCaseStatus, patchCasePriority, uploadDocument, downloadDocument, deleteDocument, getTribunals, patchCaseTribunalInfo, getAudiencesByCase, createAudience, deleteAudience, patchAudienceStatus, getCaseClosePreview, closeCase } from '../api';
import InvoiceGenerator from './InvoiceGenerator';
import FacturesTab from './FacturesTab';
import TrustTab from './TrustTab';
import BillingTab from './BillingTab';
import './Dossierdetailav.css';

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

const STATUS_MAP = { OPEN: 'en_cours', PENDING: 'en_attente', CLOSED: 'cloture' };

const STATUT_META = {
  en_cours:   { label: 'En cours',   cls: 'dd-s-progress', icon: 'fa-circle-notch' },
  en_attente: { label: 'En attente', cls: 'dd-s-waiting',  icon: 'fa-clock' },
  cloture:    { label: 'Clôturé',    cls: 'dd-s-closed',   icon: 'fa-check-circle' },
};

const TRIAL_STATUS_MAP = {
  SCHEDULED: { label: 'À venir',   isAvenir: true },
  COMPLETED: { label: 'Effectuée', isAvenir: false },
  POSTPONED: { label: 'Reportée',  isAvenir: false },
};

const fmtShort = d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtLong  = d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long',  year: 'numeric' });

/* ─── Composant ──────────────────────────────────────────── */
const AffaireDetailav = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visible, setVisible]     = useState(false);
  const [activeTab, setActiveTab] = useState('documents');
  const [dossier, setDossier]         = useState(null);
  const [documents, setDocuments]     = useState([]);
  const [audiences, setAudiences]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [statut, setStatut]           = useState('en_cours');
  const [priorite, setPriorite]       = useState('normale');
  const [showStatusMenu, setShowStatusMenu]   = useState(false);
  const [showPrioMenu, setShowPrioMenu]       = useState(false);
  const [showGenerator, setShowGenerator]     = useState(false);
  const [showDocForm, setShowDocForm]         = useState(false);
  const [showAudForm, setShowAudForm]         = useState(false);
  const [docForm, setDocForm]   = useState({ file: null });
  const [audForm, setAudForm]   = useState({ hearingDate: '', hearingType: 'CONSULTATION', roomNumber: '', judgeName: '', description: '' });
  const [savingDoc, setSavingDoc] = useState(false);
  const [savingAud, setSavingAud] = useState(false);
  const [postponeModal, setPostponeModal]   = useState(null);
  const [postponeData, setPostponeData]     = useState({ newHearingDate: '', postponeReason: '' });
  const [savingPostpone, setSavingPostpone] = useState(false);
  const [cancelModal, setCancelModal]       = useState(null);
  const [cancelReason, setCancelReason]     = useState('');
  const [savingCancel, setSavingCancel]     = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [tribunals, setTribunals] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [showTribunalEdit, setShowTribunalEdit] = useState(false);
  const [tribunalForm, setTribunalForm] = useState({ tribunalId: '', courtCaseNumber: '', judgeAssigned: '', casePhase: 'PRE_CONTENTIEUX', dateFiledAtTribunal: '', notesJudicial: '' });
  const [clientId, setClientId]               = useState(null);
  const [closureModal, setClosureModal]       = useState(null);  // null | 'loading' | { preview data }
  const [closingCase, setClosingCase]         = useState(false);
  const [avocatId]                            = useState(() => {
    try { return JSON.parse(localStorage.getItem('user'))?.idu; } catch { return null; }
  });

  const loadDocuments  = () => getDocumentsByCase(id).then(r => setDocuments(r.data.map(d => ({ id: d.idd, nom: d.file_name || '-', type: d.file_type || '-', date: d.uploaded_at ? d.uploaded_at.split('T')[0] : null, uploadedBy: d.uploaded_by_name || '-' })))).catch(console.error);
  const loadAudiences  = () => getAudiencesByCase(id).then(r => setAudiences(r.data)).catch(console.error);

  const handleCreateDoc = e => {
    e.preventDefault();
    if (!docForm.file) return;
    setSavingDoc(true);
    const fd = new FormData();
    fd.append('file', docForm.file);
    fd.append('caseId', id);
    fd.append('uploadedBy', avocatId);
    uploadDocument(fd)
      .then(() => { loadDocuments(); setShowDocForm(false); setDocForm({ file: null }); })
      .catch(err => alert(err.response?.data?.message || 'Erreur'))
      .finally(() => setSavingDoc(false));
  };

  const handleDeleteDoc = docId => {
    if (!window.confirm('Supprimer ce document ?')) return;
    deleteDocument(docId).then(loadDocuments).catch(() => alert('Erreur'));
  };

  const handleCreateAud = e => {
    e.preventDefault();
    if (!audForm.hearingDate) return;
    setSavingAud(true);
    const hearingDate = audForm.hearingDate.length === 16 ? audForm.hearingDate + ':00' : audForm.hearingDate;
    // tribunalId not sent — backend auto-fills from case
    createAudience({
      caseId: parseInt(id),
      hearingDate,
      hearingType: audForm.hearingType || 'CONSULTATION',
      roomNumber: audForm.roomNumber || null,
      judgeName: audForm.judgeName || null,
      description: audForm.description || null,
    })
      .then(() => { loadAudiences(); setShowAudForm(false); setAudForm({ hearingDate: '', hearingType: 'CONSULTATION', roomNumber: '', judgeName: '', description: '' }); })
      .catch(err => alert(err.response?.data?.message || 'Erreur'))
      .finally(() => setSavingAud(false));
  };

  const handleDeleteAud = audId => {
    if (!window.confirm('Supprimer cette audience ?')) return;
    deleteAudience(audId).then(loadAudiences).catch(() => alert('Erreur'));
  };

  const handleAudStatus = (audId, newStatus) => {
    setActiveDropdown(null);
    patchAudienceStatus(audId, { status: newStatus }).then(loadAudiences).catch(() => alert('Erreur'));
  };

  const handlePostponeSubmit = e => {
    e.preventDefault();
    if (!postponeData.newHearingDate || !postponeData.postponeReason.trim()) return;
    setSavingPostpone(true);
    const nd = postponeData.newHearingDate.length === 16 ? postponeData.newHearingDate + ':00' : postponeData.newHearingDate;
    patchAudienceStatus(postponeModal.id, {
      status: 'POSTPONED',
      postponeReason: postponeData.postponeReason,
      newHearingDate: nd,
    })
      .then(() => { loadAudiences(); setPostponeModal(null); setPostponeData({ newHearingDate: '', postponeReason: '' }); })
      .catch(() => alert('Erreur lors du report'))
      .finally(() => setSavingPostpone(false));
  };

  const handleCancelSubmit = e => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setSavingCancel(true);
    patchAudienceStatus(cancelModal.id, { status: 'CANCELLED', cancellationReason: cancelReason })
      .then(() => { loadAudiences(); setCancelModal(null); setCancelReason(''); setActiveDropdown(null); })
      .catch(() => alert("Erreur lors de l'annulation"))
      .finally(() => setSavingCancel(false));
  };

  const handleSaveTribunal = e => {
    e.preventDefault();
    patchCaseTribunalInfo(id, {
      tribunalId: tribunalForm.tribunalId ? parseInt(tribunalForm.tribunalId) : null,
      courtCaseNumber: tribunalForm.courtCaseNumber || null,
      judgeAssigned: tribunalForm.judgeAssigned || null,
      casePhase: tribunalForm.casePhase || null,
      dateFiledAtTribunal: tribunalForm.dateFiledAtTribunal || null,
      notesJudicial: tribunalForm.notesJudicial || null,
    })
      .then(r => { setCaseData(r.data); setShowTribunalEdit(false); })
      .catch(() => alert('Erreur lors de la sauvegarde'));
  };

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
        setClientId(c.client_id || null);
        setAudiences(audRes.data);
        setTribunals(tribRes.data);
        setTribunalForm({
          tribunalId: c.tribunalId || '',
          courtCaseNumber: c.courtCaseNumber || '',
          judgeAssigned: c.judgeAssigned || '',
          casePhase: c.casePhase || 'PRE_CONTENTIEUX',
          dateFiledAtTribunal: c.dateFiledAtTribunal || '',
          notesJudicial: c.notesJudicial || '',
        });
        const mappedStatut = STATUS_MAP[c.status] || 'en_cours';
        const mappedPrio = c.priority || 'normale';
        setDossier({
          id: c.idc,
          numero: c.case_number || '-',
          client: c.client_full_name || '-',
          type: c.case_type || 'Autre',
          dateOuverture: c.created_at ? c.created_at.split('T')[0] : null,
          dateDerniereModif: c.created_at ? c.created_at.split('T')[0] : null,
          avocate: '-',
        });
        setStatut(mappedStatut);
        setPriorite(mappedPrio);
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

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7689', fontSize: '1rem' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Chargement...</div>;

  if (error || !dossier) {
    return (
      <div className="dd-not-found">
        <div className="dd-nf-icon"><i className="fas fa-folder-open"></i></div>
        <h2>Dossier introuvable</h2>
        <p>{error || 'Ce dossier n\'existe pas ou a été supprimé.'}</p>
        <button onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>
      </div>
    );
  }

  const STATUS_BACKEND = { en_cours: 'OPEN', en_attente: 'PENDING', cloture: 'CLOSED' };

  const handleChangeStatus = (newStatut) => {
    setShowStatusMenu(false);
    if (newStatut === 'cloture') {
      setClosureModal('loading');
      getCaseClosePreview(dossier.id)
        .then(r => setClosureModal(r.data))
        .catch(() => { setClosureModal(null); alert('Erreur lors du chargement du bilan'); });
      return;
    }
    patchCaseStatus(dossier.id, STATUS_BACKEND[newStatut])
      .then(() => setStatut(newStatut))
      .catch(() => alert('Erreur lors du changement de statut'));
  };

  const handleConfirmClose = () => {
    setClosingCase(true);
    closeCase(dossier.id)
      .then(() => { setStatut('cloture'); setClosureModal(null); })
      .catch(err => alert(err.response?.data?.message || 'Erreur lors de la clôture'))
      .finally(() => setClosingCase(false));
  };

  const handleChangePriority = (newPrio) => {
    setShowPrioMenu(false);
    patchCasePriority(dossier.id, newPrio)
      .then(() => setPriorite(newPrio))
      .catch(() => alert('Erreur lors du changement de priorité'));
  };

  const tm = TYPE_META[dossier.type] || { icon: 'fa-folder', color: '#64748b', bg: '#f3f4f6' };
  const sm = STATUT_META[statut]     || { label: statut, cls: '', icon: 'fa-circle' };

  const PRIO_META = {
    urgente: { label: 'Urgente', cls: 'dd-p-urgent', dot: '#ef4444' },
    haute:   { label: 'Haute',   cls: 'dd-p-haute',  dot: '#f59e0b' },
    normale: { label: 'Normale', cls: 'dd-p-normal', dot: '#9ca3af' },
  };
  const pm = PRIO_META[priorite] || PRIO_META.normale;

  const tabs = [
    { key: 'documents',  label: 'Documents',  icon: 'fa-file-alt',          count: documents.length },
    { key: 'audiences',  label: 'Audiences',  icon: 'fa-gavel',              count: audiences.length },
    { key: 'tribunal',   label: 'Tribunal',   icon: 'fa-landmark',           count: caseData?.tribunalId ? 1 : 0 },
    { key: 'sequestre',  label: 'Séquestre',  icon: 'fa-vault',              count: null },
    { key: 'factures',   label: 'Factures',   icon: 'fa-file-invoice',       count: null },
    { key: 'bilan',      label: 'Bilan',      icon: 'fa-chart-pie',          count: null },
  ];

  return (
    <div className={`dd-wrapper ${visible ? 'dd-visible' : ''}`}>

      {/* ── Retour ── */}
      <button className="dd-back" onClick={() => navigate(-1)}>
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
            {/* ── Générer facture ── */}
            <button className="dd-btn dd-btn-primary" onClick={() => setShowGenerator(true)}>
              <i className="fas fa-file-invoice"></i> Facture
            </button>
            {/* ── Changer statut ── */}
            <div style={{ position: 'relative' }}>
              <button className="dd-btn dd-btn-outline" onClick={() => { setShowStatusMenu(s => !s); setShowPrioMenu(false); }}>
                <i className="fas fa-exchange-alt"></i> Statut
              </button>
              {showStatusMenu && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 16px #0001', zIndex: 50, minWidth: 170, padding: '0.4rem 0' }}>
                  {[
                    { key: 'en_cours',   label: 'En cours',   icon: 'fa-circle-notch', color: '#2563eb' },
                    { key: 'en_attente', label: 'En attente', icon: 'fa-clock',         color: '#f59e0b' },
                    { key: 'cloture',    label: 'Clôturé',    icon: 'fa-check-circle',  color: '#16a34a' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => handleChangeStatus(opt.key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.55rem 1rem', border: 'none', background: statut === opt.key ? '#f1f5f9' : 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: statut === opt.key ? 700 : 400, color: opt.color }}>
                      <i className={`fas ${opt.icon}`}></i>{opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Changer priorité ── */}
            <div style={{ position: 'relative' }}>
              <button className="dd-btn dd-btn-primary" onClick={() => { setShowPrioMenu(s => !s); setShowStatusMenu(false); }}>
                <i className="fas fa-flag"></i> Priorité
              </button>
              {showPrioMenu && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 16px #0001', zIndex: 50, minWidth: 160, padding: '0.4rem 0' }}>
                  {[
                    { key: 'normale', label: 'Normale', dot: '#9ca3af' },
                    { key: 'haute',   label: 'Haute',   dot: '#f59e0b' },
                    { key: 'urgente', label: 'Urgente', dot: '#ef4444' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => handleChangePriority(opt.key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.55rem 1rem', border: 'none', background: priorite === opt.key ? '#f1f5f9' : 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: priorite === opt.key ? 700 : 400 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.dot, display: 'inline-block' }}></span>{opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Strip infos ── */}
        <div className="dd-strip">
          <div className="dd-strip-item">
            <i className="fas fa-user"></i>
            <div>
              <span className="dd-strip-label">Client</span>
              <span className="dd-strip-val">{dossier.client}</span>
            </div>
          </div>
          <div className="dd-strip-sep" />
          <div className="dd-strip-item">
            <i className="fas fa-folder-open"></i>
            <div>
              <span className="dd-strip-label">Type</span>
              <span className="dd-strip-val">{dossier.type}</span>
            </div>
          </div>
          {dossier.dateOuverture && (
            <>
              <div className="dd-strip-sep" />
              <div className="dd-strip-item">
                <i className="fas fa-calendar-plus"></i>
                <div>
                  <span className="dd-strip-label">Ouverture</span>
                  <span className="dd-strip-val">{fmtShort(dossier.dateOuverture)}</span>
                </div>
              </div>
            </>
          )}
          <div className="dd-strip-sep" />
          <div className="dd-strip-item dd-strip-kpis">
            {tabs.map(t => (
              <div key={t.key} className="dd-kpi-mini">
                <span className="dd-kpi-num">{t.count}</span>
                <span className="dd-kpi-lbl">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ BODY ══════ */}
      <div className="dd-body">

        {/* Tab nav */}
        <div className="dd-tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`dd-tab-btn ${activeTab === tab.key ? 'dd-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
              {tab.count !== null && <span className="dd-tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ── Documents ── */}
        {activeTab === 'documents' && (
          <div className="dd-tab-content dd-appear">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="dd-btn dd-btn-primary" onClick={() => setShowDocForm(s => !s)}>
                <i className={`fas ${showDocForm ? 'fa-times' : 'fa-plus'}`}></i> {showDocForm ? 'Annuler' : 'Ajouter un document'}
              </button>
            </div>

            {showDocForm && (
              <form onSubmit={handleCreateDoc} style={{ background: '#f8f9fc', borderRadius: 10, padding: '1rem', border: '1px solid #e8ecf0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="doc-file" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>
                      Sélectionner un fichier *
                    </label>
                    <input id="doc-file" type="file" required
                      onChange={e => setDocForm({ file: e.target.files[0] || null })}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', background: '#fff', boxSizing: 'border-box', cursor: 'pointer' }} />
                    {docForm.file && (
                      <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#10b981' }}>
                        <i className="fas fa-file" style={{ marginRight: '0.3rem' }}></i>
                        {docForm.file.name} ({(docForm.file.size / 1024).toFixed(1)} Ko)
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={savingDoc || !docForm.file}
                    style={{ padding: '0.45rem 1.1rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    {savingDoc ? 'Envoi...' : <><i className="fas fa-upload"></i> Envoyer</>}
                  </button>
                </div>
              </form>
            )}

            {documents.length === 0 ? (
              <Empty icon="fa-folder-open" msg="Aucun document dans ce dossier" />
            ) : (
              <div className="dd-doc-list">
                {documents.map(doc => (
                  <div key={doc.id} className="dd-doc-row">
                    <div className="dd-doc-icon-wrap">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="dd-doc-body">
                      <span className="dd-doc-nom">{doc.nom}</span>
                      <div className="dd-doc-meta">
                        <span className="dd-doc-type">{doc.type}</span>
                        {doc.date && (
                          <>
                            <span className="dd-dot-sep">·</span>
                            <span>{fmtShort(doc.date)}</span>
                          </>
                        )}
                        {doc.uploadedBy !== '-' && (
                          <>
                            <span className="dd-dot-sep">·</span>
                            <span>{doc.uploadedBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={() => downloadDocument(doc.id).then(res => {
                        const url = URL.createObjectURL(res.data);
                        const a = document.createElement('a');
                        a.href = url; a.download = doc.nom; a.click();
                        URL.revokeObjectURL(url);
                      }).catch(() => alert('Fichier introuvable'))}
                      style={{ background: '#dbeafe', color: '#1a56db', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', marginLeft: '0.5rem' }}
                      title="Télécharger">
                      <i className="fas fa-download"></i>
                    </button>
                    <button onClick={() => handleDeleteDoc(doc.id)}
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', marginLeft: '0.25rem' }}
                      title="Supprimer">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Audiences ── */}
        {activeTab === 'audiences' && (
          <div className="dd-tab-content dd-appear">

            {/* AUTOMATION 1: blocage si pas de tribunal */}
            {!caseData?.tribunalId ? (
              <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: 12, padding: '2rem', textAlign: 'center', margin: '0.5rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#92400e', fontSize: '1.05rem', fontWeight: 700 }}>Tribunal obligatoire</h3>
                <p style={{ color: '#78350f', margin: '0 0 1rem', fontSize: '0.9rem' }}>
                  Vous devez d'abord remplir les informations de <strong>Tribunal</strong> avant de pouvoir créer des audiences.
                </p>
                <button className="dd-btn dd-btn-primary" onClick={() => setActiveTab('tribunal')} style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
                  <i className="fas fa-landmark"></i> Aller à l'onglet Tribunal
                </button>
              </div>
            ) : (
              <>
                {/* Badge tribunal du dossier */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                    <i className="fas fa-landmark"></i>
                    {caseData.tribunalName || 'Tribunal assigné'}
                  </div>
                  <button className="dd-btn dd-btn-primary" onClick={() => setShowAudForm(s => !s)}>
                    <i className={`fas ${showAudForm ? 'fa-times' : 'fa-plus'}`}></i> {showAudForm ? 'Annuler' : 'Programmer une audience'}
                  </button>
                </div>

                {showAudForm && (
                  <form onSubmit={handleCreateAud} style={{ background: '#f8f9fc', borderRadius: 10, padding: '1.25rem', border: '1px solid #e8ecf0', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {/* AUTOMATION 2: tribunal en lecture seule, auto-rempli */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>
                          Tribunal <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 4, marginLeft: '0.4rem' }}>Auto-rempli</span>
                        </label>
                        <input
                          readOnly
                          value={caseData.tribunalName || ''}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box', background: '#f0f4f8', color: '#475569', cursor: 'not-allowed' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Date & heure *</label>
                        <input type="datetime-local" required value={audForm.hearingDate} onChange={e => setAudForm({ ...audForm, hearingDate: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Type</label>
                        <select value={audForm.hearingType} onChange={e => setAudForm({ ...audForm, hearingType: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }}>
                          <option value="CONSULTATION">Consultation</option>
                          <option value="HEARING">Audience de jugement</option>
                          <option value="APPEL">Appel</option>
                          <option value="MEDIATION">Médiation</option>
                          <option value="AUTRE">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Salle</label>
                        <input placeholder="Ex : Salle 3B" value={audForm.roomNumber} onChange={e => setAudForm({ ...audForm, roomNumber: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Juge</label>
                        <input placeholder="Ex : Mme Fatma Ben Ali" value={audForm.judgeName} onChange={e => setAudForm({ ...audForm, judgeName: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Description</label>
                        <input placeholder="Notes..." value={audForm.description} onChange={e => setAudForm({ ...audForm, description: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" disabled={savingAud}
                        style={{ padding: '0.45rem 1.25rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                        {savingAud ? '...' : <><i className="fas fa-check"></i> Enregistrer</>}
                      </button>
                    </div>
                  </form>
                )}

                {audiences.length === 0 ? (
                  <Empty icon="fa-calendar-times" msg="Aucune audience programmée" />
                ) : (
                  <div className="dd-aud-list">
                    {[...audiences].sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate)).map(aud => {
                      const dt = aud.hearingDate ? new Date(aud.hearingDate) : null;
                      const isAvenir = aud.status === 'SCHEDULED';
                      const STATUS_LABEL = { SCHEDULED: 'À venir', COMPLETED: 'Effectuée', POSTPONED: 'Reportée', CANCELLED: 'Annulée' };
                      const TYPE_LABEL = { CONSULTATION: 'Consultation', HEARING: 'Audience', APPEL: 'Appel', MEDIATION: 'Médiation', AUTRE: 'Autre' };
                      return (
                        <div key={aud.id} className={`dd-aud-row ${isAvenir ? 'dd-aud-avenir' : 'dd-aud-passee'}`}>
                          <div className="dd-aud-date">
                            <span className="dd-aud-day">{dt ? dt.toLocaleDateString('fr-FR', { day: '2-digit' }) : '—'}</span>
                            <span className="dd-aud-month">{dt ? dt.toLocaleDateString('fr-FR', { month: 'short' }) : ''}</span>
                            <span className="dd-aud-year">{dt ? dt.getFullYear() : ''}</span>
                          </div>
                          <div className="dd-aud-vsep" />
                          <div className="dd-aud-info">
                            <span className="dd-aud-type">{TYPE_LABEL[aud.hearingType] || aud.hearingType || 'Audience'}</span>
                            <div className="dd-aud-sub">
                              {aud.tribunalName && <span><i className="fas fa-landmark"></i>{aud.tribunalName}</span>}
                              {dt && <span><i className="fas fa-clock"></i>{dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                              {aud.roomNumber && <span><i className="fas fa-door-open"></i>{aud.roomNumber}</span>}
                              {aud.judgeName && <span><i className="fas fa-user-tie"></i>{aud.judgeName}</span>}
                            </div>
                            {aud.postponeReason && (
                              <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', borderRadius: 5, padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <i className="fas fa-redo"></i> {aud.postponeReason}
                              </div>
                            )}
                            {aud.cancellationReason && (
                              <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#991b1b', background: '#fee2e2', borderRadius: 5, padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <i className="fas fa-ban"></i> {aud.cancellationReason}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                            <span className={`dd-aud-badge ${isAvenir ? 'badge-avenir' : aud.status === 'POSTPONED' ? 'badge-postponed' : 'badge-effectuee'}`}>
                              <i className={`fas ${isAvenir ? 'fa-calendar-day' : aud.status === 'POSTPONED' ? 'fa-redo' : aud.status === 'CANCELLED' ? 'fa-ban' : 'fa-check-circle'}`}></i>
                              {STATUS_LABEL[aud.status] || aud.status}
                            </span>
                            {/* Reporter button — only for SCHEDULED */}
                            {isAvenir && (
                              <button onClick={() => { setPostponeModal(aud); setPostponeData({ newHearingDate: '', postponeReason: '' }); }}
                                style={{ background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                                title="Reporter">
                                <i className="fas fa-redo"></i> Reporter
                              </button>
                            )}
                            {/* Dropdown ⋯ */}
                            <div style={{ position: 'relative' }}>
                              <button onClick={() => setActiveDropdown(activeDropdown === aud.id ? null : aud.id)}
                                style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, padding: '0.25rem 0.55rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>
                                ···
                              </button>
                              {activeDropdown === aud.id && (
                                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190, zIndex: 100 }}>
                                  {isAvenir && (
                                    <button onClick={() => handleAudStatus(aud.id, 'COMPLETED')}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#065f46', borderBottom: '1px solid #f1f5f9' }}>
                                      <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> Marquer effectuée
                                    </button>
                                  )}
                                  {isAvenir && (
                                    <button onClick={() => { setCancelModal(aud); setCancelReason(''); setActiveDropdown(null); }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#92400e', borderBottom: '1px solid #f1f5f9' }}>
                                      <i className="fas fa-ban" style={{ color: '#f59e0b' }}></i> Annuler
                                    </button>
                                  )}
                                  <button onClick={() => { setActiveDropdown(null); handleDeleteAud(aud.id); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#ef4444' }}>
                                    <i className="fas fa-trash"></i> Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Modal Reporter ── */}
        {postponeModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={e => e.target === e.currentTarget && setPostponeModal(null)}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                  <i className="fas fa-redo" style={{ color: '#f59e0b', marginRight: '0.5rem' }}></i>Reporter l'audience
                </h2>
                <button onClick={() => setPostponeModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              {/* Recap audience actuelle */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Audience actuelle</div>
                {postponeModal.hearingDate && <div><i className="fas fa-calendar-day" style={{ marginRight: '0.4rem', color: '#1a56db' }}></i>{new Date(postponeModal.hearingDate).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                {postponeModal.hearingType && <div style={{ marginTop: '0.2rem' }}><i className="fas fa-gavel" style={{ marginRight: '0.4rem', color: '#1a56db' }}></i>{{ CONSULTATION: 'Consultation', HEARING: 'Audience', APPEL: 'Appel', MEDIATION: 'Médiation', AUTRE: 'Autre' }[postponeModal.hearingType] || postponeModal.hearingType}</div>}
              </div>
              <form onSubmit={handlePostponeSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Nouvelle date & heure *</label>
                  <input type="datetime-local" required value={postponeData.newHearingDate}
                    onChange={e => setPostponeData(p => ({ ...p, newHearingDate: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Raison du report *</label>
                  <textarea required rows={3} value={postponeData.postponeReason}
                    onChange={e => setPostponeData(p => ({ ...p, postponeReason: e.target.value }))}
                    placeholder="Ex : Juge indisponible, accord des parties, dossier incomplet..."
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setPostponeModal(null)}
                    style={{ padding: '0.5rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={savingPostpone}
                    style={{ padding: '0.5rem 1.4rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                    {savingPostpone ? '...' : <><i className="fas fa-check"></i> Confirmer le report</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Annuler ── */}
        {cancelModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={e => e.target === e.currentTarget && setCancelModal(null)}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                  <i className="fas fa-ban" style={{ color: '#ef4444', marginRight: '0.5rem' }}></i>Annuler l'audience
                </h2>
                <button onClick={() => setCancelModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Audience à annuler</div>
                {cancelModal.hearingDate && <div><i className="fas fa-calendar-day" style={{ marginRight: '0.4rem', color: '#ef4444' }}></i>{new Date(cancelModal.hearingDate).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
              </div>
              <form onSubmit={handleCancelSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Raison de l'annulation *</label>
                  <textarea required rows={3} value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Ex : Accord entre parties, dossier retiré, erreur de programmation..."
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setCancelModal(null)}
                    style={{ padding: '0.5rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                    Fermer
                  </button>
                  <button type="submit" disabled={savingCancel}
                    style={{ padding: '0.5rem 1.4rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                    {savingCancel ? '...' : <><i className="fas fa-ban"></i> Confirmer l'annulation</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Tribunal ── */}
        {activeTab === 'tribunal' && (
          <div className="dd-tab-content dd-appear">
            {!showTribunalEdit ? (
              <div>
                {caseData?.tribunalId ? (
                  <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dbeafe', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                          <i className="fas fa-landmark"></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>{caseData.tribunalName || '—'}</div>
                          {caseData.courtCaseNumber && <div style={{ fontSize: '0.8rem', color: '#6b7689', marginTop: 2 }}>N° {caseData.courtCaseNumber}</div>}
                        </div>
                      </div>
                      <button className="dd-btn dd-btn-outline" onClick={() => setShowTribunalEdit(true)}>
                        <i className="fas fa-edit"></i> Modifier
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {[
                        { icon: 'fa-gavel', label: 'Phase', val: caseData.casePhase?.replace(/_/g, ' ') },
                        { icon: 'fa-user-tie', label: 'Juge assigné', val: caseData.judgeAssigned },
                        { icon: 'fa-calendar-alt', label: 'Date dépôt', val: caseData.dateFiledAtTribunal },
                      ].map(item => item.val && (
                        <div key={item.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                          <i className={`fas ${item.icon}`} style={{ color: '#1a56db', marginTop: 2, fontSize: '0.85rem' }}></i>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#9aa3b4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1f2e', marginTop: 2 }}>{item.val}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {caseData.notesJudicial && (
                      <div style={{ marginTop: '0.75rem', background: '#f8fafc', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#4a5568' }}>
                        <i className="fas fa-sticky-note" style={{ color: '#f59e0b', marginRight: '0.4rem' }}></i>
                        {caseData.notesJudicial}
                      </div>
                    )}
                  </div>
                ) : (
                  <Empty icon="fa-landmark" msg="Aucun tribunal assigné à ce dossier" />
                )}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <button className="dd-btn dd-btn-primary" onClick={() => setShowTribunalEdit(true)}>
                    <i className="fas fa-plus"></i> {caseData?.tribunalId ? 'Modifier les informations' : 'Assigner un tribunal'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveTribunal} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Tribunal *</label>
                    <select required value={tribunalForm.tribunalId} onChange={e => setTribunalForm({ ...tribunalForm, tribunalId: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e8ecf0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box' }}>
                      <option value="">-- Sélectionner --</option>
                      {tribunals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>N° Dossier Tribunal</label>
                    <input placeholder="Ex : TPI/2024/1234" value={tribunalForm.courtCaseNumber} onChange={e => setTribunalForm({ ...tribunalForm, courtCaseNumber: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e8ecf0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Juge assigné</label>
                    <input placeholder="Ex : Mme Fatma Ben Ali" value={tribunalForm.judgeAssigned} onChange={e => setTribunalForm({ ...tribunalForm, judgeAssigned: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e8ecf0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Phase</label>
                    <select value={tribunalForm.casePhase} onChange={e => setTribunalForm({ ...tribunalForm, casePhase: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e8ecf0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box' }}>
                      <option value="PRE_CONTENTIEUX">Pré-contentieux</option>
                      <option value="INSTANCE">Instance</option>
                      <option value="APPEL">Appel</option>
                      <option value="CASSATION">Cassation</option>
                      <option value="EXECUTION">Exécution</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Date de dépôt</label>
                    <input type="date" value={tribunalForm.dateFiledAtTribunal} onChange={e => setTribunalForm({ ...tribunalForm, dateFiledAtTribunal: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e8ecf0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Notes judiciaires</label>
                    <textarea rows={3} placeholder="Observations, notes..." value={tribunalForm.notesJudicial} onChange={e => setTribunalForm({ ...tribunalForm, notesJudicial: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e8ecf0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="dd-btn dd-btn-outline" onClick={() => setShowTribunalEdit(false)}>Annuler</button>
                  <button type="submit" className="dd-btn dd-btn-primary"><i className="fas fa-save"></i> Sauvegarder</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Séquestre tab ── */}
        {activeTab === 'sequestre' && (
          <div className="dd-tab-content dd-appear">
            <TrustTab caseId={id} />
          </div>
        )}

        {/* ── Factures tab ── */}
        {activeTab === 'factures' && (
          <div className="dd-tab-content dd-appear">
            <FacturesTab caseId={id} />
          </div>
        )}

        {/* ── Bilan tab ── */}
        {activeTab === 'bilan' && (
          <div className="dd-tab-content dd-appear">
            <BillingTab caseId={id} />
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {showGenerator && (
        <InvoiceGenerator
          caseId={id}
          clientId={clientId}
          onClose={() => setShowGenerator(false)}
          onCreated={() => setShowGenerator(false)}
        />
      )}

      {/* ── Modal clôture dossier ── */}
      {closureModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => !closingCase && setClosureModal(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: 500, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}
            onClick={e => e.stopPropagation()}>

            {closureModal === 'loading' ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7689' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
                <p style={{ marginTop: '0.75rem' }}>Chargement du bilan…</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e' }}>
                    <i className="fas fa-lock" style={{ marginRight: '0.5rem', color: '#ef4444' }}></i>
                    Fermer le dossier {closureModal.caseNumber} ?
                  </h2>
                  <button onClick={() => setClosureModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa3b4', fontSize: '1.2rem' }}>×</button>
                </div>

                {/* Bilan financier */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: '0.6rem' }}>Bilan financier</div>
                  {[
                    ['Déposé (séquestre)',  closureModal.totalDeposited],
                    ['Facturé TTC',         closureModal.totalInvoicedTTC],
                    ['Alloué vers factures',closureModal.totalAllocated],
                    ['Remboursé',           closureModal.totalRefunded],
                    ['Solde séquestre',     closureModal.trustBalance],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #e8ecf0' }}>
                      <span style={{ color: '#6b7689' }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{Number(val || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
                    </div>
                  ))}
                </div>

                {/* Statut global */}
                {closureModal.allSettled ? (
                  <div style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    ✅ Tout est réglé — aucune anomalie financière
                  </div>
                ) : (
                  <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.4rem', fontSize: '0.875rem' }}>⚠️ Avertissements (non bloquants)</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#78350f' }}>
                      {closureModal.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#92400e', fontStyle: 'italic' }}>
                      Ces points ne bloquent pas la fermeture. Vous pourrez y remédier après clôture.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setClosureModal(null)} disabled={closingCase}
                    style={{ padding: '0.5rem 1.25rem', border: '1px solid #e8ecf0', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600, color: '#4a5568' }}>
                    Annuler
                  </button>
                  <button onClick={handleConfirmClose} disabled={closingCase}
                    style={{ padding: '0.5rem 1.4rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
                    {closingCase ? <><i className="fas fa-spinner fa-spin"></i> Clôture…</> : <><i className="fas fa-lock"></i> Fermer le dossier</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

/* ── Empty State ── */
const Empty = ({ icon, msg }) => (
  <div className="dd-empty">
    <div className="dd-empty-icon"><i className={`fas ${icon}`}></i></div>
    <p>{msg}</p>
  </div>
);

export default AffaireDetailav;
