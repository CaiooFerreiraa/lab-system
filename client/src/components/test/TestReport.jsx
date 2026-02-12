import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { testApi } from "../../services/api";
import Loader from "../common/Loader";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function TestReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("charts");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await testApi.report();
        setReport(res.data);
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;
  if (!report) return <div className="empty-state"><span className="empty-icon material-symbols-outlined">error</span>Erro ao carregar relatório</div>;

  const { summary, byModel, bySector, byType, byBrand, recent } = report;
  const approvalRate = summary.total > 0
    ? ((summary.aprovados / Math.max(summary.aprovados + summary.reprovados, 1)) * 100).toFixed(1)
    : 0;

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const statusTag = (rate) => {
    if (rate == null) return { className: "tag--muted", label: "—" };
    if (rate >= 80) return { className: "tag--success", label: "✓ Bom" };
    if (rate >= 50) return { className: "tag--info", label: "⚠ Atenção" };
    return { className: "tag--danger", label: "✗ Crítico" };
  };

  return (
    <main className="report-page">
      <header className="report-header">
        <div>
          <h1 className="page-title">Relatório de Testes</h1>
          <p className="text-muted">Análise completa para tomada de decisão</p>
        </div>
        <Link to="/test" className="btn btn-secondary">
          <span className="material-symbols-outlined">arrow_back</span>
          Voltar
        </Link>
      </header>

      {/* Summary Cards */}
      <div className="report-summary">
        <div className="summary-card summary-card--primary">
          <span className="material-symbols-outlined summary-card-icon">science</span>
          <div className="summary-card-data">
            <span className="summary-card-number">{summary.total}</span>
            <span className="summary-card-label">Total de Testes</span>
          </div>
        </div>
        <div className="summary-card summary-card--success">
          <span className="material-symbols-outlined summary-card-icon">check_circle</span>
          <div className="summary-card-data">
            <span className="summary-card-number">{summary.aprovados}</span>
            <span className="summary-card-label">Aprovados</span>
          </div>
        </div>
        <div className="summary-card summary-card--danger">
          <span className="material-symbols-outlined summary-card-icon">cancel</span>
          <div className="summary-card-data">
            <span className="summary-card-number">{summary.reprovados}</span>
            <span className="summary-card-label">Reprovados</span>
          </div>
        </div>
        <div className="summary-card summary-card--warning">
          <span className="material-symbols-outlined summary-card-icon">pending</span>
          <div className="summary-card-data">
            <span className="summary-card-number">{summary.pendentes}</span>
            <span className="summary-card-label">Pendentes</span>
          </div>
        </div>
        <div className="summary-card summary-card--rate">
          <span className="material-symbols-outlined summary-card-icon">speed</span>
          <div className="summary-card-data">
            <span className="summary-card-number">{approvalRate}%</span>
            <span className="summary-card-label">Taxa de Aprovação</span>
          </div>
          <div className="approval-bar">
            <div className="approval-bar-fill" style={{ width: `${approvalRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        {[
          { key: "charts", label: "Gráficos", icon: "bar_chart" },
          { key: "brand", label: "Por Marca", icon: "label" },
          { key: "overview", label: "Por Modelo", icon: "category" },
          { key: "sector", label: "Por Setor", icon: "factory" },
          { key: "type", label: "Por Tipo de Teste", icon: "biotech" },
          { key: "recent", label: "Testes Recentes", icon: "history" },
        ].map((tab) => (
          <button key={tab.key}
            className={`report-tab ${activeTab === tab.key ? "report-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}>
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Gráficos */}
      {activeTab === "charts" && (
        <div className="report-section" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '30px' }}>

            {/* Status Distribution */}
            <div className="chart-card" style={{
              background: 'var(--bg-card)',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }}></div>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '24px' }}>donut_large</span>
                Distribuição por Status
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Aprovados', value: summary.aprovados },
                      { name: 'Reprovados', value: summary.reprovados },
                      { name: 'Pendentes', value: summary.pendentes }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                    stroke="none"
                  >
                    <Cell fill="hsl(145, 65%, 45%)" />
                    <Cell fill="hsl(0, 75%, 55%)" />
                    <Cell fill="hsl(215, 80%, 55%)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(22, 25, 35, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      padding: '12px 16px'
                    }}
                    itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance by Brand */}
            <div className="chart-card" style={{
              background: 'var(--bg-card)',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }}></div>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '24px' }}>brand_family</span>
                Performance por Marca
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={(byBrand || []).slice(0, 6)} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="marca"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      background: 'rgba(22, 25, 35, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="aprovados" name="Aprovados" stackId="a" fill="hsl(145, 65%, 45%)" radius={[0, 0, 0, 0]} barSize={32} />
                  <Bar dataKey="reprovados" name="Reprovados" stackId="a" fill="hsl(0, 75%, 55%)" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Volume by Sector */}
            <div className="chart-card" style={{
              background: 'var(--bg-card)',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }}></div>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '24px' }}>factory</span>
                Volume por Setor (Top 5)
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={(bySector || []).slice(0, 5)} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="setor"
                    type="category"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fill: 'var(--text-primary)', fontWeight: '500' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      background: 'rgba(22, 25, 35, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="total" name="Total de Testes" fill="var(--accent-primary)" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Models */}
            <div className="chart-card" style={{
              background: 'var(--bg-card)',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ec4899' }}></div>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#ec4899', fontSize: '24px' }}>category</span>
                Modelos Mais Testados
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={(byModel || []).slice(0, 5)} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="modelo"
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      background: 'rgba(22, 25, 35, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="total" name="Testes Realizados" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} barSize={40} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {activeTab === "brand" && (
        <div className="report-section">
          <h2>Desempenho por Marca</h2>
          <div className="report-cards-grid">
            {(byBrand || []).map((row, i) => {
              const tag = statusTag(row.taxa_aprovacao);
              return (
                <div key={i} className="report-stat-card">
                  <div className="report-stat-header">
                    <h3>{row.marca}</h3>
                    <span className={`tag ${tag.className}`}>{row.taxa_aprovacao ?? "—"}%</span>
                  </div>
                  <div className="report-stat-numbers">
                    <div className="report-stat-item">
                      <span className="report-stat-value">{row.total}</span>
                      <span className="report-stat-label">Total</span>
                    </div>
                    <div className="report-stat-item report-stat-item--success">
                      <span className="report-stat-value">{row.aprovados}</span>
                      <span className="report-stat-label">Aprovados</span>
                    </div>
                    <div className="report-stat-item report-stat-item--danger">
                      <span className="report-stat-value">{row.reprovados}</span>
                      <span className="report-stat-label">Reprovados</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <span className="text-muted" style={{ fontSize: "0.78rem" }}>{row.modelos} modelo(s)</span>
                    <span className={`tag ${tag.className}`}>{tag.label}</span>
                  </div>
                  <div className="approval-bar" style={{ marginTop: 8 }}>
                    <div className="approval-bar-fill" style={{
                      width: `${row.taxa_aprovacao || 0}%`,
                      background: row.taxa_aprovacao >= 80 ? "var(--accent-success)" : row.taxa_aprovacao >= 50 ? "hsl(45, 80%, 50%)" : "var(--accent-danger)"
                    }}></div>
                  </div>
                </div>
              );
            })}
            {(!byBrand || byBrand.length === 0) && <p className="text-muted">Nenhum dado disponível</p>}
          </div>
        </div>
      )}

      {/* Tab: Por Modelo */}
      {activeTab === "overview" && (
        <div className="report-section">
          <h2>Desempenho por Modelo</h2>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Marca</th>
                  <th>Tipo</th>
                  <th>Total</th>
                  <th>Aprovados</th>
                  <th>Reprovados</th>
                  <th>Taxa</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {byModel.map((row, i) => {
                  const rate = row.taxa_aprovacao;
                  const tag = statusTag(rate);
                  return (
                    <tr key={i}>
                      <td><strong>{row.modelo}</strong></td>
                      <td>{row.marca}</td>
                      <td><span className="tag tag--muted">{row.tipo_modelo}</span></td>
                      <td>{row.total}</td>
                      <td className="text-success">{row.aprovados}</td>
                      <td className="text-danger">{row.reprovados}</td>
                      <td>
                        <div className="mini-bar">
                          <div className="mini-bar-fill" style={{
                            width: `${rate || 0}%`,
                            background: rate >= 80 ? "var(--accent-success)" : rate >= 50 ? "hsl(45, 80%, 50%)" : "var(--accent-danger)"
                          }}></div>
                        </div>
                        <span className="mini-bar-label">{rate ?? "—"}%</span>
                      </td>
                      <td><span className={`tag ${tag.className}`}>{tag.label}</span></td>
                    </tr>
                  );
                })}
                {byModel.length === 0 && (
                  <tr><td colSpan={8} className="text-muted" style={{ textAlign: "center", padding: 24 }}>Nenhum dado disponível</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Por Setor */}
      {activeTab === "sector" && (
        <div className="report-section">
          <h2>Desempenho por Setor</h2>
          <div className="report-cards-grid">
            {(bySector || []).map((row, i) => {
              const rate = row.taxa_aprovacao;
              return (
                <div key={i} className="report-stat-card">
                  <div className="report-stat-header">
                    <h3>{row.setor}</h3>
                    <span className={`tag ${statusTag(rate).className}`}>{rate ?? "—"}%</span>
                  </div>
                  <div className="report-stat-numbers">
                    <div className="report-stat-item">
                      <span className="report-stat-value">{row.total}</span>
                      <span className="report-stat-label">Total</span>
                    </div>
                    <div className="report-stat-item report-stat-item--success">
                      <span className="report-stat-value">{row.aprovados}</span>
                      <span className="report-stat-label">Aprovados</span>
                    </div>
                    <div className="report-stat-item report-stat-item--danger">
                      <span className="report-stat-value">{row.reprovados}</span>
                      <span className="report-stat-label">Reprovados</span>
                    </div>
                  </div>
                  <div className="approval-bar" style={{ marginTop: 12 }}>
                    <div className="approval-bar-fill" style={{
                      width: `${rate || 0}%`,
                      background: rate >= 80 ? "var(--accent-success)" : rate >= 50 ? "hsl(45, 80%, 50%)" : "var(--accent-danger)"
                    }}></div>
                  </div>
                </div>
              );
            })}
            {bySector.length === 0 && <p className="text-muted">Nenhum dado disponível</p>}
          </div>
        </div>
      )}

      {/* Tab: Por Tipo de Teste */}
      {activeTab === "type" && (
        <div className="report-section">
          <h2>Desempenho por Tipo de Teste</h2>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tipo de Teste</th>
                  <th>Total</th>
                  <th>Aprovados</th>
                  <th>Reprovados</th>
                  <th>Média Resultado</th>
                  <th>Taxa Aprovação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(byType || []).map((row, i) => {
                  const rate = row.taxa_aprovacao;
                  const tag = statusTag(rate);
                  return (
                    <tr key={i}>
                      <td><strong>{row.tipo}</strong></td>
                      <td>{row.total}</td>
                      <td className="text-success">{row.aprovados}</td>
                      <td className="text-danger">{row.reprovados}</td>
                      <td>{row.media_resultado ?? "—"}</td>
                      <td>{rate ?? "—"}%</td>
                      <td><span className={`tag ${tag.className}`}>{tag.label}</span></td>
                    </tr>
                  );
                })}
                {byType.length === 0 && (
                  <tr><td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: 24 }}>Nenhum dado disponível</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Testes Recentes */}
      {activeTab === "recent" && (
        <div className="report-section">
          <h2>Últimos 50 Testes</h2>
          <div className="report-table-wrapper">
            <table className="report-table report-table--compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Modelo</th>
                  <th>Material</th>
                  <th>Resultado</th>
                  <th>Spec</th>
                  <th>Status</th>
                  <th>Funcionário</th>
                </tr>
              </thead>
              <tbody>
                {(recent || []).map((t, i) => {
                  const specMin = t.spec_valor != null ? (parseFloat(t.spec_valor) - parseFloat(t.spec_variacao)).toFixed(1) : null;
                  const specMax = t.spec_valor != null ? (parseFloat(t.spec_valor) + parseFloat(t.spec_variacao)).toFixed(1) : null;
                  return (
                    <tr key={i}>
                      <td className="text-muted">{t.cod_teste}</td>
                      <td className="text-muted">{formatDate(t.data_inicio)}</td>
                      <td>{t.tipo_teste}</td>
                      <td><strong>{t.modelo}</strong></td>
                      <td>{t.material}</td>
                      <td><strong>{t.resultado}</strong></td>
                      <td className="text-muted">{specMin != null ? `${specMin} ~ ${specMax}` : "—"}</td>
                      <td>
                        <span className={`tag ${t.status === "Aprovado" ? "tag--success" :
                          t.status === "Reprovado" ? "tag--danger" :
                            "tag--muted"
                          }`}>{t.status}</span>
                      </td>
                      <td className="text-muted">{t.funcionario}</td>
                    </tr>
                  );
                })}
                {recent.length === 0 && (
                  <tr><td colSpan={9} className="text-muted" style={{ textAlign: "center", padding: 24 }}>Nenhum teste registrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
