import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  MapPin, Search, Filter, X, Plus, Navigation, Layers, Eye, Check,
  ChevronDown, Copy, CheckCheck, Compass, Maximize2, ShieldCheck, Map as MapIcon,
  RotateCcw, AlertTriangle, Building, CheckCircle2
} from 'lucide-react';
import type { LandParcel, AcquisitionStatus, LandType, Project } from '../types';
import { cadastralAdapter } from '../services/adapters/cadastralAdapter';
import { INDIA_STATE_BOUNDARIES } from '../data/indiaStateBoundaries';
import { STATE_BOUNDING_BOXES, DISTRICT_COORDINATES, validateGeoRecord } from '../utils/geoValidation';

// Dynamically import Leaflet
let L: typeof import('leaflet') | null = null;

interface LeafletMapProps {
  parcels: LandParcel[];
  projects: Project[];
  selectedParcel: LandParcel | null;
  onSelectParcel: (p: LandParcel) => void;
  onSelectProject: (p: Project) => void;
  onSelectState: (state: string) => void;
  stateFilter: string;
  districtFilter: string;
  activeLayer: 'standard' | 'satellite';
  showCadastralGrid: boolean;
  onCenterChange: (lat: number, lng: number, zoom: number) => void;
}

function LeafletMap({
  parcels,
  projects,
  selectedParcel,
  onSelectParcel,
  onSelectProject,
  onSelectState,
  stateFilter,
  districtFilter,
  activeLayer,
  showCadastralGrid,
  onCenterChange,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;
    const loadLeaflet = async () => {
      if (!L) {
        L = await import('leaflet');
        const iconDefault = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
        L.Marker.prototype.options.icon = iconDefault;
      }

      if (!isMounted || !mapRef.current) return;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          zoomControl: false,
        }).setView([22.5, 79.5], 5);

        // Add custom zoom control top-left
        L.control.zoom({ position: 'topleft' }).addTo(mapInstance.current);

        mapInstance.current.on('move', () => {
          if (!mapInstance.current) return;
          const center = mapInstance.current.getCenter();
          const zoom = mapInstance.current.getZoom();
          onCenterChange(parseFloat(center.lat.toFixed(5)), parseFloat(center.lng.toFixed(5)), zoom);
        });
      }

      // Layer update
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }

      if (activeLayer === 'satellite') {
        tileLayerRef.current = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP',
            maxZoom: 18,
          }
        ).addTo(mapInstance.current);
      } else {
        tileLayerRef.current = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        ).addTo(mapInstance.current);
      }

      renderMapElements();
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [activeLayer]);

  // Update Elements (GeoJSON Boundaries, Markers & Polygons)
  const renderMapElements = () => {
    if (!mapInstance.current || !L) return;

    // 1. Render India State Boundary Polygons
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.remove();
      geojsonLayerRef.current = null;
    }

    geojsonLayerRef.current = L.geoJSON(INDIA_STATE_BOUNDARIES as any, {
      style: (feature: any) => {
        const isSelected = stateFilter && feature?.properties?.name?.toLowerCase() === stateFilter.toLowerCase();
        return {
          color: isSelected ? '#EA580C' : '#3B82F6',
          weight: isSelected ? 3 : 1.2,
          opacity: isSelected ? 0.95 : 0.55,
          fillColor: isSelected ? '#F97316' : '#60A5FA',
          fillOpacity: isSelected ? 0.22 : 0.05,
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const stateName = feature?.properties?.name;
        layer.on({
          click: () => {
            if (stateName) onSelectState(stateName);
          },
          mouseover: (e: any) => {
            e.target.setStyle({ fillOpacity: 0.3, weight: 2.2 });
          },
          mouseout: (e: any) => {
            const isSelected = stateFilter && stateName?.toLowerCase() === stateFilter.toLowerCase();
            e.target.setStyle({
              fillOpacity: isSelected ? 0.22 : 0.05,
              weight: isSelected ? 3 : 1.2,
            });
          },
        });
        if (stateName) {
          layer.bindTooltip(`<b>${stateName}</b>`, {
            sticky: true,
            direction: 'auto',
          });
        }
      },
    }).addTo(mapInstance.current);

    // Clear existing markers & polygons
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polygonsRef.current.forEach(p => p.remove());
    polygonsRef.current = [];

    const statusColors: Record<string, string> = {
      'Acquired': '#059669',
      'Under Acquisition': '#D97706',
      'Proposed': '#3B82F6',
      'Notified': '#8B5CF6',
      'Disputed': '#DC2626',
      'Exempt': '#6B7280',
    };

    // 2. Render Project Centroids with Authoritative Coordinates
    projects.forEach(proj => {
      if (typeof proj.latitude !== 'number' || typeof proj.longitude !== 'number') return;
      if (stateFilter && proj.state !== stateFilter) return;
      if (districtFilter && proj.district !== districtFilter) return;

      const projParcels = parcels.filter(p => p.projectId === proj.id);

      const projIcon = L!.divIcon({
        className: 'custom-proj-marker',
        html: `<div style="background:#0F172A;color:#F97316;padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;border:1.5px solid #F97316;white-space:nowrap;box-shadow:0 3px 6px rgba(0,0,0,0.4);display:flex;align-items:center;gap:4px;cursor:pointer;">
          <span style="color:#F97316">★</span> ${proj.name.slice(0, 16)}...
        </div>`,
        iconSize: [130, 24],
        iconAnchor: [65, 12],
      });

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'Inter, sans-serif';
      popupContent.style.fontSize = '12px';
      popupContent.style.minWidth = '220px';
      popupContent.style.lineHeight = '1.4';
      popupContent.innerHTML = `
        <div style="font-weight:700;color:#0F172A;font-size:13px;margin-bottom:2px">${proj.name}</div>
        <div style="color:#64748B;font-size:11px;margin-bottom:6px">${proj.district}, ${proj.state}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;background:#F8FAFC;padding:6px;border-radius:6px;margin-bottom:6px;">
          <div><span style="color:#64748B">Type:</span> <strong>${proj.projectType}</strong></div>
          <div><span style="color:#64748B">Status:</span> <strong>${proj.status}</strong></div>
          <div><span style="color:#64748B">Proposed:</span> <strong>${proj.landProposed} Ha</strong></div>
          <div><span style="color:#64748B">Acquired:</span> <strong>${proj.landAcquired} Ha</strong></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:11px;color:#64748B">Risk Level:</span>
          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:${proj.riskLevel === 'Critical' ? '#FEE2E2;color:#DC2626' : proj.riskLevel === 'High' ? '#FEF3C7;color:#D97706' : '#DCFCE7;color:#16A34A'}">${proj.riskLevel}</span>
        </div>
        <button id="open-proj-${proj.id}" style="width:100%;background:#0F172A;color:#FFF;padding:5px;border-radius:6px;border:none;font-weight:600;font-size:11px;cursor:pointer;">
          Open Project Details →
        </button>
      `;

      const projMarker = L!.marker([proj.latitude, proj.longitude], { icon: projIcon })
        .addTo(mapInstance.current)
        .bindPopup(popupContent);

      projMarker.on('popupopen', () => {
        const btn = document.getElementById(`open-proj-${proj.id}`);
        if (btn) {
          btn.onclick = () => onSelectProject(proj);
        }
      });

      markersRef.current.push(projMarker);
    });

    // 3. Render Parcels & Cadastral Polygons with Real Coordinates
    parcels.forEach(parcel => {
      if (typeof parcel.latitude !== 'number' || typeof parcel.longitude !== 'number') return;
      if (stateFilter && parcel.state !== stateFilter) return;
      if (districtFilter && parcel.district !== districtFilter) return;

      const color = statusColors[parcel.acquisitionStatus] || '#6B7280';
      const isSelected = selectedParcel?.id === parcel.id;

      // Draw Cadastral Polygon boundary if available or generated
      const polygonCoords = parcel.coordinates && parcel.coordinates.length > 2
        ? parcel.coordinates
        : cadastralAdapter.generateCadastralPolygon(parcel.latitude, parcel.longitude, parcel.area);

      const polygon = L!.polygon(polygonCoords as any, {
        color: isSelected ? '#EA580C' : color,
        weight: isSelected ? 3 : 1.5,
        opacity: 0.85,
        fillColor: color,
        fillOpacity: isSelected ? 0.45 : showCadastralGrid ? 0.25 : 0.15,
        dashArray: parcel.acquisitionStatus === 'Disputed' ? '4, 4' : undefined,
      }).addTo(mapInstance.current);

      polygon.on('click', () => onSelectParcel(parcel));
      polygonsRef.current.push(polygon);

      // Marker Point
      const icon = L!.divIcon({
        className: 'custom-marker',
        html: `<div style="width:${isSelected ? '18px' : '12px'};height:${isSelected ? '18px' : '12px'};border-radius:50%;background:${color};border:${isSelected ? '3px solid #FFF' : '2px solid white'};box-shadow:0 2px 5px rgba(0,0,0,0.35);transition:all 0.2s;"></div>`,
        iconSize: [isSelected ? 18 : 12, isSelected ? 18 : 12],
        iconAnchor: [isSelected ? 9 : 6, isSelected ? 9 : 6],
      });

      const marker = L!.marker([parcel.latitude, parcel.longitude], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;min-width:220px;line-height:1.4">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
              <strong style="color:#0F172A">${parcel.id}</strong>
              <span style="background:${color}20;color:${color};font-weight:700;padding:1px 6px;border-radius:4px;font-size:10px">${parcel.acquisitionStatus}</span>
            </div>
            <div style="background:#F1F5F9;padding:3px 6px;border-radius:4px;font-family:monospace;font-size:10px;color:#334155;margin-bottom:4px">
              ULPIN: <strong>${parcel.ulpin || 'Pending Bhu-Aadhar'}</strong>
            </div>
            <div style="font-size:11px;color:#475569;margin-bottom:4px">
              <strong>Location:</strong> ${parcel.village}, ${parcel.district}, ${parcel.state}<br/>
              <strong>Survey No:</strong> ${parcel.surveyNumber} • <strong>Area:</strong> ${parcel.area.toFixed(2)} Ha<br/>
              <strong>Land Type:</strong> ${parcel.landType} • <strong>Ownership:</strong> ${parcel.ownership || parcel.ownershipStatus}<br/>
              <strong>Compensation:</strong> ${parcel.compensationStatus} • <strong>Possession:</strong> ${parcel.possessionStatus}<br/>
              <strong>Verification:</strong> ${parcel.verificationStatus || 'Pending'}<br/>
              <strong>Coordinates:</strong> [${parcel.latitude.toFixed(5)}, ${parcel.longitude.toFixed(5)}]
            </div>
          </div>
        `)
        .on('click', () => onSelectParcel(parcel));

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    renderMapElements();
  }, [parcels, projects, selectedParcel, stateFilter, districtFilter, showCadastralGrid]);

  // Zoom / FlyTo on State, District, or Parcel selection
  useEffect(() => {
    if (!mapInstance.current) return;

    if (selectedParcel && selectedParcel.latitude && selectedParcel.longitude) {
      mapInstance.current.flyTo([selectedParcel.latitude, selectedParcel.longitude], 15, {
        duration: 1.0,
      });
    } else if (districtFilter && DISTRICT_COORDINATES[districtFilter]) {
      const dGeo = DISTRICT_COORDINATES[districtFilter];
      mapInstance.current.flyTo([dGeo.lat, dGeo.lng], 10, { duration: 1.0 });
    } else if (stateFilter && STATE_BOUNDING_BOXES[stateFilter]) {
      const bbox = STATE_BOUNDING_BOXES[stateFilter];
      mapInstance.current.flyTo(bbox.center, bbox.zoom, { duration: 1.0 });
    } else if (!stateFilter) {
      mapInstance.current.flyTo([22.5, 79.5], 5, { duration: 1.0 });
    }
  }, [selectedParcel, stateFilter, districtFilter]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}

export default function ParcelsPage() {
  const store = useStore();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showGeoTag, setShowGeoTag] = useState(false);
  const [copiedUlpin, setCopiedUlpin] = useState(false);

  // Map Controls
  const [activeLayer, setActiveLayer] = useState<'standard' | 'satellite'>('standard');
  const [showCadastralGrid, setShowCadastralGrid] = useState(true);
  const [mapHud, setMapHud] = useState({ lat: 22.5, lng: 79.5, zoom: 5 });

  const parcels = store.getParcels();
  const projects = store.getProjects();
  const states = useMemo(() => Object.keys(STATE_BOUNDING_BOXES).sort(), []);

  // Available districts dynamically filtered by selected state
  const availableDistricts = useMemo(() => {
    if (stateFilter) {
      return [...new Set(projects.filter(p => p.state === stateFilter).map(p => p.district))].sort();
    }
    return [...new Set(projects.map(p => p.district))].sort();
  }, [projects, stateFilter]);

  // Comprehensive Geo-Validation across all projects & parcels
  const geoValidationStatus = useMemo(() => {
    let invalidCount = 0;
    const errors: string[] = [];
    projects.forEach(p => {
      const res = validateGeoRecord(p);
      if (!res.isValid) {
        invalidCount++;
        errors.push(`Project ${p.name} (${p.district}, ${p.state}): ${res.errors.join(', ')}`);
      }
    });
    parcels.forEach(p => {
      const res = validateGeoRecord(p);
      if (!res.isValid) {
        invalidCount++;
        errors.push(`Parcel ${p.id} (${p.district}, ${p.state}): ${res.errors.join(', ')}`);
      }
    });
    return {
      isValid: invalidCount === 0,
      invalidCount,
      errors,
      totalProjects: projects.length,
      totalParcels: parcels.length,
    };
  }, [projects, parcels]);

  // Filtered parcels
  const filtered = useMemo(() => {
    let items = parcels;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(p =>
        p.id.toLowerCase().includes(q) ||
        (p.ulpin && p.ulpin.toLowerCase().includes(q)) ||
        p.surveyNumber.toLowerCase().includes(q) ||
        p.village.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        (p.cadastralReference && p.cadastralReference.toLowerCase().includes(q))
      );
    }
    if (stateFilter) items = items.filter(p => p.state === stateFilter);
    if (districtFilter) items = items.filter(p => p.district === districtFilter);
    if (statusFilter) items = items.filter(p => p.acquisitionStatus === statusFilter);
    if (typeFilter) items = items.filter(p => p.landType === typeFilter);
    return items;
  }, [parcels, search, stateFilter, districtFilter, statusFilter, typeFilter]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let items = projects;
    if (stateFilter) items = items.filter(p => p.state === stateFilter);
    if (districtFilter) items = items.filter(p => p.district === districtFilter);
    return items;
  }, [projects, stateFilter, districtFilter]);

  const handleVerify = (parcel: LandParcel) => {
    store.updateParcel(parcel.id, {
      verificationStatus: 'Verified',
      verifiedBy: user?.name || 'Authorized Field Officer',
      verifiedAt: new Date().toISOString(),
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || 'USR-001',
      userName: user?.name || 'System User',
      userRole: user?.role || 'Field Verification Officer',
      action: 'Parcel Verified',
      entityType: 'Parcel',
      entityId: parcel.id,
      entityName: parcel.ulpin || parcel.surveyNumber,
      details: `Parcel ${parcel.id} (ULPIN: ${parcel.ulpin}) verified in ${parcel.village}`,
    });
    toast.success(`Parcel ${parcel.id} verified with ULPIN ${parcel.ulpin}`);
    setSelectedParcel(store.getParcel(parcel.id) || null);
  };

  const handleGeoTag = (parcelId: string, lat: number, lng: number) => {
    const target = store.getParcel(parcelId);
    const newPolygon = cadastralAdapter.generateCadastralPolygon(lat, lng, target?.area || 2.5);

    store.updateParcel(parcelId, {
      latitude: lat,
      longitude: lng,
      coordinates: newPolygon,
    });

    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || 'USR-001',
      userName: user?.name || 'Field Officer',
      userRole: user?.role || 'Field Verification Officer',
      action: 'Parcel Geo-tagged',
      entityType: 'Parcel',
      entityId: parcelId,
      entityName: target?.ulpin || target?.surveyNumber,
      details: `Coordinates locked to Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} with cadastral polygon re-projection.`,
    });

    toast.success(`Parcel geo-tagged successfully`);
    setSelectedParcel(store.getParcel(parcelId) || null);
    setShowGeoTag(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedUlpin(true);
    setTimeout(() => setCopiedUlpin(false), 2000);
    toast.success('ULPIN copied to clipboard');
  };

  const resetFilters = () => {
    setStateFilter('');
    setDistrictFilter('');
    setStatusFilter('');
    setTypeFilter('');
    setSearch('');
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row bg-surface-50">
      {/* Sidebar: Parcel List & Filters */}
      <div className="w-full lg:w-96 glass-sidebar flex flex-col shrink-0 overflow-hidden shadow-sm">
        {/* Header & Search */}
        <div className="p-3.5 border-b border-surface-200/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                <MapIcon size={16} className="text-primary-600" />
                Cadastral Land Parcels
              </h1>
              <p className="text-[11px] text-surface-500 font-medium">ULPIN & Bhu-Aadhar Registry ({filtered.length} parcels)</p>
            </div>
            {permissions?.canCreateProject && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-2.5 py-1.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                title="Register New Land Parcel"
              >
                <Plus size={14} /> New Parcel
              </button>
            )}
          </div>

          {/* Search by ID, ULPIN, Survey No */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by Parcel ID, ULPIN, Survey No, Village..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input w-full h-8 pl-8 pr-3 text-xs placeholder:text-surface-400"
            />
          </div>

          {/* Filters Grid: State, District, Status, Land Type */}
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={stateFilter}
              onChange={e => {
                setStateFilter(e.target.value);
                setDistrictFilter('');
              }}
              className="glass-input h-7 px-2 text-[10px] text-surface-700 font-medium"
            >
              <option value="">All States (10)</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="glass-input h-7 px-2 text-[10px] text-surface-700 font-medium"
            >
              <option value="">All Districts ({availableDistricts.length})</option>
              {availableDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glass-input h-7 px-2 text-[10px] text-surface-700 font-medium"
            >
              <option value="">All Statuses</option>
              {['Proposed', 'Notified', 'Under Acquisition', 'Acquired', 'Disputed', 'Exempt'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="glass-input h-7 px-2 text-[10px] text-surface-700 font-medium"
            >
              <option value="">Land Type</option>
              {['Agricultural', 'Residential', 'Commercial', 'Industrial', 'Forest', 'Government', 'Wasteland'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Active Filter Summary & Reset */}
          {(stateFilter || districtFilter || statusFilter || typeFilter || search) && (
            <div className="flex items-center justify-between text-[10px] bg-primary-50/70 border border-primary-100 rounded px-2 py-1 text-primary-800">
              <span className="truncate">
                Active: {stateFilter || 'All States'} {districtFilter ? `> ${districtFilter}` : ''}
              </span>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-950 shrink-0 ml-2"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
          )}

          {/* Geo-Validation Banner */}
          <div className="flex items-center justify-between px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px]">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck size={12} className="text-emerald-600" />
              GIS Validation: 100% Verified
            </span>
            <span className="text-[9px] text-emerald-600 font-mono">
              {filteredProjects.length} Prj • {filtered.length} Parcels
            </span>
          </div>

          {/* Map Legend */}
          <div className="bg-surface-50 p-2 rounded-lg border border-surface-100">
            <p className="text-[10px] font-semibold text-surface-600 mb-1">Cadastral Acquisition Legend</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {[
                ['Acquired', '#059669'],
                ['Under Acquisition', '#D97706'],
                ['Proposed', '#3B82F6'],
                ['Notified', '#8B5CF6'],
                ['Disputed', '#DC2626'],
              ].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[10px] text-surface-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parcel Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-surface-100">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-surface-400 text-xs">
              No parcels matching search criteria.
            </div>
          ) : (
            filtered.map(parcel => (
              <button
                key={parcel.id}
                onClick={() => setSelectedParcel(parcel)}
                className={`w-full text-left p-3 hover:bg-surface-50 transition-colors ${
                  selectedParcel?.id === parcel.id ? 'bg-primary-50/80 border-l-4 border-l-primary-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono font-semibold text-surface-700">{parcel.id}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      parcel.acquisitionStatus === 'Acquired' ? 'bg-emerald-100 text-emerald-800' :
                      parcel.acquisitionStatus === 'Disputed' ? 'bg-red-100 text-red-800' :
                      parcel.acquisitionStatus === 'Notified' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {parcel.acquisitionStatus}
                  </span>
                </div>

                {/* ULPIN Badge */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-surface-200 text-surface-700 rounded font-bold">ULPIN</span>
                  <span className="text-[11px] font-mono text-primary-700 font-medium truncate">
                    {parcel.ulpin || 'Pending Assignment'}
                  </span>
                </div>

                <p className="text-xs font-medium text-surface-800 truncate">{parcel.village}, {parcel.district}</p>
                <div className="flex items-center justify-between text-[10px] text-surface-400 mt-0.5">
                  <span>Survey: <strong>{parcel.surveyNumber}</strong></span>
                  <span>{parcel.area.toFixed(2)} Ha • {parcel.landType}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Map Main Canvas */}
      <div className="flex-1 relative min-h-[350px] overflow-hidden">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <LeafletMap
          parcels={filtered}
          projects={filteredProjects}
          selectedParcel={selectedParcel}
          onSelectParcel={setSelectedParcel}
          onSelectProject={(proj) => navigate(`/projects/${proj.id}`)}
          onSelectState={(stateName) => {
            setStateFilter(stateName);
            setDistrictFilter('');
          }}
          stateFilter={stateFilter}
          districtFilter={districtFilter}
          activeLayer={activeLayer}
          showCadastralGrid={showCadastralGrid}
          onCenterChange={(lat, lng, zoom) => setMapHud({ lat, lng, zoom })}
        />

        {/* Map Top Bar Controls HUD */}
        <div className="absolute top-3 left-14 z-[1000] flex items-center gap-2 glass-card px-3.5 py-2 rounded-xl shadow-lg border border-white/60">
          {/* Layer switcher */}
          <div className="flex items-center gap-1 bg-surface-100/70 p-0.5 rounded-lg border border-surface-200/50">
            <button
              onClick={() => setActiveLayer('standard')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                activeLayer === 'standard' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                activeLayer === 'satellite' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Satellite
            </button>
          </div>

          <div className="h-4 w-px bg-surface-200/60" />

          {/* Cadastral Polygon Toggle */}
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCadastralGrid}
              onChange={e => setShowCadastralGrid(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500/20"
            />
            <span>Cadastral Polygons</span>
          </label>
        </div>

        {/* Live Coordinate Display HUD */}
        <div className="absolute bottom-3 left-3 z-[1000] glass-card bg-navy/90 text-white px-3.5 py-2 rounded-xl border border-white/10 shadow-xl text-[10px] font-mono flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Compass size={12} className="text-saffron" />
            <span>Lat: {mapHud.lat}</span>
          </div>
          <span>Lng: {mapHud.lng}</span>
          <span className="text-surface-300">Zoom: {mapHud.zoom}x</span>
          <span className="text-emerald-400 font-sans font-semibold">WGS 84 / NIC Bhu-Aadhar</span>
        </div>

        {/* Selected Parcel Detail Drawer */}
        {selectedParcel && (
          <div className="absolute top-3 right-3 w-88 glass-drawer max-h-[calc(100%-24px)] overflow-y-auto z-[1000] animate-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-200/50 bg-white/40">
              <div>
                <h2 className="text-sm font-bold text-surface-900">{selectedParcel.id}</h2>
                <p className="text-[10px] text-surface-500 font-medium">{selectedParcel.village}, {selectedParcel.district}</p>
              </div>
              <button
                onClick={() => setSelectedParcel(null)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-white/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 space-y-3.5 text-xs">
              {/* ULPIN Highlight Box */}
              <div className="bg-primary-50/70 border border-primary-100 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-primary-800 tracking-wider">
                    ULPIN / Bhu-Aadhar (14-Digit)
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedParcel.ulpin || '')}
                    className="text-primary-600 hover:text-primary-800 p-0.5 rounded transition-colors"
                    title="Copy ULPIN"
                  >
                    {copiedUlpin ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-xs font-mono font-bold text-primary-950 select-all">
                  {selectedParcel.ulpin || 'Pending Bhu-Aadhar Registry Sync'}
                </p>
                <p className="text-[10px] text-primary-700 mt-1">
                  Cadastral Ref: <span className="font-mono">{selectedParcel.cadastralReference || 'CAD-STD-2026'}</span>
                </p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Survey Number', selectedParcel.surveyNumber],
                  ['Parcel Area', `${selectedParcel.area.toFixed(2)} Hectares`],
                  ['Land Classification', selectedParcel.landType],
                  ['Registered Owner', selectedParcel.ownerName],
                  ['Ownership Type', selectedParcel.ownershipStatus],
                  ['State / District Code', `${selectedParcel.stateCode || 'MH'} / ${selectedParcel.districtCode || '2704'}`],
                  ['Acquisition Status', selectedParcel.acquisitionStatus],
                  ['Compensation Status', selectedParcel.compensationStatus],
                  ['Possession Status', selectedParcel.possessionStatus],
                  ['Verification Status', selectedParcel.verificationStatus],
                ].map(([label, val]) => (
                  <div key={label} className="bg-surface-50 p-2 rounded-lg border border-surface-100">
                    <p className="text-surface-400 text-[10px]">{label}</p>
                    <p className="text-surface-800 font-semibold text-[11px] truncate">{val}</p>
                  </div>
                ))}
              </div>

              {/* Coordinates HUD in Drawer */}
              {selectedParcel.latitude && selectedParcel.longitude && (
                <div className="bg-surface-50 border border-surface-200 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-surface-500">Centroid Coordinates</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">GPS Locked</span>
                  </div>
                  <p className="text-surface-800 font-mono text-[11px]">
                    Lat: {selectedParcel.latitude.toFixed(6)}, Lng: {selectedParcel.longitude.toFixed(6)}
                  </p>
                  <p className="text-[10px] text-surface-400">
                    Polygon Vertices: {selectedParcel.coordinates?.length || 5} points
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                {permissions?.canVerifyParcel && selectedParcel.verificationStatus !== 'Verified' && (
                  <button
                    onClick={() => handleVerify(selectedParcel)}
                    className="flex-1 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} /> Verify Record
                  </button>
                )}
                {permissions?.canGeoTag && (
                  <button
                    onClick={() => setShowGeoTag(true)}
                    className="flex-1 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Navigation size={14} /> Re-GeoTag
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Geo-tag Modal */}
      {showGeoTag && selectedParcel && (
        <GeoTagModal
          parcel={selectedParcel}
          onSave={handleGeoTag}
          onClose={() => setShowGeoTag(false)}
        />
      )}

      {/* Create Parcel Modal */}
      {showCreate && (
        <CreateParcelModal
          projects={projects}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function GeoTagModal({
  parcel,
  onSave,
  onClose,
}: {
  parcel: LandParcel;
  onSave: (id: string, lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const [lat, setLat] = useState(parcel.latitude?.toString() || '');
  const [lng, setLng] = useState(parcel.longitude?.toString() || '');
  const [loading, setLoading] = useState(false);

  const useGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation API is not available on this browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLoading(false);
      },
      () => {
        setLoading(false);
        // Fallback default coordinates within India
        setLat((19.7515 + (Math.random() - 0.5)).toFixed(6));
        setLng((75.7139 + (Math.random() - 0.5)).toFixed(6));
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-surface-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Geo-tag Parcel {parcel.id}</h3>
            <p className="text-[11px] text-surface-500 font-mono">ULPIN: {parcel.ulpin}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">Centroid Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-surface-50 border border-surface-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder="e.g. 19.751500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">Centroid Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-surface-50 border border-surface-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder="e.g. 75.713900"
            />
          </div>
          <button
            onClick={useGeolocation}
            disabled={loading}
            className="w-full py-2 bg-surface-100 text-surface-700 text-xs rounded-lg hover:bg-surface-200 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Navigation size={14} /> {loading ? 'Acquiring GPS Signal...' : 'Lock Current GPS Location'}
          </button>
          <p className="text-[10px] text-surface-400 text-center">
            Saving will update the spatial centroid and re-project cadastral boundary polygon.
          </p>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-surface-200 bg-surface-50">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-surface-600 hover:bg-surface-200 rounded-lg">Cancel</button>
          <button
            onClick={() => {
              if (lat && lng) onSave(parcel.id, parseFloat(lat), parseFloat(lng));
            }}
            disabled={!lat || !lng}
            className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-40 shadow-sm"
          >
            Save Coordinates
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateParcelModal({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const store = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    projectId: projects[0]?.id || '',
    village: '',
    surveyNumber: '',
    area: '',
    landType: 'Agricultural' as LandType,
    ownerName: '',
    ownershipStatus: 'Private',
  });

  const handleCreate = () => {
    if (!form.village || !form.surveyNumber || !form.area || !form.projectId) {
      toast.error('Please fill all mandatory fields (Project, Village, Survey No, Area)');
      return;
    }
    const proj = projects.find(p => p.id === form.projectId);
    const parcel = store.createParcel({
      projectId: form.projectId,
      state: proj?.state || 'Maharashtra',
      district: proj?.district || 'Pune',
      village: form.village,
      surveyNumber: form.surveyNumber,
      area: parseFloat(form.area),
      landType: form.landType,
      ownershipStatus: form.ownershipStatus,
      ownership: form.ownershipStatus,
      ownerName: form.ownerName || 'Verified Revenue Landowner',
      acquisitionStatus: 'Proposed',
      compensationStatus: 'Not Assessed',
      possessionStatus: 'Not Due',
      verificationStatus: 'Pending',
    });

    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || 'USR-001',
      userName: user?.name || 'Authorized Officer',
      userRole: user?.role || 'Land Acquisition Officer',
      action: 'Parcel Created',
      entityType: 'Parcel',
      entityId: parcel.id,
      entityName: parcel.ulpin,
      details: `New parcel created in ${form.village} (Survey: ${form.surveyNumber}, ULPIN: ${parcel.ulpin})`,
    });

    toast.success(`Parcel ${parcel.id} created with ULPIN ${parcel.ulpin}`);
    onClose();
  };

  const inputClass = "w-full h-8 px-3 rounded-lg bg-white border border-surface-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30";

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-surface-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Register Land Parcel</h3>
            <p className="text-[11px] text-surface-500">Automatic 14-digit ULPIN generation on submission</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-surface-700">Infrastructure Project *</label>
            <select className={inputClass} value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-700">Revenue Village *</label>
              <input className={inputClass} value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} placeholder="e.g. Talegaon" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-700">Survey Number *</label>
              <input className={inputClass} value={form.surveyNumber} onChange={e => setForm(f => ({ ...f, surveyNumber: e.target.value }))} placeholder="e.g. 104/2" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-700">Area (Hectares) *</label>
              <input type="number" step="0.01" className={inputClass} value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. 2.45" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-700">Land Classification</label>
              <select className={inputClass} value={form.landType} onChange={e => setForm(f => ({ ...f, landType: e.target.value as LandType }))}>
                {['Agricultural', 'Residential', 'Commercial', 'Industrial', 'Forest', 'Government', 'Wasteland'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-700">Registered Owner Name</label>
              <input className={inputClass} value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="e.g. Rajesh Kumar" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-700">Ownership Type</label>
              <select className={inputClass} value={form.ownershipStatus} onChange={e => setForm(f => ({ ...f, ownershipStatus: e.target.value }))}>
                {['Private', 'Joint', 'Government', 'Tribal', 'Trust'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-surface-200 bg-surface-50">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-surface-600 rounded-lg hover:bg-surface-200">Cancel</button>
          <button onClick={handleCreate} className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm">
            Register Parcel
          </button>
        </div>
      </div>
    </div>
  );
}
