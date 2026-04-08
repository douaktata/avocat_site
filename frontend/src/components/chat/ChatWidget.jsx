import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, CheckCircle, RefreshCw, Scale, Clock, ChevronLeft, Trash2 } from 'lucide-react';
import { sendMessage, createNewSession, getHistory, getSessions, deleteHistory } from '../../services/chatApi';
import './ChatWidget.css';

const SESSION_KEY = 'jurishub_chat_session';

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState('chat'); // 'chat' | 'sessions'
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_KEY) || null);
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
            if (messages.length === 0) {
                const existing = localStorage.getItem(SESSION_KEY);
                if (existing) loadHistory(existing);
                else initSession();
            }
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (view === 'sessions') fetchSessions();
    }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Session management ────────────────────────────────────────────────────

    const loadHistory = async (sid) => {
        setLoading(true);
        try {
            const res = await getHistory(sid);
            if (!res.data.length) { await initSession(); return; }
            setMessages(res.data.map(m => ({ role: m.role, content: m.content, suggestions: [] })));
        } catch {
            localStorage.removeItem(SESSION_KEY);
            setSessionId(null);
            await initSession();
        } finally {
            setLoading(false);
        }
    };

    const initSession = async () => {
        setLoading(true);
        try {
            const res = await createNewSession();
            const data = res.data;
            setSessionId(data.sessionId);
            localStorage.setItem(SESSION_KEY, data.sessionId);
            appendBotMessage(data);
        } catch {
            appendRawBot('Le service est temporairement indisponible. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await getSessions();
            setSessions(res.data);
        } catch {
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const switchToSession = async (sid) => {
        if (sid === sessionId) { setView('chat'); return; }
        setMessages([]);
        setSessionId(sid);
        localStorage.setItem(SESSION_KEY, sid);
        setView('chat');
        await loadHistory(sid);
    };

    const handleDeleteSession = async (e, sid) => {
        e.stopPropagation();
        try {
            await deleteHistory(sid);
            setSessions(prev => prev.filter(s => s.sessionId !== sid));
            if (sid === sessionId) {
                localStorage.removeItem(SESSION_KEY);
                setSessionId(null);
                setMessages([]);
            }
        } catch { /* ignore */ }
    };

    const startNewConversation = async () => {
        localStorage.removeItem(SESSION_KEY);
        setSessionId(null);
        setMessages([]);
        setView('chat');
        await initSession();
    };

    // ── Message handling ──────────────────────────────────────────────────────

    const handleSend = async (text) => {
        const msg = (text ?? input).trim();
        if (!msg || loading) return;
        setInput('');
        if (inputRef.current) { inputRef.current.style.height = 'auto'; }
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);
        try {
            const res = await sendMessage(msg, sessionId);
            const data = res.data;
            if (data.sessionId && data.sessionId !== sessionId) {
                setSessionId(data.sessionId);
                localStorage.setItem(SESSION_KEY, data.sessionId);
            }
            appendBotMessage(data);
        } catch {
            appendRawBot('Une erreur s\'est produite. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const appendBotMessage = (data) => {
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message || '',
            suggestions: data.suggestions || [],
            extractedData: data.extractedData,
            readyToConfirm: data.readyToConfirm,
            appointmentConfirmed: data.appointmentConfirmed,
            appointmentRequestId: data.appointmentRequestId,
        }]);
    };

    const appendRawBot = (text) => {
        setMessages(prev => [...prev, { role: 'assistant', content: text, suggestions: [] }]);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <button className={`cw-fab ${open ? 'cw-fab--open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Assistant JurisHub">
                <span className="cw-fab-inner">
                    {open ? <X size={20} strokeWidth={2.5} /> : <MessageCircle size={22} strokeWidth={2} />}
                </span>
                {!open && <span className="cw-fab-pulse" />}
            </button>

            <div className={`cw-panel ${open ? 'cw-panel--open' : ''}`}>

                {/* ── HEADER ── */}
                <div className="cw-header">
                    <div className="cw-header-left">
                        {view === 'sessions' ? (
                            <button className="cw-icon-btn" onClick={() => setView('chat')}>
                                <ChevronLeft size={16} strokeWidth={2.5} />
                            </button>
                        ) : (
                            <div className="cw-header-avatar"><Scale size={15} strokeWidth={2} /></div>
                        )}
                        <div>
                            <div className="cw-header-title">
                                {view === 'sessions' ? 'Historique des conversations' : 'Assistant JurisHub'}
                            </div>
                            {view === 'chat' && (
                                <div className="cw-header-sub">
                                    <span className="cw-online-dot" />
                                    En ligne · Répond instantanément
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="cw-header-actions">
                        {view === 'chat' && (
                            <>
                                <button className="cw-icon-btn" onClick={() => setView('sessions')} title="Historique">
                                    <Clock size={14} strokeWidth={2} />
                                </button>
                                <button className="cw-icon-btn" onClick={startNewConversation} title="Nouvelle conversation">
                                    <RefreshCw size={14} strokeWidth={2} />
                                </button>
                            </>
                        )}
                        <button className="cw-icon-btn" onClick={() => setOpen(false)}>
                            <X size={15} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* ── SESSIONS VIEW ── */}
                {view === 'sessions' && (
                    <div className="cw-sessions">
                        <button className="cw-new-conv-btn" onClick={startNewConversation}>
                            <RefreshCw size={14} />
                            Nouvelle conversation
                        </button>
                        {loadingSessions && <div className="cw-sessions-loading">Chargement…</div>}
                        {!loadingSessions && sessions.length === 0 && (
                            <div className="cw-sessions-empty">Aucune conversation enregistrée.</div>
                        )}
                        {sessions.map(s => (
                            <div
                                key={s.sessionId}
                                className={`cw-session-item ${s.sessionId === sessionId ? 'cw-session-item--active' : ''}`}
                                onClick={() => switchToSession(s.sessionId)}
                            >
                                <div className="cw-session-icon"><Scale size={13} /></div>
                                <div className="cw-session-info">
                                    <div className="cw-session-preview">{s.preview}</div>
                                    <div className="cw-session-meta">
                                        {s.messageCount} message{s.messageCount > 1 ? 's' : ''} ·{' '}
                                        {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                                    </div>
                                </div>
                                <button
                                    className="cw-session-delete"
                                    onClick={e => handleDeleteSession(e, s.sessionId)}
                                    title="Supprimer"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── CHAT VIEW ── */}
                {view === 'chat' && (
                    <>
                        <div className="cw-messages">
                            {messages.length === 0 && !loading && (
                                <div className="cw-empty">
                                    <div className="cw-empty-icon"><Scale size={22} /></div>
                                    <p>Posez votre question ou demandez un rendez-vous.</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`cw-msg-group ${msg.role === 'user' ? 'cw-msg-group--user' : ''}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="cw-msg-avatar"><Scale size={12} /></div>
                                    )}
                                    <div className="cw-msg-content">
                                        <div className={`cw-bubble ${msg.role === 'user' ? 'cw-bubble--user' : 'cw-bubble--bot'}`}>
                                            {msg.content.split('\n').map((line, i) => (
                                                <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
                                            ))}
                                        </div>

                                        {msg.role === 'assistant' && msg.readyToConfirm && !msg.appointmentConfirmed && (
                                            <ConfirmCard
                                                extracted={msg.extractedData}
                                                onConfirm={() => handleSend('Oui, je confirme ce rendez-vous.')}
                                                onModify={() => handleSend('Je voudrais modifier certaines informations.')}
                                            />
                                        )}

                                        {msg.role === 'assistant' && msg.appointmentConfirmed && (
                                            <SuccessCard id={msg.appointmentRequestId} />
                                        )}

                                        {msg.role === 'assistant' && msg.suggestions?.length > 0 && !msg.readyToConfirm && (
                                            <div className="cw-chips">
                                                {msg.suggestions.map((s, i) => (
                                                    <button key={i} className="cw-chip" onClick={() => handleSend(s)}>{s}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="cw-msg-group">
                                    <div className="cw-msg-avatar"><Scale size={12} /></div>
                                    <div className="cw-msg-content">
                                        <div className="cw-bubble cw-bubble--bot cw-typing">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="cw-input-wrap">
                            <div className="cw-input-box">
                                <textarea
                                    ref={inputRef}
                                    className="cw-textarea"
                                    placeholder="Écrivez votre message…"
                                    value={input}
                                    rows={1}
                                    onChange={e => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    disabled={loading}
                                />
                                <button
                                    className={`cw-send ${input.trim() && !loading ? 'cw-send--active' : ''}`}
                                    onClick={() => handleSend()}
                                    disabled={loading || !input.trim()}
                                >
                                    <Send size={15} strokeWidth={2.5} />
                                </button>
                            </div>
                            <div className="cw-footer-note">JurisHub · Cabinet d'avocats · Confidentiel</div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

function ConfirmCard({ extracted, onConfirm, onModify }) {
    if (!extracted) return null;
    const rows = [
        { label: 'Type d\'affaire', value: extracted.type_affaire },
        { label: 'Description', value: extracted.description },
        { label: 'Urgence', value: extracted.urgence },
        { label: 'Date souhaitée', value: extracted.date_preferee },
        { label: 'Heure', value: extracted.heure_preferee },
    ].filter(r => r.value && r.value !== 'null');
    return (
        <div className="cw-confirm">
            <div className="cw-confirm-header"><CheckCircle size={14} />Récapitulatif du rendez-vous</div>
            <div className="cw-confirm-rows">
                {rows.map((r, i) => (
                    <div key={i} className="cw-confirm-row">
                        <span className="cw-confirm-label">{r.label}</span>
                        <span className="cw-confirm-value">{r.value}</span>
                    </div>
                ))}
            </div>
            <div className="cw-confirm-btns">
                <button className="cw-btn-primary" onClick={onConfirm}>Confirmer le RDV</button>
                <button className="cw-btn-ghost" onClick={onModify}>Modifier</button>
            </div>
        </div>
    );
}

function SuccessCard({ id }) {
    return (
        <div className="cw-success">
            <div className="cw-success-icon"><CheckCircle size={18} /></div>
            <div>
                <div className="cw-success-title">Demande envoyée avec succès</div>
                <div className="cw-success-body">
                    Votre demande{id ? ` n°${id}` : ''} a bien été enregistrée. Le cabinet vous contactera pour confirmer.
                </div>
            </div>
        </div>
    );
}
