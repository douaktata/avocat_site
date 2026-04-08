import React, { useEffect, useState } from 'react';
import API from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/users'),
      API.get('/cases'),
      API.get('/appointments'),
      API.get('/payments'),
    ]).then(([u, c, a, p]) => {
      setStats({
        users: u.data.length,
        cases: c.data.length,
        appointments: a.data.length,
        payments: p.data.length,
        totalCa: p.data.reduce((s, x) => s + Number(x.amount || 0), 0),
      });
    });
  }, []);

  if (!stats) return <div style={{padding: '4rem', textAlign: 'center'}}>Chargement...</div>;

  const kpis = [
    { label: 'Utilisateurs', value: stats.users, icon: 'fa-users', color: '#2563eb' },
    { label: 'Dossiers', value: stats.cases, icon: 'fa-folder-open', color: '#10b981' },
    { label: 'Rendez-vous', value: stats.appointments, icon: 'fa-calendar-check', color: '#f59e0b' },
    { label: 'Chiffre d\'affaires', value: `${Number(stats.totalCa).toLocaleString('fr-FR', {minimumFractionDigits: 3})} TND`, icon: 'fa-euro-sign', color: '#8b5cf6' },
  ];

  return (
    <div>
      <h1 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b'}}>Tableau de bord administrateur</h1>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
        {kpis.map(k => (
          <div key={k.label} style={{background: 'white', borderRadius: 12, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'}}>
            <div style={{width: 48, height: 48, borderRadius: 10, background: k.color+'15', color: k.color, display: 'grid', placeItems: 'center'}}>
              <i className={`fas ${k.icon}`}></i>
            </div>
            <div>
              <div style={{fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600}}>{k.label}</div>
              <div style={{fontSize: '1.4rem', fontWeight: 700, color: '#1e293b'}}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
