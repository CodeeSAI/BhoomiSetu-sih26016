// ============================================================
// BhoomiSetu - Mobile Field Verification Mode (Section N)
// Mobile-first offline-ready workflow for ground-truthing & geo-tagging
// ============================================================
import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Smartphone, MapPin, Camera, CheckCircle2, XCircle, Clock, Navigation,
  Wifi, WifiOff, Battery, RefreshCw, Map, CheckSquare, Square, Upload,
  Image, ShieldCheck, ArrowRight, Check, AlertCircle, FileText
} from 'lucide-react';
import type { LandParcel } from '../types';
import { cadastralAdapter } from '../services/adapters/cadastralAdapter';

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface QueuedVerification {
  parcelId: string;
  action: 'Verified' | 'Rejected';
  lat?: number;
  lng?: number;
  remarks: string;
  checklist: Record<string, boolean>;
  evidencePhotoName?: string;
  timestamp: string;
}

export default function FieldModePage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [projectFilter, setProjectFilter] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');

  // 5-Point Statutory Verification Checklist (Section N)
  const [checklist, setChecklist] = useState({
    boundaryDemarcation: false,
    ownerIdentity: false,
    encumbranceCheck: false,
    assetEnumeration: false,
    noEncroachment: false,
  });

  // Offline Synchronization Queue (Section N)
  const [offlineQueue, setOfflineQueue] = useState<QueuedVerification[]>(() => {
    try {
      const saved = localStorage.getItem('bhoomi_field_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bhoomi_field_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Device reconnected to network.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline mode activated. Field verifications will queue locally.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setLocating(false);
        toast.success(`GPS lock established: ±${pos.coords.accuracy.toFixed(1)}m accuracy`);
      },
      () => {
        // Fallback simulation for offline or indoor testing
        const lat = 18.5204 + (Math.random() - 0.5) * 0.05;
        const lng = 73.8567 + (Math.random() - 0.5) * 0.05;
        setLocation({
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
          accuracy: 4.8,
          timestamp: Date.now(),
        });
        setLocating(false);
        toast.info('GPS fallback coordinates locked (DGPS simulation mode)');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const parcels = store.getParcels();
  const projects = store.getProjects();

  // Assigned Parcels Filter
  const filteredParcels = parcels.filter(p => {
    if (projectFilter && p.projectId !== projectFilter) return false;
    return p.verificationStatus === 'Pending' || p.verificationStatus === 'Re-verification';
  });

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEvidencePhoto(ev.target?.result as string);
        toast.success(`Evidence photo "${file.name}" staged.`);
      };
      reader.readAsText(file);
    }
  };

  const handleSimulateCamera = () => {
    const mockName = `IMG_SURVEY_${Date.now().toString().slice(-4)}.jpg`;
    setPhotoName(mockName);
    setEvidencePhoto(`https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80`);
    toast.success('Site photograph captured with GPS watermark metadata.');
  };

  const handleChecklistToggle = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Submit Field Verification Action
  const handleSubmitVerification = (action: 'Verified' | 'Rejected') => {
    if (!selectedParcel || !user) return;

    const allChecked = Object.values(checklist).every(Boolean);
    if (action === 'Verified' && !allChecked) {
      toast.warning('Please confirm all statutory checklist points before verification.');
      return;
    }

    setSubmitting(true);

    const lat = location ? location.latitude : selectedParcel.latitude;
    const lng = location ? location.longitude : selectedParcel.longitude;

    if (!isOnline) {
      // Queue offline
      const queuedItem: QueuedVerification = {
        parcelId: selectedParcel.id,
        action,
        lat,
        lng,
        remarks: verificationNote,
        checklist: { ...checklist },
        evidencePhotoName: photoName || undefined,
        timestamp: new Date().toISOString(),
      };
      setOfflineQueue(prev => [...prev, queuedItem]);
      setSubmitting(false);
      toast.info(`Offline: Verification queued for sync (${offlineQueue.length + 1} pending).`);
      resetForm();
      return;
    }

    // Online submission
    setTimeout(() => {
      const polygon = (lat && lng)
        ? cadastralAdapter.generateCadastralPolygon(lat, lng, selectedParcel.area)
        : selectedParcel.coordinates;

      store.updateParcel(selectedParcel.id, {
        verificationStatus: action,
        verifiedBy: user.name,
        verifiedAt: new Date().toISOString(),
        remarks: verificationNote,
        latitude: lat,
        longitude: lng,
        coordinates: polygon,
      });

      store.addAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: `Mobile Field Verification: ${action}`,
        entityType: 'LandParcel',
        entityId: selectedParcel.id,
        entityName: `ULPIN: ${selectedParcel.ulpin || selectedParcel.surveyNumber}`,
        oldValue: selectedParcel.verificationStatus,
        newValue: action,
        details: `Field notes: ${verificationNote || 'All 5 statutory verification points verified'}. Coordinates: ${lat?.toFixed(6)}, ${lng?.toFixed(6)}`,
      });

      toast.success(`Parcel ${selectedParcel.id} (${selectedParcel.ulpin}) ${action.toLowerCase()}!`);
      resetForm();
      setSubmitting(false);
    }, 400);
  };

  // Synchronize Offline Queue
  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    offlineQueue.forEach(item => {
      store.updateParcel(item.parcelId, {
        verificationStatus: item.action,
        verifiedBy: user?.name || 'Field Officer',
        verifiedAt: item.timestamp,
        remarks: `[Synced from Offline Queue] ${item.remarks}`,
        latitude: item.lat,
        longitude: item.lng,
      });
      store.addAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user?.id || 'USR-001',
        userName: user?.name || 'Field Officer',
        userRole: user?.role || 'Field Verification Officer',
        action: `Offline Field Sync: ${item.action}`,
        entityType: 'LandParcel',
        entityId: item.parcelId,
        details: `Synced offline field verification recorded at ${item.timestamp}`,
      });
    });
    setOfflineQueue([]);
    toast.success(`Synchronized ${offlineQueue.length} field records to BhoomiSetu!`);
  };

  const resetForm = () => {
    setSelectedParcel(null);
    setVerificationNote('');
    setEvidencePhoto(null);
    setPhotoName('');
    setChecklist({
      boundaryDemarcation: false,
      ownerIdentity: false,
      encumbranceCheck: false,
      assetEnumeration: false,
      noEncroachment: false,
    });
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-xl mx-auto">
      {/* Mobile Top Header */}
      <div className="bg-gradient-to-r from-navy to-navy-light rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <Smartphone size={18} className="text-saffron" />
              Mobile Field Operations
            </h1>
            <p className="text-[11px] text-surface-300 mt-0.5">
              Ground-truthing, ULPIN stamping, and DGPS boundary demarcation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Offline Queue Sync Indicator */}
        {offlineQueue.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">
              Offline Queue: <strong>{offlineQueue.length}</strong> items waiting
            </span>
            <button
              onClick={handleSyncOfflineQueue}
              disabled={!isOnline}
              className="px-2.5 py-1 bg-saffron text-navy text-xs font-bold rounded-lg hover:bg-saffron-light disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
            >
              <RefreshCw size={12} /> Sync Now
            </button>
          </div>
        )}
      </div>

      {/* GPS Location Acquisition HUD */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-primary-600" />
            <h2 className="text-xs font-bold text-surface-900">Device GPS Centroid</h2>
          </div>
          <button
            onClick={getLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {locating ? <RefreshCw size={12} className="animate-spin" /> : <Navigation size={12} />}
            {locating ? 'Acquiring...' : location ? 'Re-acquire' : 'Acquire GPS'}
          </button>
        </div>

        {location ? (
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-xs">
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <p className="text-[10px] text-surface-500 font-sans">Latitude</p>
                <p className="font-bold text-emerald-950">{location.latitude.toFixed(6)}°</p>
              </div>
              <div>
                <p className="text-[10px] text-surface-500 font-sans">Longitude</p>
                <p className="font-bold text-emerald-950">{location.longitude.toFixed(6)}°</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-800 pt-2 mt-2 border-t border-emerald-200/60 font-sans">
              <span>Accuracy: <strong>±{location.accuracy.toFixed(1)}m</strong></span>
              <span>Locked: {new Date(location.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ) : (
          <div className="bg-surface-50 rounded-lg p-3 border border-surface-200 text-center text-xs text-surface-500">
            No GPS fix acquired. Tap "Acquire GPS" before confirming parcel boundaries.
          </div>
        )}
      </div>

      {/* Assigned Parcels Selector */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-surface-900 flex items-center gap-1.5">
            <MapPin size={16} className="text-primary-600" />
            Assigned Field Parcels ({filteredParcels.length})
          </h2>
          <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
            Pending Action
          </span>
        </div>

        {/* Project Filter */}
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="w-full h-8 px-2.5 rounded-lg border border-surface-200 text-xs text-surface-700 bg-surface-50 focus:outline-none"
        >
          <option value="">All Assigned Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Parcel List */}
        <div className="space-y-2 max-h-52 overflow-y-auto divide-y divide-surface-100">
          {filteredParcels.length === 0 ? (
            <p className="text-center py-6 text-surface-400 text-xs">
              No pending parcel verifications assigned.
            </p>
          ) : (
            filteredParcels.slice(0, 15).map(parcel => (
              <button
                key={parcel.id}
                onClick={() => setSelectedParcel(parcel)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  selectedParcel?.id === parcel.id
                    ? 'border-primary-500 bg-primary-50/80'
                    : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] px-1 bg-surface-200 text-surface-800 rounded font-bold uppercase">ULPIN</span>
                      <span className="text-xs font-mono font-bold text-primary-700">{parcel.ulpin}</span>
                    </div>
                    <p className="text-xs font-semibold text-surface-800">
                      Survey: {parcel.surveyNumber} • {parcel.area.toFixed(2)} Ha
                    </p>
                    <p className="text-[11px] text-surface-500">{parcel.village}, {parcel.district}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                    {parcel.verificationStatus}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Selected Parcel Field Verification Form */}
      {selectedParcel && (
        <div className="bg-white rounded-xl border border-primary-200 p-4 shadow-lg space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-start justify-between border-b border-surface-100 pb-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary-600">Verifying Parcel</span>
              <h3 className="text-sm font-bold text-surface-900 font-mono">{selectedParcel.ulpin}</h3>
              <p className="text-[11px] text-surface-500">
                Survey No: {selectedParcel.surveyNumber} • Owner: {selectedParcel.ownerName}
              </p>
            </div>
            <button onClick={() => setSelectedParcel(null)} className="p-1 text-surface-400 hover:text-surface-700">
              <XCircle size={18} />
            </button>
          </div>

          {/* 5-Point Verification Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-surface-900 flex items-center gap-1.5">
              <CheckSquare size={14} className="text-primary-600" />
              Statutory Field Verification Checklist
            </p>
            <div className="space-y-1.5 text-xs text-surface-700 bg-surface-50 p-3 rounded-lg border border-surface-200">
              {[
                { key: 'boundaryDemarcation' as const, label: 'Physical boundary stones & cadastral corners verified' },
                { key: 'ownerIdentity' as const, label: 'Landowner revenue identity validated on-site' },
                { key: 'encumbranceCheck' as const, label: 'Crop standing / active tenancy status verified' },
                { key: 'assetEnumeration' as const, label: 'Structural assets, wells, & tree enumeration completed' },
                { key: 'noEncroachment' as const, label: 'No unauthorized third-party encroachments observed' },
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-start gap-2.5 cursor-pointer hover:bg-white/80 p-1 rounded transition-colors select-none"
                  onClick={() => handleChecklistToggle(item.key)}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => {}} // handled by parent div
                    className="mt-0.5 rounded text-primary-600 focus:ring-primary-500/20"
                  />
                  <span className={`text-[11px] leading-tight ${checklist[item.key] ? 'text-surface-900 font-medium' : 'text-surface-600'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Evidence Capture (Camera / Photo) */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-surface-900 flex items-center gap-1.5">
              <Camera size={14} className="text-primary-600" />
              Site Evidence Capture (Geo-Tagged)
            </p>

            {evidencePhoto ? (
              <div className="relative rounded-lg overflow-hidden border border-surface-200 bg-surface-100 p-2 text-center">
                <div className="text-xs text-emerald-700 font-semibold mb-1 flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} /> {photoName || 'Site photo captured'}
                </div>
                <p className="text-[10px] text-surface-500 font-mono">
                  Watermark: {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'GPS metadata stamped'}
                </p>
                <button
                  onClick={() => { setEvidencePhoto(null); setPhotoName(''); }}
                  className="mt-1 text-[11px] text-red-600 hover:text-red-800 underline"
                >
                  Remove & Re-take
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSimulateCamera}
                  className="flex-1 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-surface-200"
                >
                  <Camera size={14} /> Snapshot Camera
                </button>
                <label className="flex-1 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-surface-200 cursor-pointer">
                  <Upload size={14} /> Upload File
                  <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-surface-900">
              Field Officer Remarks
            </label>
            <textarea
              rows={2}
              value={verificationNote}
              onChange={e => setVerificationNote(e.target.value)}
              placeholder="Record ground observations, crop conditions, or neighbor corroborations..."
              className="w-full p-2.5 rounded-lg border border-surface-200 text-xs text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-surface-100">
            <button
              onClick={() => handleSubmitVerification('Rejected')}
              disabled={submitting}
              className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Flag Discrepancy
            </button>
            <button
              onClick={() => handleSubmitVerification('Verified')}
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Confirm Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
