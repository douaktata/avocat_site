import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { getCases, getTasks, getInvoices, getUsersByRole } from '../api';
import './Statistiques.css';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const TYPE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

const Statistiques = () => {
  const [period, setPeriod]       = useState('month');
  const [loading, setLoading]     = useState(true);
  const [cases, setCases]         = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [invoices, setInvoices]   = useState([]);
  const [clientCount, setClientCount] = useState(0);

  const revenueChartRef     = useRef(null);
  const casesChartRef       = useRef(null);
  const performanceChartRef = useRef(null);
  const categoriesChartRef  = useRef(null);
  const chartInstances      = useRef({});

  useEffect(() => {
    Promise.all([
      getCases().catch(() => ({ data: [] })),
      getTasks().catch(() => ({ data: [] })),
      getInvoices().catch(() => ({ data: [] })),
      getUsersByRole('CLIENT').catch(() => ({ data: [] })),
    ]).then(([casesRes, tasksRes, invoicesRes, clientsRes]) => {
      setCases(casesRes.data);
      setTasks(tasksRes.data);
      setInvoices(invoicesRes.data);
      setClientCount(clientsRes.data.length);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = useMemo(() => new Date(), []);

  const isInPeriod = (dateStr, p) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (p === 'month')   return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (p === 'quarter') return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  };

  const isInPrevPeriod = (dateStr, p) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (p === 'month') {
      const pm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === pm && d.getFullYear() === py;
    }
    if (p === 'quarter') {
      const pq = Math.floor(now.getMonth() / 3) - 1;
      return pq >= 0 && Math.floor(d.getMonth() / 3) === pq && d.getFullYear() === now.getFullYear();
    }
    return d.getFullYear() === now.getFullYear() - 1;
  };

  // ── KPI : revenus depuis les factures ────────────────────────────────────────
  // Revenue = somme de amountPaid sur les factures de la période (issuedDate)
  const revenue = useMemo(
    () => invoices
      .filter(inv => isInPeriod(inv.issuedDate || inv.invoiceDate, period))
      .reduce((s, inv) => s + Number(inv.amountPaid || 0), 0),
    [invoices, period]
  );

  const prevRevenue = useMemo(
    () => invoices
      .filter(inv => isInPrevPeriod(inv.issuedDate || inv.invoiceDate, period))
      .reduce((s, inv) => s + Number(inv.amountPaid || 0), 0),
    [invoices, period]
  );

  const revenueChange = prevRevenue === 0 ? 0 : Math.round(((revenue - prevRevenue) / prevRevenue) * 100);

  const paidInvoices    = useMemo(() => invoices.filter(i => i.status === 'PAID').length,    [invoices]);
  const pendingInvoices = useMemo(() => invoices.filter(i => ['ISSUED', 'PARTIAL'].includes(i.status)).length, [invoices]);
  const totalTTC        = useMemo(() => invoices.reduce((s, i) => s + Number(i.amountTTC || 0), 0), [invoices]);
  const totalPaid       = useMemo(() => invoices.reduce((s, i) => s + Number(i.amountPaid || 0), 0), [invoices]);
  const totalDue        = useMemo(() => invoices.reduce((s, i) => s + Number(i.amountDue || 0), 0), [invoices]);

  // Cases
  const activeCases  = useMemo(() => cases.filter(c => c.status === 'OPEN').length,    [cases]);
  const closedCases  = useMemo(() => cases.filter(c => c.status === 'CLOSED').length,  [cases]);
  const pendingCases = useMemo(() => cases.filter(c => c.status === 'PENDING').length, [cases]);

  // Tasks
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'COMPLETED').length, [tasks]);

  // ── Chart data ───────────────────────────────────────────────────────────────
  // Revenus mensuels = amountPaid groupé par mois (année en cours)
  const monthlyRevenue = useMemo(() => {
    const arr = Array(12).fill(0);
    invoices.forEach(inv => {
      const d = new Date(inv.issuedDate || inv.invoiceDate || inv.createdAt);
      if (d.getFullYear() === now.getFullYear()) {
        arr[d.getMonth()] += Number(inv.amountPaid || 0);
      }
    });
    return arr;
  }, [invoices, now]);

  const categoryData = useMemo(() => {
    const map = {};
    cases.forEach(c => {
      const t = c.case_type || 'Autre';
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([name, count], i) => ({
      name, count, color: TYPE_COLORS[i % TYPE_COLORS.length],
    }));
  }, [cases]);

  const teamData = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.assignedToName) return;
      if (!map[t.assignedToName]) map[t.assignedToName] = { name: t.assignedToName, total: 0, completed: 0 };
      map[t.assignedToName].total++;
      if (t.status === 'COMPLETED') map[t.assignedToName].completed++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [tasks]);

  // ── Graphiques ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    Object.values(chartInstances.current).forEach(c => c && c.destroy());
    chartInstances.current = {};

    if (revenueChartRef.current) {
      const ctx  = revenueChartRef.current.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 400);
      grad.addColorStop(0, 'rgba(59,130,246,0.5)');
      grad.addColorStop(1, 'rgba(59,130,246,0.0)');
      chartInstances.current.revenue = new Chart(ctx, {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: [{
            label: 'Revenus encaissés',
            data: monthlyRevenue,
            borderColor: '#3b82f6', backgroundColor: grad,
            borderWidth: 3, tension: 0.4, fill: true,
            pointRadius: 4, pointHoverRadius: 6,
            pointBackgroundColor: '#3b82f6', pointBorderColor: '#fff', pointBorderWidth: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)', padding: 12,
              callbacks: { label: (c) => `${c.parsed.y.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND` },
            },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => v.toLocaleString() + ' TND', font: { size: 12 } } },
            x: { grid: { display: false }, ticks: { font: { size: 12 } } },
          },
        },
      });
    }

    if (casesChartRef.current) {
      const ctx = casesChartRef.current.getContext('2d');
      chartInstances.current.cases = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['En cours', 'Fermés', 'En attente'],
          datasets: [{ data: [activeCases, closedCases, pendingCases], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'], borderWidth: 0, hoverOffset: 10 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, font: { size: 13, weight: '600' } } },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)', padding: 12,
              callbacks: { label: (c) => { const total = c.dataset.data.reduce((a, b) => a + b, 0); return `${c.label}: ${c.parsed} (${total > 0 ? Math.round((c.parsed / total) * 100) : 0}%)`; } },
            },
          },
        },
      });
    }

    if (performanceChartRef.current && teamData.length > 0) {
      const ctx = performanceChartRef.current.getContext('2d');
      chartInstances.current.performance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: teamData.map(t => t.name),
          datasets: [{ label: 'Tâches', data: teamData.map(t => t.total), backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899'], borderRadius: 8, barThickness: 30 }],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12 } },
          scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 12 } } }, y: { grid: { display: false }, ticks: { font: { size: 12 } } } },
        },
      });
    }

    if (categoriesChartRef.current && categoryData.length > 0) {
      const ctx = categoriesChartRef.current.getContext('2d');
      chartInstances.current.categories = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: categoryData.map(c => c.name),
          datasets: [{ label: 'Dossiers', data: categoryData.map(c => c.count), backgroundColor: categoryData.map(c => c.color), borderRadius: 8, barThickness: 40 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12 } },
          scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 12 } } }, x: { grid: { display: false }, ticks: { font: { size: 12 } } } },
        },
      });
    }

    const instances = chartInstances.current;
    return () => Object.values(instances).forEach(c => c && c.destroy());
  }, [loading, monthlyRevenue, activeCases, closedCases, pendingCases, teamData, categoryData]);

  const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';

  if (loading) return <div className="page-header"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-chart-line"></i> Statistiques & Analytics
          </h1>
          <p className="page-description">Vue d'ensemble des performances du cabinet</p>
        </div>
        <div className="period-selector">
          {[['month', 'Mois'], ['quarter', 'Trimestre'], ['year', 'Année']].map(([val, label]) => (
            <button key={val} className={period === val ? 'active' : ''} onClick={() => setPeriod(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon"><i className="fas fa-money-bill-trend-up"></i></div>
          <div className="kpi-content">
            <h3>{fmt(revenue)}</h3>
            <p>Revenus encaissés</p>
            <div className="kpi-footer">
              <span className={`trend ${revenueChange >= 0 ? 'positive' : 'negative'}`}>
                <i className={`fas fa-arrow-${revenueChange >= 0 ? 'up' : 'down'}`}></i>
                {Math.abs(revenueChange)}%
              </span>
              <span className="kpi-subtitle">vs période précédente</span>
            </div>
          </div>
        </div>

        <div className="kpi-card cases">
          <div className="kpi-icon"><i className="fas fa-file-invoice"></i></div>
          <div className="kpi-content">
            <h3>{invoices.length}</h3>
            <p>Factures totales</p>
            <div className="kpi-footer">
              <span className="success-rate">
                <i className="fas fa-check-circle"></i>
                {paidInvoices} payées · {pendingInvoices} en attente
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card clients">
          <div className="kpi-icon"><i className="fas fa-users"></i></div>
          <div className="kpi-content">
            <h3>{clientCount}</h3>
            <p>Clients</p>
            <div className="kpi-footer">
              <span className="new-clients">
                <i className="fas fa-briefcase"></i>
                {cases.length} dossiers
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card tasks">
          <div className="kpi-icon"><i className="fas fa-hand-holding-usd"></i></div>
          <div className="kpi-content">
            <h3>{fmt(totalPaid)}</h3>
            <p>Total encaissé</p>
            <div className="kpi-footer">
              <div className="mini-progress">
                <div
                  className="mini-progress-bar"
                  style={{ width: `${totalTTC > 0 ? Math.round((totalPaid / totalTTC) * 100) : 0}%` }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{fmt(totalDue)} restant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card large">
          <div className="chart-header">
            <div>
              <h3>Revenus encaissés par mois</h3>
              <p>Basé sur amountPaid des factures — {now.getFullYear()}</p>
            </div>
          </div>
          <div className="chart-body">
            <canvas ref={revenueChartRef}></canvas>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Répartition des Dossiers</h3>
              <p>Par statut</p>
            </div>
          </div>
          <div className="chart-body center">
            <canvas ref={casesChartRef}></canvas>
            <div className="doughnut-center">
              <div className="doughnut-value">{cases.length}</div>
              <div className="doughnut-label">Dossiers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Performance de l'Équipe</h3>
              <p>Tâches traitées par membre</p>
            </div>
          </div>
          <div className="chart-body">
            {teamData.length === 0
              ? <p style={{ padding: '1rem', color: '#94a3b8' }}>Aucune tâche assignée</p>
              : <canvas ref={performanceChartRef}></canvas>
            }
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Dossiers par Catégorie</h3>
              <p>Distribution par type de droit</p>
            </div>
          </div>
          <div className="chart-body">
            {categoryData.length === 0
              ? <p style={{ padding: '1rem', color: '#94a3b8' }}>Aucun dossier</p>
              : <canvas ref={categoriesChartRef}></canvas>
            }
          </div>
        </div>
      </div>

      {/* Team Details */}
      {teamData.length > 0 && (
        <div className="team-section">
          <div className="section-header">
            <h3><i className="fas fa-users-cog"></i> Détails de l'Équipe</h3>
          </div>
          <div className="team-grid">
            {teamData.map((member, index) => (
              <div key={member.name} className="team-member-card">
                <div className="member-avatar">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="member-info">
                  <h4>{member.name}</h4>
                  <div className="member-stats">
                    <div className="stat-item">
                      <i className="fas fa-tasks"></i>
                      <span>{member.total} tâche{member.total !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-check-circle"></i>
                      <span>{member.completed} terminée{member.completed !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="member-badge">
                  {index === 0 && <span className="badge gold"><i className="fas fa-crown"></i></span>}
                  {index === 1 && <span className="badge silver"><i className="fas fa-medal"></i></span>}
                  {index === 2 && <span className="badge bronze"><i className="fas fa-award"></i></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Statistiques;
