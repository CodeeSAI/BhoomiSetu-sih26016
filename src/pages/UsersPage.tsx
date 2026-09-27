import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  UserCog, Shield, Search, Edit3, ToggleLeft, ToggleRight,
  ChevronDown, Users, Building2, Landmark, MapPin, BarChart3
} from 'lucide-react';
import type { User, UserRole } from '../types';
import { ROLE_PERMISSIONS } from '../types';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  'National Administrator': <Shield size={16} />,
  'Central Ministry Officer': <Landmark size={16} />,
  'State Authority': <Building2 size={16} />,
  'District Collector': <Users size={16} />,
  'Land Acquisition Officer': <MapPin size={16} />,
  'Project Implementing Agency': <Building2 size={16} />,
  'Field Verification Officer': <MapPin size={16} />,
  'R&R Officer': <Users size={16} />,
  'Policy Analyst': <BarChart3 size={16} />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  'National Administrator': 'from-rose-500 to-orange-500',
  'Central Ministry Officer': 'from-blue-600 to-indigo-600',
  'State Authority': 'from-emerald-500 to-teal-500',
  'District Collector': 'from-violet-500 to-purple-500',
  'Land Acquisition Officer': 'from-amber-500 to-orange-500',
  'Project Implementing Agency': 'from-cyan-500 to-blue-500',
  'Field Verification Officer': 'from-green-500 to-emerald-500',
  'R&R Officer': 'from-pink-500 to-rose-500',
  'Policy Analyst': 'from-slate-500 to-gray-600',
};

const PERMISSION_LABELS: { key: keyof typeof ROLE_PERMISSIONS['National Administrator']; label: string }[] = [
  { key: 'canViewNational', label: 'View National' },
  { key: 'canViewState', label: 'View State' },
  { key: 'canViewDistrict', label: 'View District' },
  { key: 'canCreateProject', label: 'Create Project' },
  { key: 'canEditProject', label: 'Edit Project' },
  { key: 'canApproveProject', label: 'Approve Project' },
  { key: 'canManageUsers', label: 'Manage Users' },
  { key: 'canVerifyParcel', label: 'Verify Parcel' },
  { key: 'canGeoTag', label: 'Geo-Tag' },
  { key: 'canManageCompensation', label: 'Manage Compensation' },
  { key: 'canManageAwards', label: 'Manage Awards' },
  { key: 'canManagePossession', label: 'Manage Possession' },
  { key: 'canManageRR', label: 'Manage R&R' },
  { key: 'canManageDocuments', label: 'Manage Docs' },
  { key: 'canGenerateReports', label: 'Generate Reports' },
  { key: 'canViewAudit', label: 'View Audit' },
  { key: 'canManageAlerts', label: 'Manage Alerts' },
  { key: 'canExportData', label: 'Export Data' },
  { key: 'canApproveWorkflow', label: 'Approve Workflow' },
  { key: 'canRejectWorkflow', label: 'Reject Workflow' },
];

export default function UsersPage() {
  const store = useStore();
  const { user: currentUser, permissions } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'rbac'>('users');

  const users = store.getUsers();

  const filtered = useMemo(() => {
    let items = [...users];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.state?.toLowerCase().includes(q))
      );
    }
    if (roleFilter) items = items.filter(u => u.role === roleFilter);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search, roleFilter]);

  const roles = useMemo(() => [...new Set(users.map(u => u.role))].sort(), [users]);

  const handleToggleActive = (u: User) => {
    if (!permissions?.canManageUsers) {
      toast.error('You do not have permission to manage users');
      return;
    }
    if (u.id === currentUser?.id) {
      toast.warning('You cannot deactivate your own account');
      return;
    }
    store.updateUser(u.id, { isActive: !u.isActive });
    toast.success(`${u.name} has been ${u.isActive ? 'deactivated' : 'activated'}`);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    store.updateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      department: editingUser.department,
      state: editingUser.state,
      district: editingUser.district,
    });
    toast.success('User profile updated successfully');
    setEditingUser(null);
    setSelectedUser(null);
  };

  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [users]);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <UserCog size={22} className="text-primary-600" />
            Users & Role-Based Access Control
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            {users.length} authenticated personnel across {roles.length} statutory administrative roles
          </p>
        </div>
        <div className="flex gap-1 glass-card p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'users' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-600 hover:text-surface-900'}`}
          >
            Users Directory
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'rbac' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-600 hover:text-surface-900'}`}
          >
            RBAC Matrix
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-kpi border-l-4 border-l-primary-500">
              <p className="text-[10px] uppercase font-bold text-surface-500 tracking-wider">Total Users</p>
              <p className="text-2xl font-bold text-surface-900 font-mono mt-1">{users.length}</p>
            </div>
            <div className="glass-kpi border-l-4 border-l-emerald-500">
              <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Active</p>
              <p className="text-2xl font-bold text-emerald-800 font-mono mt-1">{users.filter(u => u.isActive).length}</p>
            </div>
            <div className="glass-kpi border-l-4 border-l-red-500">
              <p className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Inactive</p>
              <p className="text-2xl font-bold text-red-800 font-mono mt-1">{users.filter(u => !u.isActive).length}</p>
            </div>
            <div className="glass-kpi border-l-4 border-l-violet-500">
              <p className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">Roles</p>
              <p className="text-2xl font-bold text-violet-800 font-mono mt-1">{roles.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-panel p-3.5 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="glass-input w-full h-9 pl-9 pr-3 text-xs"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="glass-input h-9 px-3 text-xs"
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* User Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(u => (
              <div key={u.id} className={`glass-card p-4 transition-all hover:shadow-md hover:border-primary-400/40 ${u.isActive ? '' : 'opacity-70 bg-red-50/20'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROLE_COLORS[u.role] || 'from-surface-400 to-surface-500'} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-surface-900 text-xs truncate">{u.name}</p>
                      {u.id === currentUser?.id && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded-full font-bold">You</span>
                      )}
                    </div>
                    <p className="text-[11px] text-surface-500 truncate mt-0.5">{u.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-100/80 text-surface-700 font-semibold border border-surface-200/50">{u.role}</span>
                    </div>
                    {(u.state || u.district) && (
                      <p className="text-[10px] text-surface-400 mt-1 font-medium">{[u.district, u.state].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${u.isActive ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-red-400'}`} title={u.isActive ? 'Active' : 'Inactive'} />
                    <div className="flex gap-1">
                      {permissions?.canManageUsers && (
                        <>
                          <button
                            onClick={() => setEditingUser({ ...u })}
                            className="p-1 rounded-lg hover:bg-white text-surface-500 hover:text-primary-600 transition-colors"
                            title="Edit user"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1 rounded-lg hover:bg-white transition-colors ${u.isActive ? 'text-emerald-600 hover:text-red-500' : 'text-red-500 hover:text-emerald-600'}`}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {u.department && (
                  <p className="mt-2.5 text-[10px] text-surface-500 border-t border-surface-200/40 pt-2 font-medium">{u.department}</p>
                )}
              </div>
            ))}
          </div>

          {/* Role Distribution */}
          <div className="glass-panel p-5">
            <h3 className="font-bold text-surface-900 text-xs mb-3 uppercase tracking-wider">Role Distribution</h3>
            <div className="space-y-2.5">
              {roleDistribution.map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${ROLE_COLORS[role as UserRole] || 'from-surface-400 to-surface-500'} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    {ROLE_ICONS[role as UserRole]}
                  </div>
                  <span className="text-xs font-semibold text-surface-800 flex-1 truncate">{role}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-28 h-2 bg-surface-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${(count / users.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-surface-700 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* RBAC Matrix */
        <div className="glass-table-container">
          <div className="p-4 border-b border-surface-200/50 bg-white/40">
            <h3 className="font-bold text-sm text-surface-900">Statutory RBAC Authorization Matrix</h3>
            <p className="text-xs text-surface-500 mt-0.5">Permission boundaries strictly enforced based on authenticated role credentials</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="glass-table-header">
                  <th className="text-left px-4 py-3 font-bold text-surface-700 min-w-[180px] sticky left-0 glass-table-header">Statutory Action</th>
                  {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => (
                    <th key={role} className="px-3 py-3 font-bold text-surface-700 text-center min-w-[90px]">
                      <div className={`w-6 h-6 mx-auto rounded-lg bg-gradient-to-br ${ROLE_COLORS[role]} flex items-center justify-center text-white mb-1 shadow-sm`}>
                        {ROLE_ICONS[role]}
                      </div>
                      <span className="block leading-tight text-[10px]">{role.split(' ').slice(0, 2).join('\n')}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/50">
                {PERMISSION_LABELS.map(({ key, label }) => (
                  <tr key={key} className="hover:bg-white/60 transition-colors">
                    <td className="px-4 py-2.5 text-surface-800 font-semibold sticky left-0 bg-white/95">{label}</td>
                    {(Object.entries(ROLE_PERMISSIONS) as [UserRole, typeof ROLE_PERMISSIONS['National Administrator']][]).map(([role, perms]) => (
                      <td key={role} className="px-3 py-2.5 text-center">
                        {typeof perms[key] === 'boolean' ? (
                          perms[key] ? (
                            <span className="inline-block w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-sm" title="Permitted" />
                          ) : (
                            <span className="inline-block w-3.5 h-3.5 bg-red-200 rounded-full" title="Denied" />
                          )
                        ) : (
                          <span className="font-mono font-bold text-primary-700">{String(perms[key])}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3.5 bg-white/40 border-t border-surface-200/50 flex items-center gap-4 text-xs text-surface-600 font-medium">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-full inline-block" /> Permitted</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-200 rounded-full inline-block" /> Denied</div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-modal w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-surface-900 mb-4">Edit User Profile</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Name</label>
                <input
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="glass-input w-full h-9 px-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Email</label>
                <input
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="glass-input w-full h-9 px-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Department</label>
                <input
                  value={editingUser.department || ''}
                  onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="glass-input w-full h-9 px-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">State</label>
                  <input
                    value={editingUser.state || ''}
                    onChange={e => setEditingUser({ ...editingUser, state: e.target.value })}
                    className="glass-input w-full h-9 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">District</label>
                  <input
                    value={editingUser.district || ''}
                    onChange={e => setEditingUser({ ...editingUser, district: e.target.value })}
                    className="glass-input w-full h-9 px-3 text-xs"
                  />
                </div>
              </div>
              <div className="glass-card bg-amber-50/70 rounded-xl p-3 text-xs text-amber-900 border border-amber-200/60 font-medium">
                <strong>Statutory Restriction:</strong> Role changes require administrator authorization in accordance with national security credentials.
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2 glass-button-secondary text-surface-700 text-xs font-semibold rounded-xl">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="flex-1 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
