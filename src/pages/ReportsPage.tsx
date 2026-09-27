import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { FileBarChart, Download, Printer, Filter } from 'lucide-react';

const formatCurrency = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)} L` : `₹${v.toLocaleString('en-IN')}`;

const REPORT_TYPES = [
  'Project Progress Report', 'State Acquisition Report', 'Compensation Report',
  'Possession Report', 'R&R Report', 'Delay & Risk Report', 'Executive Summary'
];

export default function ReportsPage() {
  const store = useStore();
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [stateFilter, setStateFilter] = useState('');
  const [generated, setGenerated] = useState(false);

  const projects = store.getProjects();
  const kpis = store.getKPIs({ state: stateFilter || undefined });
  const states = useMemo(() => [...new Set(projects.map(p => p.state))].sort(), [projects]);
  const filteredProjects = useMemo(() => stateFilter ? projects.filter(p => p.state === stateFilter) : projects, [projects, stateFilter]);

  const handleGenerate = () => setGenerated(true);

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'State', 'District', 'Type', 'Land Proposed', 'Land Acquired', 'Status', 'Stage', 'Risk'];
    const rows = filteredProjects.map(p => [p.id, p.name, p.state, p.district, p.projectType, p.landProposed, p.landAcquired, p.status, p.currentStage, p.riskLevel]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `bhoomisetu_${reportType.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <FileBarChart size={22} className="text-primary-600" />
            MIS Statutory Reports & Executive Summaries
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Dynamic parliamentary, state assembly, and district compliance report generation
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <select value={reportType} onChange={e => { setReportType(e.target.value); setGenerated(false); }} className="h-9 px-3 rounded-xl glass-input text-xs">
          {REPORT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="h-9 px-3 rounded-xl glass-input text-xs">
          <option value="">All States</option>{states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleGenerate} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-sm inline-flex items-center gap-2 transition-colors"><FileBarChart size={16} /> Generate</button>
        {generated && <>
          <button onClick={handleExportCSV} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 shadow-sm inline-flex items-center gap-2 transition-colors"><Download size={16} /> Export CSV</button>
          <button onClick={handlePrint} className="px-4 py-2 glass-button-secondary text-sm font-semibold rounded-xl inline-flex items-center gap-2"><Printer size={16} /> Print</button>
        </>}
      </div>

      {generated && (
        <div className="glass-panel p-6 print:shadow-none print:border-none" id="report-content">
          <div className="text-center mb-6 print:mb-4">
            <h2 className="text-lg font-bold text-surface-900">{reportType}</h2>
            <p className="text-sm text-surface-600 font-medium mt-0.5">{stateFilter || 'National'} • Generated: {new Date().toLocaleDateString('en-IN')}</p>
            <p className="text-xs text-amber-700 font-medium mt-1">Demonstration Environment • Synthetic Data</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 glass-card rounded-xl"><p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Total Projects</p><p className="text-xl font-bold mt-1 text-surface-900">{kpis.totalProjects}</p></div>
            <div className="text-center p-3 glass-card rounded-xl"><p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Land Acquired</p><p className="text-xl font-bold mt-1 text-primary-600">{kpis.acquisitionPercent}%</p></div>
            <div className="text-center p-3 glass-card rounded-xl"><p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Compensation Paid</p><p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(kpis.compensationPaid)}</p></div>
            <div className="text-center p-3 glass-card rounded-xl"><p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">R&R Completion</p><p className="text-xl font-bold mt-1 text-violet-600">{kpis.rrCompletion}%</p></div>
          </div>
          <h3 className="text-sm font-semibold text-surface-900 mb-3">Project Details</h3>
          <div className="glass-table-container">
            <table className="w-full text-xs">
              <thead><tr className="glass-table-header">
                {['ID','Name','State','District','Type','Proposed (Ha)','Acquired (Ha)','Status','Stage'].map(h => <th key={h} className="px-3 py-2.5 text-left font-semibold text-surface-700 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredProjects.slice(0, 30).map(p => (
                  <tr key={p.id} className="border-b border-surface-200/50 hover:bg-primary-500/5 transition-colors">
                    <td className="px-3 py-2 font-mono font-medium text-surface-600">{p.id}</td>
                    <td className="px-3 py-2 font-semibold text-surface-900">{p.name}</td>
                    <td className="px-3 py-2 text-surface-700">{p.state}</td>
                    <td className="px-3 py-2 text-surface-700">{p.district}</td>
                    <td className="px-3 py-2 text-surface-700">{p.projectType}</td>
                    <td className="px-3 py-2 font-medium text-surface-800">{p.landProposed.toFixed(1)}</td>
                    <td className="px-3 py-2 font-medium text-surface-800">{p.landAcquired.toFixed(1)}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      p.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Delayed' ? 'bg-amber-100 text-amber-800' : p.status === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-surface-100 text-surface-600'
                    }`}>{p.status}</span></td>
                    <td className="px-3 py-2 text-surface-600 truncate max-w-[120px] font-medium">{p.currentStage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!generated && (
        <div className="glass-panel p-16 text-center">
          <FileBarChart size={48} className="mx-auto text-primary-400 mb-4 opacity-75" />
          <h3 className="text-lg font-bold text-surface-800">Select report type and click Generate</h3>
          <p className="text-sm text-surface-500 mt-1.5 font-medium">Reports are generated dynamically from live application data</p>
        </div>
      )}
    </div>
  );
}
