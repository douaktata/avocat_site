import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, X, Mail, Phone, CreditCard,
  Calendar, Eye, ArrowRight, UserX, MapPin,
} from 'lucide-react';
import { getUsersByRole } from '../api';
import './ClientsSecretaire.css';

const API_BASE = 'http://localhost:8081';

export default function ClientsSecretaire() {
  const navigate = useNavigate();
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    getUsersByRole('CLIENT')
      .then(res => setClients(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c => {
    const name = `${c.prenom || ''} ${c.nom || ''}`.toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tel || '').includes(searchTerm)
    );
  });

  const initials = c =>
    `${(c.prenom || '?').charAt(0)}${(c.nom || '?').charAt(0)}`.toUpperCase();

  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  return (
    <div className="cs">

      {/* Header */}
      <div className="cs-header">
        <div>
          <h1 className="cs-title">Clients</h1>
          <p className="cs-sub">Gérez le portefeuille clients du cabinet</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="cs-kpis">
        <div className="cs-kpi cs-kpi-blue">
          <div className="cs-kpi-ic"><Users size={18} /></div>
          <div>
            <div className="cs-kpi-n">{clients.length}</div>
            <div className="cs-kpi-l">Total clients</div>
          </div>
        </div>
        <div className="cs-kpi cs-kpi-green">
          <div className="cs-kpi-ic"><Users size={18} /></div>
          <div>
            <div className="cs-kpi-n">{filtered.length}</div>
            <div className="cs-kpi-l">Résultats affichés</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cs-toolbar">
        <div className="cs-search">
          <Search size={15} className="cs-search-ic" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="cs-clear" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <span className="cs-count">
          {filtered.length} client{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="cs-loading">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="cs-empty">
          <UserX size={40} className="cs-empty-ic" />
          <h3>Aucun client trouvé</h3>
          <p>Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="cs-grid">
          {filtered.map(client => (
            <div key={client.idu} className="cs-card">
              <div className="cs-card-top">
                <div className="cs-avatar">
                  {client.photo_url
                    ? <img src={`${API_BASE}${client.photo_url}`} alt="" />
                    : initials(client)
                  }
                </div>
                <div className="cs-card-id">
                  <div className="cs-name">{client.prenom} {client.nom}</div>
                  <div className="cs-email">{client.email || '—'}</div>
                </div>
              </div>

              <div className="cs-card-info">
                <div className="cs-info-row">
                  <Phone size={13} />
                  <span>{client.tel || '—'}</span>
                </div>
                <div className="cs-info-row">
                  <CreditCard size={13} />
                  <span>{client.CIN || client.cin || '—'}</span>
                </div>
                <div className="cs-info-row">
                  <Calendar size={13} />
                  <span>{fmtDate(client.date_naissance)}</span>
                </div>
              </div>

              <div className="cs-card-actions">
                <button className="cs-btn cs-btn-outline" onClick={() => setSelected(client)}>
                  <Eye size={14} /> Aperçu
                </button>
                <button className="cs-btn cs-btn-primary" onClick={() => navigate(`/secretaire/clients/${client.idu}`)}>
                  <ArrowRight size={14} /> Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <>
          <div className="cs-scrim" onClick={() => setSelected(null)} />
          <div className="cs-modal">
            <div className="cs-modal-head">
              <div className="cs-modal-avatar">
                {selected.photo_url
                  ? <img src={`${API_BASE}${selected.photo_url}`} alt="" />
                  : initials(selected)
                }
              </div>
              <div className="cs-modal-id">
                <h2 className="cs-modal-name">{selected.prenom} {selected.nom}</h2>
                <p className="cs-modal-sub">Client</p>
              </div>
              <button className="cs-modal-close" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="cs-modal-body">
              <div className="cs-modal-grid">
                <div className="cs-minfo">
                  <div className="cs-minfo-ic"><CreditCard size={15} /></div>
                  <div>
                    <label>CIN</label>
                    <p>{selected.CIN || selected.cin || '—'}</p>
                  </div>
                </div>
                <div className="cs-minfo">
                  <div className="cs-minfo-ic"><Phone size={15} /></div>
                  <div>
                    <label>Téléphone</label>
                    <p>{selected.tel || '—'}</p>
                  </div>
                </div>
                <div className="cs-minfo">
                  <div className="cs-minfo-ic"><Mail size={15} /></div>
                  <div>
                    <label>Email</label>
                    <p>{selected.email || '—'}</p>
                  </div>
                </div>
                <div className="cs-minfo">
                  <div className="cs-minfo-ic"><Calendar size={15} /></div>
                  <div>
                    <label>Date de naissance</label>
                    <p>{fmtDate(selected.date_naissance)}</p>
                  </div>
                </div>
                <div className="cs-minfo cs-minfo-full">
                  <div className="cs-minfo-ic"><MapPin size={15} /></div>
                  <div>
                    <label>Adresse</label>
                    <p>{selected.adresse || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="cs-modal-ft">
              <button className="cs-btn-cancel" onClick={() => setSelected(null)}>Fermer</button>
              <button
                className="cs-btn cs-btn-primary"
                onClick={() => navigate(`/secretaire/clients/${selected.idu}`)}
              >
                <ArrowRight size={14} /> Plus de détails
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
