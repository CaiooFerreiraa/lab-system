import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { descolagemApi } from "../../services/api";
import Loader from "../common/Loader";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DescolagemReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await descolagemApi.report();
        setReport(res.data);
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  if (loading) return <Loader />;
  if (!report) return <div className="empty-state">Erro ao carregar relatório.</div>;

  const { summary, byLider, byCoordenador, byEsteira, byBrand, byModel } = report;

  // Formatação para gráficos de volume e status
  const chartDataBrand = (byBrand || []).map(b => ({ name: b.marca, total: b.total, aprovados: b.aprovados, reprovados: b.reprovados }));
  const chartDataLider = (byLider || []).map(l => ({ name: l.lider, aprovados: l.aprovados, reprovados: l.reprovados }));
  const chartDataCoordenador = (byCoordenador || []).map(c => ({ name: c.coordenador, aprovados: c.aprovados, reprovados: c.reprovados }));
  const chartDataEsteira = (byEsteira || []).map(e => ({ name: e.esteira, total: e.total, aprovados: e.aprovados, reprovados: e.reprovados }));
  const chartDataModel = (byModel || []).map(m => ({ name: m.modelo, total: m.total, aprovados: m.aprovados, reprovados: m.reprovados }));

  return (
    <main className="report-page">
      <header className="report-header">
        <div>
          <h1 className="page-title">Relatório de Performance</h1>
          <p className="text-muted">Análise de volumes e status por gestão, esteira, marca e modelo</p>
        </div>
        <Link to="/descolagem" className="btn btn-secondary">
          <span className="material-symbols-outlined">arrow_back</span> Voltar
        </Link>
      </header>

      {/* Summary Cards */}
      <div className="report-summary">
        <div className="summary-card summary-card--primary">
          <div className="summary-card-data">
            <span className="summary-card-number">{summary.total}</span>
            <span className="summary-card-label">Total Laudos</span>
          </div>
        </div>
        <div className="summary-card summary-card--success">
          <div className="summary-card-data">
            <span className="summary-card-number">{summary.aprovados}</span>
            <span className="summary-card-label">Aprovados</span>
          </div>
        </div>
        <div className="summary-card summary-card--danger">
          <div className="summary-card-data">
            <span className="summary-card-number">{summary.reprovados}</span>
            <span className="summary-card-label">Reprovados</span>
          </div>
        </div>
        <div className="summary-card summary-card--info">
          <div className="summary-card-data">
            <span className="summary-card-number">{((summary.aprovados / summary.total) * 100).toFixed(1)}%</span>
            <span className="summary-card-label">Taxa de Aprovação</span>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos de Performance */}
      <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '30px' }}>

        {/* Gráfico por Marca */}
        <div className="chart-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '15px' }}>Volume por Marca</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataBrand}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="aprovados" name="Aprovados" stackId="a" fill="var(--accent-success)" />
              <Bar dataKey="reprovados" name="Reprovados" stackId="a" fill="var(--accent-danger)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico por Modelo */}
        <div className="chart-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '15px' }}>Volume por Modelo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataModel}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="total" name="Total de Laudos" fill="var(--accent-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico por Líder */}
        <div className="chart-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '15px' }}>Status por Líder</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataLider}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="aprovados" stackId="a" fill="var(--accent-success)" />
              <Bar dataKey="reprovados" stackId="a" fill="var(--accent-danger)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico por Coordenador */}
        <div className="chart-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '15px' }}>Status por Coordenador</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataCoordenador}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="aprovados" stackId="a" fill="var(--accent-success)" />
              <Bar dataKey="reprovados" stackId="a" fill="var(--accent-danger)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico por Esteira */}
        <div className="chart-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '15px' }}>Volume por Esteira</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataEsteira}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="aprovados" stackId="a" fill="var(--accent-success)" />
              <Bar dataKey="reprovados" stackId="a" fill="var(--accent-danger)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs para Tabelas Detalhadas */}
      <div className="report-tabs">
        {[
          { key: "overview", label: "Marcas e Modelos", icon: "category" },
          { key: "lider", label: "Gestão (Líder/Coord)", icon: "group" },
          { key: "esteira", label: "Esteiras", icon: "conveyor_belt" },
        ].map(tab => (
          <button key={tab.key}
            className={`report-tab ${activeTab === tab.key ? "report-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}>
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="report-content" style={{ marginTop: '20px' }}>
        {activeTab === "overview" && (
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Marca</th>
                  <th>Total</th>
                  <th>Aprovados</th>
                  <th>Reprovados</th>
                  <th>% Eficiência</th>
                </tr>
              </thead>
              <tbody>
                {byBrand.map((row, i) => (
                  <tr key={i}>
                    <td><strong>{row.marca}</strong></td>
                    <td>{row.total}</td>
                    <td className="text-success">{row.aprovados}</td>
                    <td className="text-danger">{row.reprovados}</td>
                    <td>{((row.aprovados / row.total) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "lider" && (
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Líder / Coordenador</th>
                  <th>Total</th>
                  <th>Aprovados</th>
                  <th>Taxa Aprovação</th>
                </tr>
              </thead>
              <tbody>
                {byLider.map((row, i) => (
                  <tr key={i}>
                    <td><strong>{row.lider}</strong></td>
                    <td>{row.total}</td>
                    <td>{row.aprovados}</td>
                    <td>
                      <div className="mini-bar">
                        <div className="mini-bar-fill" style={{ width: `${row.taxa_aprovacao}%`, background: row.taxa_aprovacao > 80 ? 'var(--accent-success)' : 'var(--accent-primary)' }}></div>
                      </div>
                      {row.taxa_aprovacao}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "esteira" && (
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Esteira</th>
                  <th>Total de Laudos</th>
                  <th>Aprovados</th>
                  <th>Reprovados</th>
                  <th>Taxa</th>
                </tr>
              </thead>
              <tbody>
                {byEsteira.map((row, i) => (
                  <tr key={i}>
                    <td><strong>{row.esteira}</strong></td>
                    <td>{row.total}</td>
                    <td className="text-success">{row.aprovados}</td>
                    <td className="text-danger">{row.reprovados}</td>
                    <td>{((row.aprovados / row.total) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
