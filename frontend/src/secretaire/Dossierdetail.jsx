import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Gavel, FileSpreadsheet, Coins,
  Landmark, Info, Hash, Download, File, Sparkles,
  FolderX, CalendarX, Scale, Briefcase, Home, HardHat,
  Heart, ScrollText, Folder, Users, Eye, Lock,
  User, CalendarPlus, StickyNote, Layers, Flag,
  CheckCircle2, Clock, Loader2, Building2, Upload,
  AlertCircle,
} from 'lucide-react';
import { getCase, getDocumentsByCase, getAudiencesByCase, getTribunals, uploadDocument, downloadDocument, deleteDocument } from '../api';
import FacturesTabSec from './FacturesTabSec';
import SequestreTabSec from './SequestreTabSec';
import './Dossierdetail.css';

/* ─── Meta maps ─────────────────────────────────────── */
const TYPE_META = {
  Divorce:    { Icon: Heart,       color: '#ec4899', bg: '#fce7f3' },
  Commercial: { Icon: Briefcase,   color: '#3b82f6', bg: '#dbeafe' },
  Succession: { Icon: ScrollText,  color: '#8b5cf6', bg: '#ede9fe' },
  Immobilier: { Icon: Home,        color: '#10b981', bg: '#d1fae5' },
  Pénal:      { Icon: Gavel,       color: '#ef4444', bg: '#fee2e2' },
  Travail:    { Icon: HardHat,     color: '#f59e0b', bg: '#fef3c7' },
  Famille:    { Icon: Users,       color: '#06b6d4', bg: '#cffafe' },
  Civil:      { Icon: Scale,       color: '#0ea5e9', bg: '#e0f2fe' },
};
const defaultType = { Icon: Folder, color: '#64748b', bg: '#f1f5f9' };

const STATUT_META = {
  en_cours:   { label: 'En cours',   cls: 'dds-s-open',    Icon: Loader2    },
  en_attente: { label: 'En attente', cls: 'dds-s-pending',  Icon: Clock      },
  cloture:    { label: 'Clôturé',   cls: 'dds-s-closed',  Icon: CheckCircle2 },
};
const STATUS_MAP = { OPEN: 'en_cours', PENDING: 'en_attente', CLOSED: 'cloture' };

const PRIO_META = {
  urgente: { label: 'Urgente', color: '#ef4444', bg: '#fee2e2' },
  haute:   { label: 'Haute',   color: '#f59e0b', bg: '#fef3c7' },
  normale: { label: 'Normale', color: '#64748b', bg: '#f1f5f9' },
};

const AUD_STATUS = {
  SCHEDULED: { label: 'À venir',   cls: 'dds-b-blue'   },
  COMPLETED: { label: 'Effectuée', cls: 'dds-b-green'  },
  POSTPONED: { label: 'Reportée',  cls: 'dds-b-amber'  },
  CANCELLED: { label: 'Annulée',   cls: 'dds-b-red'    },
};

const fmtDate = d => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';
const fmtDateTime = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

/* ─── Component ─────────────────────────────────────── */
export default function DossierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab,    setActiveTab]    = useState('documents');
  const [dossier,      setDossier]      = useState(null);
  const [caseData,     setCaseData]     = useState(null);
  const [documents,    setDocuments]    = useState([]);
  const [audiences,    setAudiences]    = useState([]);
  const [tribunals,    setTribunals]    = useState([]);
  const [statut,       setStatut]       = useState('en_cours');
  const [priorite,     setPriorite]     = useState('normale');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [showUpload,   setShowUpload]   = useState(false);
  const [docFile,      setDocFile]      = useState(null);
  const [savingDoc,    setSavingDoc]    = useState(false);

  const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.idu; } catch { return null; } })();

  const loadDocuments = () =>
    getDocumentsByCase(id)
      .then(r => setDocuments(r.data.map(d => ({
        id: d.idd, nom: d.file_name || '—', type: d.file_type || '—',
        date: d.uploaded_at ? d.uploaded_at.split('T')[0] : null,
        uploadedBy: d.uploaded_by_name || '—',
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
          numero:        c.case_number || '—',
          client:        c.client_full_name || '—',
          clientId:      c.client_id,
          type:          c.case_type || 'Autre',
          dateOuverture: c.created_at ? c.created_at.split('T')[0] : null,
        });
        setDocuments(docsRes.data.map(d => ({
          id: d.idd, nom: d.file_name || '—', type: d.file_type || '—',
          date: d.uploaded_at ? d.uploaded_at.split('T')[0] : null,
          uploadedBy: d.uploaded_by_name || '—',
        })));
      })
      .catch(() => setError('Impossible de charger ce dossier'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpload = e => {
    e.preventDefault();
    if (!docFile) return;
    setSavingDoc(true);
    const fd = new FormData();
    fd.append('file', docFile);
    fd.append('caseId', id);
    fd.append('uploadedBy', userId);
    uploadDocument(fd)
      .then(() => { loadDocuments(); setShowUpload(false); setDocFile(null); })
      .catch(err => alert(err.response?.data?.message || 'Erreur lors du téléversement'))
      .finally(() => setSavingDoc(false));
  };

  const handleDownload = async docId => {
    try {
      const res = await downloadDocument(docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = documents.find(d => d.id === docId)?.nom || 'document';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Erreur lors du téléchargement'); }
  };

  const handleDeleteDoc = docId => {
    if (!window.confirm('Supprimer ce document ?')) return;
    deleteDocument(docId).then(loadDocuments).catch(() => alert('Erreur'));
  };

  /* ─── Loading ── */
  if (loading) return (
    <div className="dds">
      <div className="dds-loading">
        <div className="dds-spinner" />
        <span>Chargement du dossier…</span>
      </div>
    </div>
  );

  /* ─── Error ── */
  if (error || !dossier) return (
    <div className="dds">
      <div className="dds-not-found">
        <div className="dds-nf-icon"><FolderX size={32} /></div>
        <h2>Dossier introuvable</h2>
        <p>{error || 'Ce dossier n\'existe pas ou a été supprimé.'}</p>
        <button className="dds-nf-btn" onClick={() => navigate('/secretaire/dossiers')}>
          <ArrowLeft size={14} /> Retour aux dossiers
        </button>
      </div>
    </div>
  );

  const tm = TYPE_META[dossier.type] || defaultType;
  const sm = STATUT_META[statut]     || STATUT_META.en_cours;
  const pm = PRIO_META[priorite]     || PRIO_META.normale;
  const { Icon: TypeIcon } = tm;
  const { Icon: StatutIcon } = sm;

  const tribunalInfo = tribunals.find(t => t.id === caseData?.tribunalId) || null;

  const tabs = [
    { key: 'documents', label: 'Documents', Icon: FileText,       count: documents.length },
    { key: 'audiences', label: 'Audiences', Icon: Gavel,          count: audiences.length },
    { key: 'factures',  label: 'Factures',  Icon: FileSpreadsheet, count: null             },
    { key: 'sequestre', label: 'Séquestre', Icon: Coins,          count: null             },
    { key: 'tribunal',  label: 'Tribunal',  Icon: Landmark,        count: caseData?.tribunalId ? 1 : 0 },
    { key: 'infos',     label: 'Infos',     Icon: Info,            count: null             },
  ];

  return (
    <div className="dds">

      {/* ── BACK ── */}
      <button className="dds-back" onClick={() => navigate('/secretaire/dossiers')}>
        <ArrowLeft size={14} /> Retour aux dossiers
      </button>

      {/* ── HEADER BANNER ── */}
      <div className="dds-header">
        <div className="dds-header-blob" />

        <div className="dds-header-top">
          <div className="dds-eyebrow"><Sparkles size={11} /> Dossier juridique</div>
          <div className="dds-header-row">
            <div className="dds-type-icon" style={{ background: tm.bg, color: tm.color }}>
              <TypeIcon size={26} />
            </div>
            <div className="dds-header-info">
              <h1 className="dds-title">
                N° <em>{dossier.numero}</em>
              </h1>
              <p className="dds-subtitle">
                <TypeIcon size={13} style={{ color: tm.color }} /> {dossier.type}
                &nbsp;·&nbsp;
                <User size={13} />
                <button
                  className="dds-client-link"
                  onClick={() => dossier.clientId && navigate(`/secretaire/clients/${dossier.clientId}`)}
                >
                  {dossier.client}
                </button>
              </p>
              <div className="dds-header-badges">
                <span className={`dds-badge-status ${sm.cls}`}>
                  <StatutIcon size={11} /> {sm.label}
                </span>
                <span className="dds-badge-prio" style={{ background: pm.bg, color: pm.color }}>
                  <Flag size={10} /> {pm.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="dds-header-divider" />

        <div className="dds-header-stats">
          <div className="dds-hstat">
            <span className="dds-hstat-number">{documents.length}</span>
            <span className="dds-hstat-label">Documents</span>
          </div>
          <div className="dds-hstat-sep" />
          <div className="dds-hstat">
            <span className="dds-hstat-number">{audiences.length}</span>
            <span className="dds-hstat-label">Audiences</span>
          </div>
          <div className="dds-hstat-sep" />
          <div className="dds-hstat">
            <span className="dds-hstat-number">{fmtDate(dossier.dateOuverture)}</span>
            <span className="dds-hstat-label">Date d'ouverture</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="dds-tabs">
        {tabs.map(({ key, label, Icon: TabIcon, count }) => (
          <button
            key={key}
            className={`dds-tab ${activeTab === key ? 'dds-tab-active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <TabIcon size={14} />
            {label}
            {count !== null && <span className="dds-tab-count">{count}</span>}
          </button>
        ))}
      </div>

      {/* ══ DOCUMENTS ══ */}
      {activeTab === 'documents' && (
        <div className="dds-section">
          <div className="dds-section-head">
            <div className="dds-section-ttl"><FileText size={15} /> Documents</div>
            <button className="dds-btn-primary" onClick={() => setShowUpload(v => !v)}>
              <Upload size={13} /> {showUpload ? 'Annuler' : 'Ajouter'}
            </button>
          </div>

          {showUpload && (
            <form className="dds-upload-form" onSubmit={handleUpload}>
              <label className="dds-file-label">
                <File size={15} />
                {docFile ? docFile.name : 'Choisir un fichier…'}
                <input type="file" style={{ display: 'none' }} onChange={e => setDocFile(e.target.files[0])} />
              </label>
              <button type="submit" className="dds-btn-primary" disabled={!docFile || savingDoc}>
                {savingDoc ? <><Loader2 size={13} className="dds-spin" /> Envoi…</> : <><Upload size={13} /> Envoyer</>}
              </button>
            </form>
          )}

          {documents.length === 0 ? (
            <div className="dds-empty">
              <div className="dds-empty-icon"><FileText size={28} /></div>
              <p className="dds-empty-title">Aucun document pour ce dossier</p>
              <p className="dds-empty-sub">Ajoutez un document via le bouton ci-dessus</p>
            </div>
          ) : (
            <div className="dds-table-wrap">
              <table className="dds-table">
                <thead><tr>
                  <th>Nom du fichier</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Ajouté par</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="dds-td-bold">
                        <File size={13} className="dds-td-ic" /> {doc.nom}
                      </td>
                      <td><span className="dds-chip">{doc.type}</span></td>
                      <td>{fmtDate(doc.date)}</td>
                      <td>{doc.uploadedBy}</td>
                      <td>
                        <button className="dds-icon-btn" title="Télécharger" onClick={() => handleDownload(doc.id)}>
                          <Download size={13} />
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

      {/* ══ AUDIENCES ══ */}
      {activeTab === 'audiences' && (
        <div className="dds-section">
          <div className="dds-section-head">
            <div className="dds-section-ttl"><Gavel size={15} /> Audiences</div>
            <span className="dds-read-only"><Lock size={11} /> Gérées par l'avocat</span>
          </div>

          {audiences.length === 0 ? (
            <div className="dds-empty">
              <div className="dds-empty-icon"><CalendarX size={28} /></div>
              <p className="dds-empty-title">Aucune audience pour ce dossier</p>
              <p className="dds-empty-sub">Les audiences sont planifiées par l'avocat</p>
            </div>
          ) : (
            <div className="dds-table-wrap">
              <table className="dds-table">
                <thead><tr>
                  <th>Date &amp; heure</th>
                  <th>Type</th>
                  <th>Salle</th>
                  <th>Juge</th>
                  <th>Statut</th>
                  <th>Notes</th>
                </tr></thead>
                <tbody>
                  {audiences.map(aud => {
                    const as = AUD_STATUS[aud.status] || { label: aud.status, cls: '' };
                    return (
                      <tr key={aud.id} className={aud.status === 'SCHEDULED' ? 'dds-tr-highlight' : ''}>
                        <td className="dds-td-bold">{fmtDateTime(aud.hearingDate)}</td>
                        <td>{aud.hearingType || '—'}</td>
                        <td>{aud.roomNumber || '—'}</td>
                        <td>
                          {aud.judgeName
                            ? <span className="dds-judge"><User size={12} />{aud.judgeName}</span>
                            : '—'
                          }
                        </td>
                        <td>
                          <span className={`dds-badge ${as.cls}`}>{as.label}</span>
                          {aud.status === 'POSTPONED' && aud.postponeReason && (
                            <div className="dds-postpone-reason">↻ {aud.postponeReason}</div>
                          )}
                        </td>
                        <td className="dds-td-note">{aud.description || aud.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ FACTURES ══ */}
      {activeTab === 'factures' && (
        <div className="dds-tab-content">
          <FacturesTabSec caseId={id} />
        </div>
      )}

      {/* ══ SÉQUESTRE ══ */}
      {activeTab === 'sequestre' && (
        <div className="dds-tab-content">
          <SequestreTabSec caseId={id} />
        </div>
      )}

      {/* ══ TRIBUNAL ══ */}
      {activeTab === 'tribunal' && (
        <div className="dds-section">
          <div className="dds-section-head">
            <div className="dds-section-ttl"><Landmark size={15} /> Informations du Tribunal</div>
            <span className="dds-read-only"><Lock size={11} /> Gérées par l'avocat</span>
          </div>

          {!caseData?.tribunalId ? (
            <div className="dds-empty">
              <div className="dds-empty-icon"><Landmark size={28} /></div>
              <p className="dds-empty-title">Aucun tribunal assigné</p>
              <p className="dds-empty-sub">Le tribunal est renseigné par l'avocat en charge</p>
            </div>
          ) : (
            <div className="dds-info-grid">
              {[
                { Icon: Landmark,     label: 'Tribunal',             value: tribunalInfo?.name || caseData?.tribunalId || '—', color: '#3b82f6', bg: '#dbeafe' },
                { Icon: Hash,         label: 'N° dossier tribunal',  value: caseData?.courtCaseNumber || '—',                  color: '#8b5cf6', bg: '#ede9fe' },
                { Icon: User,         label: 'Juge assigné',         value: caseData?.judgeAssigned || '—',                    color: '#f59e0b', bg: '#fef3c7' },
                { Icon: Layers,       label: 'Phase',                value: caseData?.casePhase || '—',                        color: '#10b981', bg: '#d1fae5' },
                { Icon: CalendarPlus, label: 'Date dépôt tribunal',  value: fmtDate(caseData?.dateFiledAtTribunal),             color: '#06b6d4', bg: '#cffafe' },
              ].map(({ Icon: Ic, label, value, color, bg }) => (
                <div key={label} className="dds-minfo">
                  <div className="dds-minfo-ic" style={{ background: bg, color }}>
                    <Ic size={15} />
                  </div>
                  <div>
                    <label>{label}</label>
                    <p>{value}</p>
                  </div>
                </div>
              ))}
              {caseData?.notesJudicial && (
                <div className="dds-minfo dds-minfo-full">
                  <div className="dds-minfo-ic" style={{ background: '#f1f5f9', color: '#64748b' }}>
                    <StickyNote size={15} />
                  </div>
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

      {/* ══ INFOS ══ */}
      {activeTab === 'infos' && (
        <div className="dds-section">
          <div className="dds-section-head">
            <div className="dds-section-ttl"><Info size={15} /> Informations générales</div>
          </div>

          <div className="dds-info-grid">
            {[
              { Icon: tm.Icon,      label: 'Type de dossier',  value: dossier.type,                  color: tm.color,    bg: tm.bg               },
              { Icon: User,         label: 'Client',           value: dossier.client,                color: '#3b82f6',   bg: '#dbeafe'            },
              { Icon: CalendarPlus, label: "Date d'ouverture", value: fmtDate(dossier.dateOuverture), color: '#10b981',   bg: '#d1fae5'            },
              { Icon: sm.Icon,      label: 'Statut',           value: sm.label,                      color: '#2563eb',   bg: '#eff6ff'            },
              { Icon: Flag,         label: 'Priorité',         value: pm.label,                      color: pm.color,    bg: pm.bg                },
              { Icon: FileText,     label: 'Documents',        value: `${documents.length} fichier${documents.length !== 1 ? 's' : ''}`, color: '#64748b', bg: '#f1f5f9' },
              { Icon: Gavel,        label: 'Audiences',        value: `${audiences.length} audience${audiences.length !== 1 ? 's' : ''}`, color: '#64748b', bg: '#f1f5f9' },
            ].map(({ Icon: Ic, label, value, color, bg }) => (
              <div key={label} className="dds-minfo">
                <div className="dds-minfo-ic" style={{ background: bg, color }}>
                  <Ic size={15} />
                </div>
                <div>
                  <label>{label}</label>
                  <p>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dds-notice">
            <AlertCircle size={17} />
            <div>
              <strong>Accès restreint</strong>
              <p>Les notes juridiques, la gestion du statut et les audiences sont réservées à l'avocat. La secrétaire peut consulter les documents, les factures et le séquestre.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
