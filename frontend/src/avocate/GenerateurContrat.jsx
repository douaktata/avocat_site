import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scale, Briefcase, AlertCircle, ArrowLeft, Loader2,
  Copy, Download, CheckCircle, ChevronRight, Sparkles,
  FileText, Home, Building2, ShoppingCart, ArrowUpCircle,
  Mic2, RefreshCw, BookOpen, FileCheck, ArrowLeftRight,
  Package, Handshake, FileSignature, Gavel, History,
  Search, Trash2, X, Filter, FileDown, Eye,
} from 'lucide-react';
import {
  getContractTemplates, streamContract, exportContractPDF,
  getHistory, getHistoryItem, deleteHistoryItem, downloadTxt, getHistoryCount,
} from '../services/contractService';
import { getCases } from '../api';

// ── Google Fonts ──────────────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    if (document.getElementById('jh-contract-fonts')) return;
    const link  = document.createElement('link');
    link.id     = 'jh-contract-fonts';
    link.rel    = 'stylesheet';
    link.href   = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ── Animation styles ──────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes blink {
    0%,100% { opacity:1; }
    50%      { opacity:0; }
  }
  .fade-up    { animation:fadeUp .4s ease forwards; opacity:0; }
  .cur-blink  { display:inline-block; width:2px; height:1.1em;
                background:#1e3a8a; vertical-align:text-bottom;
                animation:blink .85s step-end infinite; margin-left:1px; }
`;

// ── Category / icon metadata ──────────────────────────────────────────────────
const CATS = [
  { key:'judiciaire', label:'Actes Judiciaires',
    types:['assignation','requete','conclusions','memoire','appel','pourvoi','plaidoirie_ecrite'] },
  { key:'contrats', label:'Contrats & Conventions',
    types:['contrat_travail','contrat_vente','contrat_bail','contrat_partenariat','transaction_amiable'] },
  { key:'societes', label:'Droit des Sociétés',
    types:['statuts_societe','pacte_associes','cession_parts','fonds_de_commerce'] },
];

const CAT_STYLE = {
  judiciaire: { badge:'bg-blue-50 text-blue-700 border-blue-200',    dot:'bg-blue-500',    grad:'from-blue-600 to-blue-800'    },
  contrats:   { badge:'bg-emerald-50 text-emerald-700 border-emerald-200', dot:'bg-emerald-500', grad:'from-emerald-600 to-emerald-800' },
  societes:   { badge:'bg-violet-50 text-violet-700 border-violet-200',   dot:'bg-violet-500',  grad:'from-violet-600 to-violet-800'   },
};

const TYPE_ICONS = {
  assignation:'Gavel', requete:'FileText', conclusions:'FileCheck', memoire:'BookOpen',
  appel:'ArrowUpCircle', pourvoi:'Scale', plaidoirie_ecrite:'Mic2',
  contrat_travail:'Briefcase', contrat_vente:'ShoppingCart', contrat_bail:'Home',
  contrat_partenariat:'Handshake', transaction_amiable:'RefreshCw',
  statuts_societe:'Building2', pacte_associes:'Scale', cession_parts:'ArrowLeftRight',
  fonds_de_commerce:'Package',
};
const ICON_MAP = { Gavel, FileText, FileCheck, BookOpen, ArrowUpCircle, Scale,
  Mic2, Briefcase, ShoppingCart, Home, Handshake, RefreshCw,
  Building2, ArrowLeftRight, Package };

function getIcon(t)  { return ICON_MAP[TYPE_ICONS[t]] || FileSignature; }
function getCatKey(t){ return CATS.find(c=>c.types.includes(t))?.key || 'contrats'; }
function getCatLabel(t){ return CATS.find(c=>c.types.includes(t))?.label || ''; }

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-TN',{ day:'2-digit', month:'short', year:'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
//  MARKDOWN RENDERER — convertit le texte Mistral en JSX propre
// ─────────────────────────────────────────────────────────────────────────────
function renderInline(text, key='') {
  // Handle **bold** and *italic* inline
  const parts = [];
  let rem = text, i = 0;
  while (rem.length) {
    const boldIdx  = rem.indexOf('**');
    const italIdx  = rem.indexOf('*');
    const hasUnder = rem.indexOf('_') !== -1;

    if (boldIdx !== -1 && rem.indexOf('**', boldIdx + 2) !== -1) {
      const end = rem.indexOf('**', boldIdx + 2);
      if (boldIdx > 0) parts.push(<span key={`${key}-t${i++}`}>{rem.slice(0, boldIdx)}</span>);
      parts.push(<strong key={`${key}-b${i++}`} className="font-semibold text-slate-900">{rem.slice(boldIdx+2, end)}</strong>);
      rem = rem.slice(end + 2);
    } else if (italIdx !== -1 && rem.indexOf('*', italIdx + 1) !== -1) {
      const end = rem.indexOf('*', italIdx + 1);
      if (italIdx > 0) parts.push(<span key={`${key}-t${i++}`}>{rem.slice(0, italIdx)}</span>);
      parts.push(<em key={`${key}-i${i++}`} className="italic">{rem.slice(italIdx+1, end)}</em>);
      rem = rem.slice(end + 1);
    } else {
      parts.push(<span key={`${key}-t${i++}`}>{rem}</span>);
      break;
    }
  }
  return parts;
}

function DocumentRenderer({ text, isStreaming }) {
  const lines = text.split('\n');
  const elements = [];
  let listBuf = [];
  let k = 0;

  const flushList = () => {
    if (!listBuf.length) return;
    elements.push(
      <ul key={`ul-${k++}`} className="my-3 space-y-1 pl-5">
        {listBuf.map((item, j) => (
          <li key={j} className="flex gap-2 text-slate-700 leading-relaxed">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>{renderInline(item, `li-${k}-${j}`)}</span>
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();

    // H1 (#)
    if (/^#\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^#+\s+/, '');
      elements.push(
        <h1 key={`h1-${k++}`} className="text-2xl font-bold text-slate-900 text-center mt-6 mb-2 pb-2
          border-b-2 border-slate-800" style={{ fontFamily:"'Cormorant Garamond',serif" }}>
          {txt}
        </h1>
      );
    // H2 (##)
    } else if (/^##\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^#+\s+/, '');
      elements.push(
        <h2 key={`h2-${k++}`} className="text-xl font-bold text-slate-800 mt-5 mb-2"
          style={{ fontFamily:"'Cormorant Garamond',serif" }}>
          {txt}
        </h2>
      );
    // H3 (###)
    } else if (/^###\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^#+\s+/, '');
      elements.push(
        <h3 key={`h3-${k++}`} className="text-base font-semibold text-[#1e3a8a] mt-4 mb-1.5
          uppercase tracking-wide text-sm"
          style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1rem' }}>
          {txt}
        </h3>
      );
    // H4 (####)
    } else if (/^####\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^#+\s+/, '');
      elements.push(
        <h4 key={`h4-${k++}`} className="font-semibold text-slate-700 mt-3 mb-1 text-sm">
          {renderInline(txt, `h4-${k}`)}
        </h4>
      );
    // Horizontal rule
    } else if (/^[-─=]{3,}$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${k++}`} className="my-4 border-slate-300" />);
    // Bullet / list item
    } else if (/^[\-\*•]\s+/.test(line)) {
      listBuf.push(line.replace(/^[\-\*•]\s+/, ''));
    // Numbered list
    } else if (/^\d+\.\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^\d+\.\s+/, '');
      const num = line.match(/^(\d+)/)?.[1] || '1';
      elements.push(
        <div key={`ol-${k++}`} className="flex gap-3 my-1.5 text-slate-700 leading-relaxed">
          <span className="font-semibold text-[#1e3a8a] shrink-0 w-5 text-right">{num}.</span>
          <span>{renderInline(txt, `oli-${k}`)}</span>
        </div>
      );
    // Blank line
    } else if (!line.trim()) {
      flushList();
      if (idx > 0) elements.push(<div key={`sp-${k++}`} className="h-2" />);
    // Normal paragraph
    } else {
      flushList();
      // Lines in ALL CAPS with no special markers → treat as section divider
      if (line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
        elements.push(
          <p key={`cap-${k++}`} className="font-semibold text-slate-800 mt-4 mb-1"
            style={{ fontFamily:"'Cormorant Garamond',serif" }}>
            {renderInline(line, `cap-${k}`)}
          </p>
        );
      } else {
        elements.push(
          <p key={`p-${k++}`} className="text-slate-700 leading-relaxed my-1">
            {renderInline(line, `p-${k}`)}
          </p>
        );
      }
    }
  });

  flushList();

  return (
    <div className="text-sm" style={{ fontFamily:"'Cormorant Garamond',serif", lineHeight:'1.8' }}>
      {elements}
      {isStreaming && <span className="cur-blink" />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function StepBar({ view }) {
  const steps = [{ key:'select', label:'Type' }, { key:'form', label:'Informations' }, { key:'result', label:'Document' }];
  const order = { select:1, form:2, result:3, history:0 };
  const cur = order[view] || 0;
  if (view === 'history') return null;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map(({ key, label }, i) => {
        const n = i + 1;
        const active = n === cur, done = n < cur;
        return (
          <React.Fragment key={key}>
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done  ? 'bg-emerald-500 text-white'
                : active ? 'bg-[#1e3a8a] text-white ring-4 ring-blue-200'
                         : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                {done ? <CheckCircle size={14}/> : n}
              </div>
              <span className={`text-xs font-medium hidden sm:block
                ${active ? 'text-[#1e3a8a]' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VUE 1 — SÉLECTION
// ─────────────────────────────────────────────────────────────────────────────
function ViewSelect({ templates, historyCount, onSelect, onShowHistory }) {
  const [filter, setFilter] = useState('all');

  if (!templates.length) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={17}/>Chargement des modèles…
      </div>
    );
  }

  const byType = Object.fromEntries(templates.map(t => [t.typeContrat, t]));

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-0.5"
            style={{ fontFamily:"'Cormorant Garamond',serif" }}>
            Choisissez un type de document
          </h2>
          <p className="text-slate-400 text-xs">
            {templates.length} modèles — conformes au droit tunisien (COC, CPC, Code du Travail, CSC)
          </p>
        </div>
        <button onClick={onShowHistory}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200
            bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] text-xs font-medium transition-all shrink-0">
          <History size={13}/>
          Historique
          {historyCount > 0 && (
            <span className="bg-[#1e3a8a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {historyCount}
            </span>
          )}
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ key:'all', label:'Tous' }, ...CATS.map(c => ({ key:c.key, label:c.label }))].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${filter === tab.key
                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-[#1e3a8a] bg-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-8">
        {CATS.filter(c => filter === 'all' || c.key === filter).map(cat => {
          const catTpls = cat.types.map(t => byType[t]).filter(Boolean);
          if (!catTpls.length) return null;
          const cs = CAT_STYLE[cat.key];
          return (
            <div key={cat.key}>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                text-xs font-semibold mb-4 border ${cs.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`}/>
                {cat.label}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {catTpls.map((tpl, idx) => {
                  const Icon   = getIcon(tpl.typeContrat);
                  const fields = tpl.fieldsJson ? JSON.parse(tpl.fieldsJson) : [];
                  return (
                    <button key={tpl.id} onClick={() => onSelect(tpl)}
                      className="fade-up group text-left bg-white border border-slate-200
                        rounded-xl p-4 hover:border-blue-400 hover:shadow-md
                        hover:shadow-blue-100 transition-all duration-200"
                      style={{ animationDelay:`${idx * 55}ms` }}>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cs.grad}
                        flex items-center justify-center mb-3
                        group-hover:scale-105 transition-transform`}>
                        <Icon size={18} className="text-white"/>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm mb-1
                        group-hover:text-[#1e3a8a] transition-colors">
                        {tpl.label}
                      </h3>
                      <p className="text-slate-400 text-xs mb-3 leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">{fields.length} champs</span>
                        <ChevronRight size={13} className="text-slate-300
                          group-hover:text-[#1e3a8a] transition-colors"/>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VUE 2 — FORMULAIRE
// ─────────────────────────────────────────────────────────────────────────────
function ViewForm({ template, cases, onSubmit, onBack, loading }) {
  const fields = template.fieldsJson ? JSON.parse(template.fieldsJson) : [];
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map(f => [f.key, '']))
  );
  const [errors, setErrors]       = useState({});
  const [selCase, setSelCase]     = useState('');

  const set = (key, val) => {
    setValues(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: false }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errs = {};
    fields.forEach(f => { if (f.required && !values[f.key]?.trim()) errs[f.key] = true; });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(values, selCase || null);
  };

  const Icon = getIcon(template.typeContrat);
  const cs   = CAT_STYLE[getCatKey(template.typeContrat)];

  const inputCls = key => `w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-slate-800
    placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
    transition-colors ${errors[key] ? 'border-red-400 bg-red-50' : 'border-slate-200'}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cs.grad}
          flex items-center justify-center`}>
          <Icon size={18} className="text-white"/>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800"
            style={{ fontFamily:"'Cormorant Garamond',serif" }}>
            {template.label}
          </h2>
          <p className="text-slate-400 text-xs">Remplissez les informations du document</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {f.label}
                {f.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {f.type === 'select' ? (
                <select value={values[f.key]} onChange={e => set(f.key, e.target.value)}
                  className={inputCls(f.key)}>
                  <option value="">Sélectionner…</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea rows={3} value={values[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.label}
                  className={`${inputCls(f.key)} resize-none`}/>
              ) : (
                <input type={f.type === 'date' ? 'date' : 'text'}
                  value={values[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.type !== 'date' ? f.label : ''}
                  className={inputCls(f.key)}/>
              )}
              {errors[f.key] && <p className="text-red-500 text-xs mt-1">Champ requis</p>}
            </div>
          ))}
        </div>

        {cases.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Lier à un dossier <span className="text-slate-400">(optionnel)</span>
            </label>
            <select value={selCase} onChange={e => setSelCase(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5
                text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200
                focus:border-blue-400 transition-colors">
              <option value="">Aucun dossier</option>
              {cases.map(c => (
                <option key={c.idc} value={c.idc}>
                  {c.case_number} — {c.client_full_name || c.title || ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200
            rounded-lg px-4 py-3">
            <AlertCircle size={14} className="text-red-500 shrink-0"/>
            <p className="text-red-600 text-sm">Veuillez remplir tous les champs obligatoires.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200
              text-slate-600 hover:bg-slate-50 transition-colors text-sm">
            <ArrowLeft size={14}/> Retour
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg
              bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed
              text-white font-semibold text-sm transition-colors shadow-sm">
            {loading
              ? <><Loader2 size={15} className="animate-spin"/> Génération en cours…</>
              : <><Sparkles size={15}/> Générer avec Mistral AI</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VUE 3 — RÉSULTAT (STREAMING + DOCUMENT PROFESSIONNEL)
// ─────────────────────────────────────────────────────────────────────────────
function ViewResult({ template, content, isStreaming, onBack, onRestart, onShowHistory }) {
  const [copied, setCopied]               = useState(false);
  const [downloadingPDF, setDlPDF]        = useState(false);
  const [pdfError, setPdfError]           = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isStreaming) bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [content, isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePDF = async () => {
    setPdfError(null); setDlPDF(true);
    try   { await exportContractPDF(template.label, template.typeContrat, content); }
    catch { setPdfError('Erreur PDF. Réessayez.'); }
    finally { setDlPDF(false); }
  };

  const Icon = getIcon(template.typeContrat);
  const cs   = CAT_STYLE[getCatKey(template.typeContrat)];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cs.grad}
            flex items-center justify-center shrink-0`}>
            <Icon size={15} className="text-white"/>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 truncate"
              style={{ fontFamily:"'Cormorant Garamond',serif" }}>
              {template.label}
            </h2>
            {isStreaming
              ? <p className="text-blue-600 text-xs flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin"/> Génération en cours…
                </p>
              : <p className="text-emerald-600 text-xs flex items-center gap-1">
                  <CheckCircle size={10}/> Document sauvegardé dans l'historique
                </p>}
          </div>
        </div>

        {!isStreaming && (
          <div className="flex gap-2 shrink-0">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200
                hover:bg-slate-50 text-slate-500 text-xs transition-colors">
              {copied ? <CheckCircle size={12} className="text-emerald-500"/> : <Copy size={12}/>}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button onClick={() => downloadTxt(template.label, content)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200
                hover:bg-slate-50 text-slate-500 text-xs transition-colors">
              <FileDown size={12}/>.txt
            </button>
            <button onClick={handlePDF} disabled={downloadingPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a8a]
                hover:bg-[#1e40af] disabled:opacity-50 text-white text-xs font-semibold
                transition-colors shadow-sm">
              {downloadingPDF ? <><Loader2 size={12} className="animate-spin"/>PDF…</> : <><Download size={12}/>PDF</>}
            </button>
          </div>
        )}
      </div>

      {pdfError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200
          rounded-lg px-3 py-2 mb-3">
          <AlertCircle size={13} className="text-red-500 shrink-0"/>
          <p className="text-red-600 text-xs">{pdfError}</p>
        </div>
      )}

      {/* Document — paper style */}
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 shadow-sm"
        style={{ minHeight:'52vh' }}>
        <div className="h-full overflow-y-auto bg-white">
          {/* Document header bar */}
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Document Juridique
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('fr-TN', { day:'2-digit', month:'long', year:'numeric' })}
            </span>
          </div>
          {/* Content */}
          <div className="px-10 py-8 max-w-3xl mx-auto">
            <DocumentRenderer text={content} isStreaming={isStreaming}/>
            <div ref={bottomRef}/>
          </div>
          {/* Footer */}
          {!isStreaming && content && (
            <div className="border-t border-slate-100 px-10 py-4 bg-amber-50/60">
              <p className="text-amber-700 text-xs leading-relaxed flex gap-2">
                <AlertCircle size={13} className="shrink-0 mt-0.5"/>
                <span>
                  <strong>Avertissement IA :</strong> Ce document est généré à titre indicatif.
                  Il doit obligatoirement être relu et validé par un avocat qualifié avant toute utilisation juridique.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {!isStreaming && (
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200
              text-slate-500 hover:bg-slate-50 transition-colors text-sm">
            <ArrowLeft size={14}/> Modifier
          </button>
          <button onClick={onShowHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200
              text-[#1e3a8a] hover:bg-blue-50 transition-colors text-sm">
            <History size={14}/> Voir l'historique
          </button>
          <button onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a8a]
              hover:bg-[#1e40af] text-white font-semibold text-sm transition-colors shadow-sm ml-auto">
            <Sparkles size={14}/> Nouveau document
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VUE 4 — HISTORIQUE
// ─────────────────────────────────────────────────────────────────────────────
function ViewHistory({ onBack }) {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selected,  setSelected]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [copiedId,  setCopiedId]  = useState(null);

  useEffect(() => {
    getHistory().then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const ms = !search.trim() ||
      (item.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.preview || '').toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || getCatKey(item.templateType) === catFilter;
    return ms && mc;
  });

  const handleDelete = async id => {
    setDeleting(id);
    try {
      await deleteHistoryItem(id);
      setItems(p => p.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {/**/} finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500
            hover:bg-slate-50 transition-colors">
          <ArrowLeft size={15}/>
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-800"
            style={{ fontFamily:"'Cormorant Garamond',serif" }}>
            Historique des documents
          </h2>
          <p className="text-slate-400 text-xs">
            {items.length} document{items.length !== 1 ? 's' : ''} généré{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou contenu…"
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5
              text-sm text-slate-800 placeholder-slate-300
              focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"/>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400 shrink-0"/>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2.5
              text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200
              focus:border-blue-400">
            <option value="all">Toutes catégories</option>
            {CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={16}/>Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <History size={32} className="mb-3 opacity-40"/>
          <p className="text-sm text-slate-400">
            {search || catFilter !== 'all' ? 'Aucun résultat.' : 'Aucun document généré pour l\'instant.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item, idx) => {
            const Icon = getIcon(item.templateType);
            const ck   = getCatKey(item.templateType);
            const cs   = CAT_STYLE[ck];
            return (
              <div key={item.id}
                className="fade-up group bg-white border border-slate-200
                  hover:border-blue-300 hover:shadow-sm rounded-xl p-4 transition-all"
                style={{ animationDelay:`${idx * 35}ms` }}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cs.grad}
                    flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={15} className="text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm"
                        style={{ fontFamily:"'Cormorant Garamond',serif" }}>
                        {item.label || item.templateType}
                      </h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cs.badge}`}>
                        {getCatLabel(item.templateType)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-1.5 line-clamp-2">
                      {item.preview}
                    </p>
                    <p className="text-slate-300 text-xs">{fmtDate(item.createdAt)}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelected(item)} title="Aperçu"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400
                        hover:text-[#1e3a8a] hover:border-blue-300 transition-colors">
                      <Eye size={13}/>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(item.preview || ''); setCopiedId(item.id); setTimeout(()=>setCopiedId(null),2000); }}
                      title="Copier" className="p-1.5 rounded-lg border border-slate-200
                        text-slate-400 hover:text-[#1e3a8a] hover:border-blue-300 transition-colors">
                      {copiedId === item.id ? <CheckCircle size={13} className="text-emerald-500"/> : <Copy size={13}/>}
                    </button>
                    <button onClick={() => downloadTxt(item.label||item.templateType, item.preview||'')}
                      title="Télécharger" className="p-1.5 rounded-lg border border-slate-200
                        text-slate-400 hover:text-[#1e3a8a] hover:border-blue-300 transition-colors">
                      <Download size={13}/>
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      title="Supprimer" className="p-1.5 rounded-lg border border-slate-200
                        text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors
                        disabled:opacity-40">
                      {deleting === item.id ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <HistoryModal item={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

// ── Modale d'aperçu complet ───────────────────────────────────────────────────
function HistoryModal({ item, onClose }) {
  const [full,    setFull]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    getHistoryItem(item.id)
      .then(r => setFull(r.data))
      .catch(() => setFull(null))
      .finally(() => setLoading(false));
  }, [item.id]);

  const label   = full?.label || item.label || item.templateType;
  const content = full?.content || item.preview || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)' }}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl
        max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm"
            style={{ fontFamily:"'Cormorant Garamond',serif" }}>
            {label}
          </h3>
          <div className="flex gap-2">
            {!loading && <>
              <button onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200
                  hover:bg-slate-50 text-slate-500 text-xs transition-colors">
                {copied ? <CheckCircle size={12} className="text-emerald-500"/> : <Copy size={12}/>}
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button onClick={() => downloadTxt(label, content)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a8a]
                  hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors">
                <Download size={12}/>.txt
              </button>
            </>}
            <button onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400
                hover:bg-slate-50 transition-colors">
              <X size={14}/>
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden m-4 rounded-xl border border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <Loader2 className="animate-spin mr-2" size={15}/>Chargement…
            </div>
          ) : (
            <div className="h-full bg-white overflow-y-auto px-10 py-8 max-w-3xl mx-auto">
              <DocumentRenderer text={content} isStreaming={false}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function GenerateurContrat() {
  useFonts();

  const [view,         setView]         = useState('select');
  const [templates,    setTemplates]    = useState([]);
  const [cases,        setCases]        = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [content,      setContent]      = useState('');
  const [isStreaming,  setIsStreaming]  = useState(false);
  const [error,        setError]        = useState(null);
  const [historyCount, setHistoryCount] = useState(0);

  const abortRef = useRef(null);

  useEffect(() => {
    getContractTemplates()
      .then(r => setTemplates(r.data))
      .catch(() => setError('Impossible de charger les modèles.'));
    getCases().then(r => setCases(r.data)).catch(() => {});
    getHistoryCount().then(r => setHistoryCount(r.data?.count ?? 0)).catch(() => {});
  }, []);

  useEffect(() => () => { abortRef.current?.(); }, []);

  const handleSelect = tpl => { setSelected(tpl); setView('form'); };

  const handleSubmit = useCallback((formData, caseId) => {
    setContent(''); setError(null); setIsStreaming(true); setView('result');
    abortRef.current = streamContract(
      { templateId: selected.id, formData, caseId: caseId ? Number(caseId) : null },
      token => setContent(p => p + token),
      ()    => { setIsStreaming(false); setHistoryCount(c => c + 1); },
      err   => { setError(err.message); setIsStreaming(false); }
    );
  }, [selected]);

  const handleRestart = () => {
    abortRef.current?.();
    setView('select'); setSelected(null); setContent(''); setError(null); setIsStreaming(false);
  };

  const isResult = view === 'result';

  return (
    <>
      <style>{STYLES}</style>
      {/* Page background matches Layout.css --bg */}
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8"
        style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>
        <div className="max-w-5xl mx-auto">

          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] flex items-center justify-center shadow-sm">
                <Sparkles size={18} className="text-white"/>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900"
                  style={{ fontFamily:"'Cormorant Garamond',serif", letterSpacing:'0.01em' }}>
                  Générateur de Documents Juridiques
                </h1>
                <p className="text-slate-400 text-xs">
                  IA Mistral — Droit tunisien (COC · CPC · Code du Travail · CSC)
                </p>
              </div>
            </div>
          </div>

          <StepBar view={view}/>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200
              rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5"/>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Main card */}
          <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm
            ${isResult ? 'flex flex-col' : ''}`}
            style={isResult ? { minHeight:'78vh' } : {}}>

            {view === 'select' && (
              <ViewSelect templates={templates} historyCount={historyCount}
                onSelect={handleSelect} onShowHistory={() => setView('history')}/>
            )}
            {view === 'form' && selected && (
              <ViewForm template={selected} cases={cases}
                onSubmit={handleSubmit} onBack={() => setView('select')} loading={isStreaming}/>
            )}
            {view === 'result' && selected && (
              <ViewResult template={selected} content={content} isStreaming={isStreaming}
                onBack={() => setView('form')} onRestart={handleRestart}
                onShowHistory={() => setView('history')}/>
            )}
            {view === 'history' && <ViewHistory onBack={() => setView('select')}/>}
          </div>
        </div>
      </div>
    </>
  );
}
