import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, AlertTriangle, MapPin, Users, Banknote,
  FolderKanban, CheckCircle, Clock, Landmark, BarChart3, Activity,
  ChevronRight, Filter, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import type { ProjectStatus } from '../types';

const STATUS_COLORS: Record<string, string> = {
  'On Track': '#059669',
  'Delayed': '#D97706',
  'Critical': '#DC2626',
  'Completed': '#2563EB',
  'Under Review': '#7C3AED',
  'Pending Approval': '#8B5CF6',
};

const PIE_COLORS = ['#059669', '#D97706', '#DC2626', '#2563EB', '#7C3AED', '#8B5CF6'];

const formatCurrency = (v: number) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
};

const formatArea = (v: number) => `${v.toFixed(1)} Ha`;

export default function DashboardPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const projects = store.getProjects();
  const states = useMemo(() => [...new Set(projects.map(p => p.state))].sort(), [projects]);
  const districts = useMemo(() => {
    if (!stateFilter) return [];
    return [...new Set(projects.filter(p => p.state === stateFilter).map(p => p.district))].sort();
  }, [projects, stateFilter]);

  const kpis = useMemo(() => store.getKPIs({
    state: stateFilter || undefined,
    district: districtFilter || undefined,
    projectType: typeFilter || undefined,
  }), [store, stateFilter, districtFilter, typeFilter]);

  const filteredProjects = useMemo(() => {
    let p = projects;
    if (stateFilter) p = p.filter(x => x.state === stateFilter);
    if (districtFilter) p = p.filter(x => x.district === districtFilter);
    if (typeFilter) p = p.filter(x => x.projectType === typeFilter);
    return p;
  }, [projects, stateFilter, districtFilter, typeFilter]);

  // Chart data
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProjects]);

  const stateDistribution = useMemo(() => {
    const counts: Record<string, { proposed: number; acquired: number }> = {};
    filteredProjects.forEach(p => {
      if (!counts[p.state]) counts[p.state] = { proposed: 0, acquired: 0 };
      counts[p.state].proposed += p.landProposed;
      counts[p.state].acquired += p.landAcquired;
    });
    return Object.entries(counts)
      .map(([state, v]) => ({ state: state.length > 10 ? state.substring(0, 8) + '..' : state, proposed: parseFloat(v.proposed.toFixed(1)), acquired: parseFloat(v.acquired.toFixed(1)) }))
      .sort((a, b) => b.proposed - a.proposed)
      .slice(0, 10);
  }, [filteredProjects]);

  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      const stage = p.currentStage.length > 15 ? p.currentStage.substring(0, 13) + '..' : p.currentStage;
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [filteredProjects]);

  const recentActivity = useMemo(() =>
    store.getAuditEvents().slice(0, 8), [store]);

  const activeAlerts = useMemo(() =>
    store.getAlerts().filter(a => a.status === 'Active').slice(0, 5), [store]);

  const KPICard = ({ label, value, icon, colorClass, borderClass, accentGradient, suffix, onClick, subtitle }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
    borderClass: string;
    accentGradient: string;
    suffix?: string;
    onClick?: () => void;
    subtitle?: string;
  }) => (
    <button
      onClick={onClick}
      className={`glass-kpi p-4 text-left transition-all duration-200 group relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : 'cursor-default'
      } ${borderClass}`}
    >
      {/* Metric accent top line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient}`} />
      
      <div className="flex items-start justify-between mb-2.5">
        <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center text-white shadow-xs`}>
          {icon}
        </div>
        {onClick && (
          <ArrowUpRight size={14} className="text-surface-400 group-hover:text-primary-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        )}
      </div>
      <p className="text-2xl font-black text-navy tracking-tight">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        {suffix && <span className="text-xs font-semibold text-surface-500 ml-1">{suffix}</span>}
      </p>
      <p className="text-xs text-surface-700 font-semibold mt-0.5">{label}</p>
      {subtitle && <p className="text-[10px] text-surface-400 font-medium mt-0.5 truncate">{subtitle}</p>}
    </button>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-navy tracking-tight flex items-center gap-2">
            <span>{permissions?.canViewNational ? 'National' : permissions?.canViewState ? 'State' : 'District'} Command Center</span>
            <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-700 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">LIVE FEED</span>
          </h1>
          <p className="text-xs text-surface-500 font-medium mt-0.5">
            Real-time land acquisition intelligence & decision metrics • Clearance: <span className="font-semibold text-surface-800">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setDistrictFilter(''); }}
            className="h-8.5 px-3 rounded-xl glass-input text-xs text-surface-700 font-medium">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {stateFilter && districts.length > 0 && (
            <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
              className="h-8.5 px-3 rounded-xl glass-input text-xs text-surface-700 font-medium">
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="h-8.5 px-3 rounded-xl glass-input text-xs text-surface-700 font-medium">
            <option value="">All Types</option>
            {['Highway','Railway','Industrial','Township','Dam/Irrigation','Airport','Defense','Smart City','Solar Park','Other'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Grid (Section 7 Metric Color Identity Specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {/* Total Projects -> Blue */}
        <KPICard
          label="Total Projects"
          value={kpis.totalProjects}
          icon={<FolderKanban size={18} />}
          colorClass="bg-blue-600"
          borderClass="border-blue-200/80 hover:border-blue-300"
          accentGradient="from-blue-600 to-indigo-600"
          subtitle="Registered capital schemes"
          onClick={() => navigate('/projects')}
        />

        {/* On Track -> Emerald */}
        <KPICard
          label="On Track"
          value={kpis.projectsOnTrack}
          icon={<CheckCircle size={18} />}
          colorClass="bg-emerald-600"
          borderClass="border-emerald-200/80 hover:border-emerald-300"
          accentGradient="from-emerald-500 to-teal-500"
          subtitle="Within statutory timeline"
          onClick={() => navigate('/projects?status=On Track')}
        />

        {/* Delayed -> Amber */}
        <KPICard
          label="Delayed"
          value={kpis.delayedProjects}
          icon={<Clock size={18} />}
          colorClass="bg-amber-600"
          borderClass="border-amber-200/80 hover:border-amber-300"
          accentGradient="from-amber-500 to-orange-500"
          subtitle="Target milestone breach"
          onClick={() => navigate('/projects?status=Delayed')}
        />

        {/* Critical -> Coral/Red */}
        <KPICard
          label="Critical"
          value={kpis.criticalProjects}
          icon={<AlertTriangle size={18} />}
          colorClass="bg-rose-600"
          borderClass="border-rose-200/80 hover:border-rose-300"
          accentGradient="from-rose-600 to-red-600"
          subtitle="Immediate scrutiny required"
          onClick={() => navigate('/projects?status=Critical')}
        />

        {/* Land -> Cyan / Teal */}
        <KPICard
          label="Land Proposed"
          value={formatArea(kpis.landProposed)}
          icon={<MapPin size={18} />}
          colorClass="bg-cyan-600"
          borderClass="border-cyan-200/80 hover:border-cyan-300"
          accentGradient="from-cyan-500 to-blue-500"
          subtitle="Total requisition scope"
          onClick={() => navigate('/parcels')}
        />

        {/* Land Acquired -> Teal */}
        <KPICard
          label="Land Acquired"
          value={formatArea(kpis.landAcquired)}
          icon={<MapPin size={18} />}
          colorClass="bg-teal-600"
          borderClass="border-teal-200/80 hover:border-teal-300"
          accentGradient="from-teal-500 to-emerald-500"
          suffix={`(${kpis.acquisitionPercent}%)`}
          subtitle="Possession completed"
          onClick={() => navigate('/parcels')}
        />

        {/* Compensation Assessed -> Violet */}
        <KPICard
          label="Comp. Assessed"
          value={formatCurrency(kpis.compensationAssessed)}
          icon={<Banknote size={18} />}
          colorClass="bg-violet-600"
          borderClass="border-violet-200/80 hover:border-violet-300"
          accentGradient="from-violet-500 to-purple-600"
          subtitle="Under Sec. 26-30 RFCTLARR"
          onClick={() => navigate('/compensation')}
        />

        {/* Compensation Paid -> Emerald */}
        <KPICard
          label="Comp. Disbursed"
          value={formatCurrency(kpis.compensationPaid)}
          icon={<Banknote size={18} />}
          colorClass="bg-emerald-600"
          borderClass="border-emerald-200/80 hover:border-emerald-300"
          accentGradient="from-emerald-600 to-teal-600"
          subtitle="DBT transfers completed"
          onClick={() => navigate('/compensation')}
        />

        {/* Outstanding Compensation -> Rose */}
        <KPICard
          label="Comp. Pending"
          value={formatCurrency(kpis.outstandingCompensation)}
          icon={<Banknote size={18} />}
          colorClass="bg-rose-500"
          borderClass="border-rose-200/80 hover:border-rose-300"
          accentGradient="from-rose-500 to-amber-500"
          subtitle="Awaiting fund allocation"
          onClick={() => navigate('/compensation')}
        />

        {/* Affected Families -> Indigo */}
        <KPICard
          label="Affected Families"
          value={kpis.affectedFamilies}
          icon={<Users size={18} />}
          colorClass="bg-indigo-600"
          borderClass="border-indigo-200/80 hover:border-indigo-300"
          accentGradient="from-indigo-600 to-violet-600"
          subtitle="Verified family records"
          onClick={() => navigate('/families')}
        />

        {/* R&R -> Teal */}
        <KPICard
          label="R&R Completion"
          value={`${kpis.rrCompletion}%`}
          icon={<Users size={18} />}
          colorClass="bg-teal-600"
          borderClass="border-teal-200/80 hover:border-teal-300"
          accentGradient="from-teal-600 to-cyan-600"
          subtitle="Rehabilitation progress"
          onClick={() => navigate('/rr')}
        />

        {/* Pending Approvals -> Amber / Indigo */}
        <KPICard
          label="Pending Approvals"
          value={kpis.pendingApprovals}
          icon={<Landmark size={18} />}
          colorClass="bg-amber-600"
          borderClass="border-amber-200/80 hover:border-amber-300"
          accentGradient="from-amber-600 to-rose-600"
          subtitle="Queue awaiting sign-off"
          onClick={() => navigate('/workflow')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-navy mb-3">Project Status Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Projects']} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Distribution */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-navy mb-3">Land: Proposed vs Acquired by State</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateDistribution} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="state" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} Ha`]} />
                <Bar dataKey="proposed" fill="#93bbfc" name="Proposed" radius={[3, 3, 0, 0]} />
                <Bar dataKey="acquired" fill="#1a45d3" name="Acquired" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Funnel */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-navy mb-3">Projects by Workflow Stage</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageDistribution} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#E8721E" name="Projects" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Activity + Alerts + Approval Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-surface-900">Recent Activity</h3>
            <button onClick={() => navigate('/audit')} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            {recentActivity.map(event => (
              <div key={event.id} className="flex items-start gap-2.5 text-xs">
                <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 shrink-0 mt-0.5">
                  <Activity size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-surface-700 font-medium truncate">{event.action}</p>
                  <p className="text-surface-400 truncate">{event.userName} • {new Date(event.timestamp).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-surface-900">Active Alerts ({kpis.activeAlerts})</h3>
            <button onClick={() => navigate('/alerts')} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div key={alert.id} className={`p-2.5 rounded-lg border text-xs ${
                alert.severity === 'Critical' || alert.severity === 'Urgent' ? 'bg-red-50 border-red-200' :
                alert.severity === 'Warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className={
                    alert.severity === 'Critical' || alert.severity === 'Urgent' ? 'text-red-500' :
                    alert.severity === 'Warning' ? 'text-amber-500' : 'text-blue-500'
                  } />
                  <span className="font-medium text-surface-800 truncate">{alert.title}</span>
                </div>
                <p className="text-surface-500 mt-1 truncate">{alert.reason}</p>
              </div>
            ))}
            {activeAlerts.length === 0 && (
              <p className="text-xs text-surface-400 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>

        {/* Projects Requiring Action */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-surface-900">Projects Requiring Action</h3>
            <button onClick={() => navigate('/workflow')} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Workflow <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {filteredProjects
              .filter(p => ['Submitted', 'Digital Scrutiny', 'Verification', 'District Approval', 'State Approval', 'Central Approval'].includes(p.currentStage))
              .slice(0, 5)
              .map(proj => (
                <button
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="w-full text-left p-2.5 rounded-lg bg-surface-50 hover:bg-surface-100 border border-surface-200 transition-colors"
                >
                  <p className="text-xs font-medium text-surface-800 truncate">{proj.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-surface-500">{proj.state} • {proj.district}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      proj.currentStage.includes('Approval') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>{proj.currentStage}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
