import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Phone, DoorOpen, Plus, Trash2, X, UserCheck,
  PhoneCall, CreditCard, Building2, Clock,
  Search, Users, TrendingUp, CalendarDays,
  CheckCircle2, Sparkles
} from 'lucide-react';
import {
  getPhoneCalls, createPhoneCall, deletePhoneCall,
  getPresenceJournals, createPresenceJournal, deletePresenceJournal,
  getUsersByRole
} from '../api';
import './GestionBureau.css';

/* ── utils ──────────────────────────────────────────── */
const fmtTime  = d => d ? new Date(d).toLocaleTimeString('fr-FR',  { hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-FR',  { weekday:'short', day:'2-digit', month:'short' }) : '—';
const fmtFull  = d => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const isToday  = d => d && new Date(d).toDateString() === new Date().toDateString();
const uid      = () => { try { return JSON.parse(localStorage.getItem('user'))?.idu||null; } catch { return null; } };
const partsToISO = p => (p.day && p.month && p.year) ? `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}T${p.hour||'00'}:${p.minute||'00'}` : null;
const norm     = s => (s||'').toLowerCase().replace(/\s+/g,' ').trim();

const COLORS = [
  ['#dbeafe','#1d4ed8'],['#d1fae5','#065f46'],['#fce7f3','#9d174d'],
  ['#ede9fe','#5b21b6'],['#ffedd5','#9a3412'],['#fef9c3','#854d0e'],
];
const pal  = n => COLORS[(n||' ').charCodeAt(0) % COLORS.length];
const init = n => { const p=(n||'').trim().split(/\s+/).filter(Boolean); return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():(p[0]?.[0]||'?').toUpperCase(); };

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function GestionBureau() {
  const [tab,     setTab]     = useState('appels');
  const [appels,  setAppels]  = useState([]);
  const [pres,    setPres]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [panel,   setPanel]   = useState(null);   // null | 'appel' | 'presence'
  const [saving,  setSaving]  = useState(false);
  const [q,       setQ]       = useState('');

  const [fa, setFa] = useState({ callerName:'', callerLastname:'', phoneNumber:'', callReason:'' });
  const [fp, setFp] = useState({ visitorName:'', visitorLastname:'', visitorCin:'', reason:'' });
  const emptyDate = { day:'', month:'', year:'', hour:'', minute:'' };
  const [faDate, setFaDate] = useState(emptyDate);
  const [fpDate, setFpDate] = useState(emptyDate);

  const [clients, setClients]   = useState([]);
  const [sugg,    setSugg]      = useState([]);
  const [showS,   setShowS]     = useState(false);
  const [selA,    setSelA]      = useState(null);
  const [selP,    setSelP]      = useState(null);
  const [dPos,    setDPos]      = useState({top:0,left:0,width:0});
  const refA = useRef(null);
  const refP = useRef(null);

  /* load */
  const load = () => {
    setLoading(true);
    Promise.all([getPhoneCalls().catch(()=>({data:[]})), getPresenceJournals().catch(()=>({data:[]}))])
      .then(([a,p])=>{ setAppels(a.data||[]); setPres(p.data||[]); })
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); getUsersByRole('CLIENT').then(r=>setClients(r.data||[])).catch(()=>{}); },[]);

  /* autocomplete */
  const suggest = (val, ref, setForm) => {
    setForm(prev=>({ ...prev, ...(panel==='appel'?{callerName:val}:{visitorName:val}) }));
    if(panel==='appel') setSelA(null); else setSelP(null);
    if(val.trim().length<2){ setSugg([]); setShowS(false); return; }
    const lq=val.toLowerCase();
    const m=clients.filter(c=>(c.prenom||'').toLowerCase().includes(lq)||(c.nom||'').toLowerCase().includes(lq)||(`${c.prenom} ${c.nom}`).toLowerCase().includes(lq)||(c.tel||'').includes(lq)||(c.CIN||c.cin||'').toLowerCase().includes(lq)).slice(0,6);
    if(m.length&&ref.current){ const r=ref.current.getBoundingClientRect(); setDPos({top:r.bottom+window.scrollY+4,left:r.left+window.scrollX,width:r.width}); }
    setSugg(m); setShowS(m.length>0);
  };

  const pick = c => {
    if(panel==='appel'){ setFa(p=>({...p,callerName:c.prenom||'',callerLastname:c.nom||'',phoneNumber:c.tel||''})); setSelA(c); }
    else { setFp(p=>({...p,visitorName:c.prenom||'',visitorLastname:c.nom||'',visitorCin:c.CIN||c.cin||''})); setSelP(c); }
    setSugg([]); setShowS(false);
  };

  /* submit */
  const submitA = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const id=uid();
      await createPhoneCall({callerName:fa.callerName,callerLastname:fa.callerLastname,phoneNumber:fa.phoneNumber||null,callReason:fa.callReason,callDate:partsToISO(faDate),recordedBy:id?{idu:id}:null});
      setFa({callerName:'',callerLastname:'',phoneNumber:'',callReason:''}); setFaDate(emptyDate); setSelA(null); closePanel(); load();
    } catch { alert('Erreur'); } finally { setSaving(false); }
  };
  const submitP = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const id=uid();
      await createPresenceJournal({visitorName:fp.visitorName,visitorLastname:fp.visitorLastname,visitorCin:fp.visitorCin||null,reason:fp.reason,arrivalTime:partsToISO(fpDate),recordedById:id});
      setFp({visitorName:'',visitorLastname:'',visitorCin:'',reason:''}); setFpDate(emptyDate); setSelP(null); closePanel(); load();
    } catch { alert('Erreur'); } finally { setSaving(false); }
  };

  /* delete */
  const delA = async id => { if(!window.confirm('Supprimer ?')) return; await deletePhoneCall(id).catch(()=>{}); setAppels(p=>p.filter(x=>x.id!==id)); };
  const delP = async id => { if(!window.confirm('Supprimer ?')) return; await deletePresenceJournal(id).catch(()=>{}); setPres(p=>p.filter(x=>x.id!==id)); };

  /* match */
  const mA = a => { if(!a||!clients.length) return null; const ph=(a.phone_number||'').replace(/\s/g,''); const bp=ph&&clients.find(c=>c.tel&&c.tel.replace(/\s/g,'')===ph); if(bp) return bp; const fn=norm(a.caller_full_name); return clients.find(c=>[`${c.prenom} ${c.nom}`,`${c.nom} ${c.prenom}`].map(norm).includes(fn))||null; };
  const mP = p => { if(!p||!clients.length) return null; if(p.visitorCin){ const bc=clients.find(c=>(c.CIN||c.cin)===p.visitorCin); if(bc) return bc; } const fn=norm(`${p.visitorLastname} ${p.visitorName}`); return clients.find(c=>[`${c.nom} ${c.prenom}`,`${c.prenom} ${c.nom}`].map(norm).includes(fn))||null; };

  const closePanel = () => { setPanel(null); setSelA(null); setSelP(null); setShowS(false); };

  /* filtered */
  const lq = q.toLowerCase();
  const fA = appels.filter(a=>!lq||(a.caller_full_name||'').toLowerCase().includes(lq)||(a.phone_number||'').includes(lq)||(a.call_reason||'').toLowerCase().includes(lq));
  const fP = pres.filter(p=>!lq||(`${p.visitorLastname} ${p.visitorName}`).toLowerCase().includes(lq)||(p.visitorCin||'').toLowerCase().includes(lq)||(p.reason||'').toLowerCase().includes(lq));

  const kpis = [
    { label:'Appels total',         val:appels.length,                                    icon:<Phone size={18}/>,       color:'blue'   },
    { label:"Aujourd'hui",          val:appels.filter(a=>isToday(a.call_date)).length,    icon:<TrendingUp size={18}/>,   color:'sky'    },
    { label:'Présences total',      val:pres.length,                                      icon:<DoorOpen size={18}/>,    color:'violet' },
    { label:"Présences auj.",        val:pres.filter(p=>isToday(p.arrivalTime)).length,   icon:<CalendarDays size={18}/>, color:'fuchsia'},
    { label:'Clients reconnus',     val:[...appels.filter(mA),...pres.filter(mP)].length, icon:<Users size={18}/>,       color:'emerald'},
  ];

  /* ── RENDER ─────────────────────────────────────── */
  return (
    <div className="gb">

      {/* ═══ HERO ═════════════════════════════════════ */}
      <div className="gb-hero">
        <div className="gb-hero-glow"/>
        <div className="gb-hero-top">
          <div className="gb-hero-badge"><Sparkles size={11}/> Bureau administratif</div>
          <h1 className="gb-hero-h1">Gestion du Bureau</h1>
          <p className="gb-hero-p">Centralisez et suivez chaque interaction du cabinet — appels entrants et présences des visiteurs.</p>
        </div>
        <div className="gb-hero-btns">
          <button className="gb-btn-outline" onClick={()=>setPanel('appel')}>
            <Phone size={14}/> Enregistrer un appel
          </button>
          <button className="gb-btn-solid" onClick={()=>setPanel('presence')}>
            <Plus size={14}/> Enregistrer une présence
          </button>
        </div>

        {/* KPI strip */}
        <div className="gb-kpis">
          {kpis.map((k,i)=>(
            <div key={i} className={`gb-kpi gb-kpi-${k.color}`}>
              <div className="gb-kpi-ic">{k.icon}</div>
              <div>
                <div className="gb-kpi-n">{k.val}</div>
                <div className="gb-kpi-l">{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TOOLBAR ══════════════════════════════════ */}
      <div className="gb-bar">
        <div className="gb-tabs">
          <button className={`gb-t${tab==='appels'?' a':''}`} onClick={()=>{setTab('appels');setQ('');}}>
            <span className={`gb-t-dot blue`}/>
            Journal d'Appels
            <span className="gb-t-n">{appels.length}</span>
          </button>
          <button className={`gb-t${tab==='presence'?' a':''}`} onClick={()=>{setTab('presence');setQ('');}}>
            <span className={`gb-t-dot violet`}/>
            Journal de Présence
            <span className="gb-t-n">{pres.length}</span>
          </button>
        </div>
        <div className="gb-search">
          <Search size={14}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher…"/>
          {q && <button onClick={()=>setQ('')}><X size={12}/></button>}
        </div>
      </div>

      {/* ═══ CONTENT ══════════════════════════════════ */}
      {loading ? (
        <div className="gb-load"><span className="gb-ring"/><span>Chargement…</span></div>
      ) : (
        <div className="gb-feed">
          {(tab==='appels' ? fA : fP).length === 0 ? (
            <div className="gb-void">
              <div className="gb-void-ic">{tab==='appels'?<Phone size={26}/>:<DoorOpen size={26}/>}</div>
              <strong>{q?'Aucun résultat':`Aucun ${tab==='appels'?'appel':'présence'} enregistré`}</strong>
              <span>{q?'Essayez un autre terme':`Cliquez sur le bouton en haut pour commencer`}</span>
            </div>
          ) : tab === 'appels' ? fA.map(a => {
            const client = mA(a);
            const name   = a.caller_full_name || '—';
            const [bg,fg]= pal(name);
            return (
              <div key={a.id} className="gb-card gb-card-blue">
                <div className="gb-card-stripe blue"/>
                <div className="gb-card-av" style={{background:bg,color:fg}}>{init(name)}</div>
                <div className="gb-card-body">
                  <div className="gb-card-top">
                    <div className="gb-card-name">{name}</div>
                    {client && <span className="gb-badge-ok"><CheckCircle2 size={10}/> Client</span>}
                    {a.phone_number && <span className="gb-badge-phone"><Phone size={10}/> {a.phone_number}</span>}
                  </div>
                  <p className="gb-card-text">{a.call_reason || <em>Aucun motif renseigné</em>}</p>
                </div>
                <div className="gb-card-side">
                  <div className="gb-card-date">{fmtDate(a.call_date)}</div>
                  <div className="gb-card-time"><Clock size={10}/>{fmtTime(a.call_date)}</div>
                  <button className="gb-card-del" onClick={()=>delA(a.id)}><Trash2 size={13}/></button>
                </div>
              </div>
            );
          }) : fP.map(p => {
            const client = mP(p);
            const name   = [p.visitorLastname,p.visitorName].filter(Boolean).join(' ')||'—';
            const [bg,fg]= pal(name);
            return (
              <div key={p.id} className="gb-card gb-card-violet">
                <div className="gb-card-stripe violet"/>
                <div className="gb-card-av" style={{background:bg,color:fg}}>{init(name)}</div>
                <div className="gb-card-body">
                  <div className="gb-card-top">
                    <div className="gb-card-name">{name}</div>
                    {client && <span className="gb-badge-ok"><CheckCircle2 size={10}/> Client</span>}
                    {p.visitorCin && <span className="gb-badge-cin"><CreditCard size={10}/> {p.visitorCin}</span>}
                    {p.recordedByName && <span className="gb-badge-by">par {p.recordedByName}</span>}
                  </div>
                  <p className="gb-card-text">{p.reason || <em>Aucun motif renseigné</em>}</p>
                </div>
                <div className="gb-card-side">
                  <div className="gb-card-date">{fmtDate(p.arrivalTime)}</div>
                  <div className="gb-card-time"><Clock size={10}/>{fmtTime(p.arrivalTime)}</div>
                  <button className="gb-card-del" onClick={()=>delP(p.id)}><Trash2 size={13}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ AUTOCOMPLETE ═════════════════════════════ */}
      {showS && sugg.length>0 && createPortal(
        <div className="gb-drop" style={{top:dPos.top,left:dPos.left,width:dPos.width}}>
          {sugg.map(c=>(
            <div key={c.idu} className="gb-drop-row" onMouseDown={()=>pick(c)}>
              <div className="gb-drop-av">{init(`${c.prenom} ${c.nom}`)}</div>
              <div className="gb-drop-info">
                <b>{c.prenom} {c.nom}</b>
                <span>
                  {c.tel&&<><PhoneCall size={9}/> {c.tel} </>}
                  {(c.CIN||c.cin)&&<><CreditCard size={9}/> {c.CIN||c.cin}</>}
                </span>
              </div>
              <span className="gb-drop-badge">Client</span>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* ═══ SIDE PANEL ═══════════════════════════════ */}
      {panel && <>
        <div className="gb-scrim" onClick={closePanel}/>
        <div className={`gb-panel gb-panel-${panel==='appel'?'blue':'violet'}`}>

          {/* ── Panel Header ── */}
          <div className="gb-ph">
            <div className={`gb-ph-icon gb-ph-icon-${panel==='appel'?'blue':'violet'}`}>
              {panel==='appel'?<Phone size={16}/>:<DoorOpen size={16}/>}
            </div>
            <div className="gb-ph-text">
              <h2>{panel==='appel'?'Enregistrer un appel':'Enregistrer une présence'}</h2>
              <p>{panel==='appel'?'Journalisez un appel téléphonique reçu au cabinet':'Notez l\'arrivée d\'un visiteur au cabinet'}</p>
            </div>
            <button className="gb-ph-close" onClick={closePanel}><X size={14}/></button>
          </div>

          {/* ── Form ── */}
          <form className="gb-panel-form" onSubmit={panel==='appel'?submitA:submitP}>
            <div className="gb-panel-body">

              {/* ── Section: Identité ── */}
              <p className="gb-sec-lbl">Identité</p>
              <div className="gb-row2">
                <div className="gb-f">
                  <label>
                    Prénom <span className="gb-req">*</span>
                    {(selA||selP) && <span className="gb-ok-pill"><UserCheck size={9}/> Connu</span>}
                  </label>
                  <input
                    ref={panel==='appel'?refA:refP}
                    type="text" required
                    placeholder="Prénom…"
                    autoComplete="off"
                    value={panel==='appel'?fa.callerName:fp.visitorName}
                    onChange={e=>suggest(e.target.value,panel==='appel'?refA:refP,panel==='appel'?setFa:setFp)}
                    onBlur={()=>setTimeout(()=>setShowS(false),160)}
                  />
                </div>
                <div className="gb-f">
                  <label>Nom <span className="gb-req">*</span></label>
                  <input type="text" required placeholder="Nom…"
                    value={panel==='appel'?fa.callerLastname:fp.visitorLastname}
                    onChange={e=>panel==='appel'?setFa(p=>({...p,callerLastname:e.target.value})):setFp(p=>({...p,visitorLastname:e.target.value}))}
                  />
                </div>
              </div>

              {/* ── Section: Contact ── */}
              <p className="gb-sec-lbl">{panel==='appel'?'Contact & date':'Visite & date'}</p>
              <div className="gb-f">
                <label>{panel==='appel'?'Numéro de téléphone':'Numéro CIN'}</label>
                <input type="text"
                  placeholder={panel==='appel'?'+212 6XX XXX XXX':'AA123456'}
                  value={panel==='appel'?fa.phoneNumber:fp.visitorCin}
                  onChange={e=>panel==='appel'?setFa(p=>({...p,phoneNumber:e.target.value})):setFp(p=>({...p,visitorCin:e.target.value}))}
                />
              </div>

              <div className="gb-f">
                <label>Date</label>
                <div className="gb-date-row">
                  <select value={panel==='appel'?faDate.day:fpDate.day} onChange={e=>panel==='appel'?setFaDate(d=>({...d,day:e.target.value})):setFpDate(d=>({...d,day:e.target.value}))}>
                    <option value="">Jour</option>
                    {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
                  </select>
                  <select value={panel==='appel'?faDate.month:fpDate.month} onChange={e=>panel==='appel'?setFaDate(d=>({...d,month:e.target.value})):setFpDate(d=>({...d,month:e.target.value}))}>
                    <option value="">Mois</option>
                    {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select value={panel==='appel'?faDate.year:fpDate.year} onChange={e=>panel==='appel'?setFaDate(d=>({...d,year:e.target.value})):setFpDate(d=>({...d,year:e.target.value}))}>
                    <option value="">Année</option>
                    {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="gb-f">
                <label>Heure</label>
                <div className="gb-time-row">
                  <select value={panel==='appel'?faDate.hour:fpDate.hour} onChange={e=>panel==='appel'?setFaDate(d=>({...d,hour:e.target.value})):setFpDate(d=>({...d,hour:e.target.value}))}>
                    <option value="">HH</option>
                    {Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(h=><option key={h} value={h}>{h}h</option>)}
                  </select>
                  <span className="gb-time-sep">:</span>
                  <select value={panel==='appel'?faDate.minute:fpDate.minute} onChange={e=>panel==='appel'?setFaDate(d=>({...d,minute:e.target.value})):setFpDate(d=>({...d,minute:e.target.value}))}>
                    <option value="">Minutes</option>
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Section: Motif ── */}
              <p className="gb-sec-lbl">Motif</p>
              <div className="gb-f">
                <label>Description <span className="gb-req">*</span></label>
                <textarea required rows={4}
                  placeholder={panel==='appel'?'Objet de l\'appel téléphonique…':'Raison de la visite au cabinet…'}
                  value={panel==='appel'?fa.callReason:fp.reason}
                  onChange={e=>panel==='appel'?setFa(p=>({...p,callReason:e.target.value})):setFp(p=>({...p,reason:e.target.value}))}
                />
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="gb-panel-ft">
              <span className="gb-ft-hint"><span className="gb-req">*</span> Champs obligatoires</span>
              <div className="gb-ft-btns">
                <button type="button" className="gb-cancel" onClick={closePanel}>Annuler</button>
                <button type="submit" className={`gb-save gb-save-${panel==='appel'?'blue':'violet'}`} disabled={saving}>
                  {saving ? <><span className="gb-ring sm"/> Enregistrement…</> : <><CheckCircle2 size={14}/> Enregistrer</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </>}
    </div>
  );
}
