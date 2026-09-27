// ============================================================
// BhoomiSetu - National Data Import Center (Section E)
// Standardized CSV/JSON batch ingest with validation and deduplication
// ============================================================
import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileUp, Database, CheckCircle2, AlertTriangle, XCircle, Download,
  Layers, FileText, ArrowRight, ShieldCheck, RefreshCw, Info, HelpCircle
} from 'lucide-react';
import { standardizeParcel } from '../types/standardSchema';

type ImportEntityType = 'parcels' | 'projects' | 'awards' | 'compensation' | 'families' | 'milestones';

interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

export default function DataImportPage() {
  const store = useStore();
  const { user } = useAuth();
  const toast = useToast();

  const [entityType, setEntityType] = useState<ImportEntityType>('parcels');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; duplicates: number; rejected: number } | null>(null);

  const projects = store.getProjects();
  const parcels = store.getParcels();

  // Generate Sample Templates
  const getSampleData = (type: ImportEntityType, format: 'json' | 'csv'): string => {
    const sampleProjId = projects[0]?.id || 'PRJ-1001';

    if (type === 'parcels') {
      if (format === 'json') {
        return JSON.stringify([
          {
            projectId: sampleProjId,
            state: "Maharashtra",
            district: "Pune",
            village: "Khed-Shivapur",
            surveyNumber: "142/3",
            area: 3.25,
            landType: "Agricultural",
            ownerName: "Chandrakant Patil",
            ownershipStatus: "Private",
            latitude: 18.5204,
            longitude: 73.8567
          },
          {
            projectId: sampleProjId,
            state: "Maharashtra",
            district: "Pune",
            village: "Khed-Shivapur",
            surveyNumber: "142/4",
            area: 1.80,
            landType: "Agricultural",
            ownerName: "Sunita Deshmukh",
            ownershipStatus: "Joint",
            latitude: 18.5215,
            longitude: 73.8579
          }
        ], null, 2);
      }
      return `projectId,state,district,village,surveyNumber,area,landType,ownerName,ownershipStatus,latitude,longitude
${sampleProjId},Maharashtra,Pune,Khed-Shivapur,142/3,3.25,Agricultural,Chandrakant Patil,Private,18.5204,73.8567
${sampleProjId},Maharashtra,Pune,Khed-Shivapur,142/4,1.80,Agricultural,Sunita Deshmukh,Joint,18.5215,73.8579`;
    }

    if (type === 'projects') {
      if (format === 'json') {
        return JSON.stringify([
          {
            name: "NH-48 Pune-Satara Greenfield Expressway",
            requiringBody: "National Highways Authority of India",
            projectType: "Highway",
            state: "Maharashtra",
            district: "Pune",
            landProposed: 245.5,
            priority: "Urgent",
            targetStartDate: "2026-10-01",
            targetCompletionDate: "2029-03-31"
          }
        ], null, 2);
      }
      return `name,requiringBody,projectType,state,district,landProposed,priority,targetStartDate,targetCompletionDate
NH-48 Pune-Satara Greenfield Expressway,National Highways Authority of India,Highway,Maharashtra,Pune,245.5,Urgent,2026-10-01,2029-03-31`;
    }

    if (type === 'awards') {
      if (format === 'json') {
        return JSON.stringify([
          {
            projectId: sampleProjId,
            beneficiary: "Rameshwar Rao",
            landArea: 2.1,
            assessedAmount: 650000,
            awardAmount: 650000,
            status: "Issued"
          }
        ], null, 2);
      }
      return `projectId,beneficiary,landArea,assessedAmount,awardAmount,status
${sampleProjId},Rameshwar Rao,2.1,650000,650000,Issued`;
    }

    if (type === 'compensation') {
      if (format === 'json') {
        return JSON.stringify([
          {
            projectId: sampleProjId,
            beneficiary: "Devendra Kulkarni",
            assessedAmount: 720000,
            approvedAmount: 720000,
            paidAmount: 0,
            bankAccount: "SBIN0001429",
            paymentStatus: "Pending"
          }
        ], null, 2);
      }
      return `projectId,beneficiary,assessedAmount,approvedAmount,paidAmount,bankAccount,paymentStatus
${sampleProjId},Devendra Kulkarni,720000,720000,0,SBIN0001429,Pending`;
    }

    if (type === 'families') {
      if (format === 'json') {
        return JSON.stringify([
          {
            projectId: sampleProjId,
            headOfFamily: "Balasaheb Jadhav",
            village: "Khed-Shivapur",
            district: "Pune",
            state: "Maharashtra",
            members: 5,
            isDisplaced: true,
            compensationEligibility: 550000,
            rrStatus: "In Progress"
          }
        ], null, 2);
      }
      return `projectId,headOfFamily,village,district,state,members,isDisplaced,compensationEligibility,rrStatus
${sampleProjId},Balasaheb Jadhav,Khed-Shivapur,Pune,Maharashtra,5,true,550000,In Progress`;
    }

    // milestones
    if (format === 'json') {
      return JSON.stringify([
        {
          projectId: sampleProjId,
          name: "Section 19 Final Declaration Gazette",
          plannedDate: "2026-11-15",
          owner: "District Collector Office",
          status: "Pending"
        }
      ], null, 2);
    }
    return `projectId,name,plannedDate,owner,status
${sampleProjId},Section 19 Final Declaration Gazette,2026-11-15,District Collector Office,Pending`;
  };

  const handleDownloadSample = (format: 'json' | 'csv') => {
    const data = getSampleData(entityType, format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhoomisetu_${entityType}_template.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${entityType} ${format.toUpperCase()} template`);
  };

  const handleLoadSample = (format: 'json' | 'csv') => {
    const sample = getSampleData(entityType, format);
    setRawText(sample);
    setFileName(`sample_${entityType}.${format}`);
    validateInput(sample, format);
  };

  // CSV to JSON Parser
  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const val = parts[idx] || '';
        if (val === 'true') obj[h] = true;
        else if (val === 'false') obj[h] = false;
        else if (!isNaN(Number(val)) && val !== '') obj[h] = Number(val);
        else obj[h] = val;
      });
      rows.push(obj);
    }
    return rows;
  };

  // Schema Validation & Duplicate Detection Engine
  const validateInput = (content: string, formatHint?: 'json' | 'csv') => {
    setImportCompleted(false);
    setImportSummary(null);

    if (!content.trim()) {
      setParsedRows([]);
      return;
    }

    let records: Record<string, any>[] = [];
    const trimmed = content.trim();

    try {
      if (trimmed.startsWith('[') || trimmed.startsWith('{') || formatHint === 'json') {
        const parsed = JSON.parse(trimmed);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        records = parseCSV(trimmed);
      }
    } catch (e: any) {
      toast.error('Invalid JSON/CSV syntax: ' + e.message);
      setParsedRows([]);
      return;
    }

    if (records.length === 0) {
      toast.warning('No data rows found in input.');
      setParsedRows([]);
      return;
    }

    // Existing identifiers for duplicate checks
    const existingParcelsUlpin = new Set(parcels.map(p => p.ulpin?.toLowerCase()));
    const existingParcelsSurvey = new Set(parcels.map(p => `${p.projectId}-${p.surveyNumber}`.toLowerCase()));
    const existingProjectNames = new Set(projects.map(p => p.name.toLowerCase()));

    const rows: ParsedRow[] = [];

    records.forEach((rec, idx) => {
      let status: 'valid' | 'duplicate' | 'error' = 'valid';
      let errorMessage: string | undefined;

      if (entityType === 'parcels') {
        if (!rec.projectId || !rec.surveyNumber) {
          status = 'error';
          errorMessage = 'Missing mandatory field: projectId or surveyNumber';
        } else if (rec.ulpin && existingParcelsUlpin.has(String(rec.ulpin).toLowerCase())) {
          status = 'duplicate';
          errorMessage = `Duplicate ULPIN detected: ${rec.ulpin}`;
        } else if (existingParcelsSurvey.has(`${rec.projectId}-${rec.surveyNumber}`.toLowerCase())) {
          status = 'duplicate';
          errorMessage = `Parcel with survey ${rec.surveyNumber} already exists in project`;
        }
      } else if (entityType === 'projects') {
        if (!rec.name) {
          status = 'error';
          errorMessage = 'Missing mandatory field: project name';
        } else if (existingProjectNames.has(String(rec.name).toLowerCase())) {
          status = 'duplicate';
          errorMessage = `Project name already exists: "${rec.name}"`;
        }
      } else if (entityType === 'awards') {
        if (!rec.beneficiary || !rec.projectId) {
          status = 'error';
          errorMessage = 'Missing beneficiary or projectId';
        }
      } else if (entityType === 'compensation') {
        if (!rec.beneficiary || !rec.projectId) {
          status = 'error';
          errorMessage = 'Missing beneficiary or projectId';
        }
      } else if (entityType === 'families') {
        if (!rec.headOfFamily || !rec.projectId) {
          status = 'error';
          errorMessage = 'Missing headOfFamily or projectId';
        }
      } else if (entityType === 'milestones') {
        if (!rec.name || !rec.projectId) {
          status = 'error';
          errorMessage = 'Missing milestone name or projectId';
        }
      }

      rows.push({
        rowNumber: idx + 1,
        data: rec,
        status,
        errorMessage,
      });
    });

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      validateInput(text, file.name.endsWith('.json') ? 'json' : 'csv');
    };
    reader.readAsText(file);
  };

  // Commit Import
  const handleCommitImport = () => {
    const validRows = parsedRows.filter(r => r.status === 'valid').map(r => r.data);
    if (validRows.length === 0) {
      toast.warning('No valid records to import.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const res = store.importData(
        entityType,
        validRows,
        {
          id: user?.id || 'USR-001',
          name: user?.name || 'Administrator',
          role: user?.role || 'National Administrator',
        }
      );

      const duplicatesCount = parsedRows.filter(r => r.status === 'duplicate').length;
      const rejectedCount = parsedRows.filter(r => r.status === 'error').length;

      setImportSummary({
        imported: res.imported,
        duplicates: duplicatesCount + res.duplicates,
        rejected: rejectedCount + res.rejected,
      });
      setImportCompleted(true);
      setIsProcessing(false);
      toast.success(`Successfully imported ${res.imported} ${entityType} records!`);
    }, 400);
  };

  // Metrics
  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter(r => r.status === 'duplicate').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <FileUp className="text-primary-600" size={22} />
            Data Import Center
          </h1>
          <p className="text-xs text-surface-500 font-medium mt-1">
            Standardized CSV/JSON bulk ingestion engine for projects, parcels, awards, compensation, and families
          </p>
        </div>

        {/* Template Downloads */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadSample('csv')}
            className="px-3.5 py-2 glass-button-secondary text-xs font-semibold rounded-xl flex items-center gap-1.5"
            title="Download CSV Schema Template"
          >
            <Download size={14} /> CSV Template
          </button>
          <button
            onClick={() => handleDownloadSample('json')}
            className="px-3.5 py-2 glass-button-secondary text-xs font-semibold rounded-xl flex items-center gap-1.5"
            title="Download JSON Schema Template"
          >
            <Download size={14} /> JSON Template
          </button>
        </div>
      </div>

      {/* Entity Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-surface-200/60">
        {(['parcels', 'projects', 'awards', 'compensation', 'families', 'milestones'] as ImportEntityType[]).map(type => (
          <button
            key={type}
            onClick={() => {
              setEntityType(type);
              setParsedRows([]);
              setRawText('');
              setFileName('');
              setImportCompleted(false);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize whitespace-nowrap transition-all ${
              entityType === type
                ? 'bg-primary-600 text-white shadow-xs'
                : 'glass-button-secondary'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Main Grid: Upload & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload / Paste */}
        <div className="glass-panel p-5.5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
              <Database size={16} className="text-primary-600" />
              Upload or Paste Data
            </h2>
            <button
              onClick={() => handleLoadSample('csv')}
              className="text-xs text-primary-600 hover:text-primary-800 font-semibold transition-colors"
            >
              Load Sample Data
            </button>
          </div>

          {/* Drag & Drop File Input */}
          <label className="border-2 border-dashed border-surface-300 hover:border-primary-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/40 hover:bg-white/60">
            <FileUp size={28} className="text-surface-400 mb-2" />
            <span className="text-xs font-semibold text-surface-700">
              {fileName || 'Drop CSV / JSON file here, or browse'}
            </span>
            <span className="text-[10px] text-surface-400 mt-1 font-medium">UTF-8 encoded files supported</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Raw Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-surface-600 font-medium">
              <span>Or Paste Raw CSV / JSON</span>
              <button
                onClick={() => {
                  setRawText('');
                  setParsedRows([]);
                  setFileName('');
                }}
                className="text-surface-400 hover:text-surface-600 text-[11px]"
              >
                Clear
              </button>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={e => {
                setRawText(e.target.value);
                validateInput(e.target.value);
              }}
              placeholder={`Paste CSV or JSON records for ${entityType}...`}
              className="w-full p-3 rounded-lg bg-surface-50 border border-surface-200 text-xs font-mono text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          {/* Validation Summary Card */}
          {parsedRows.length > 0 && (
            <div className="bg-surface-50 rounded-lg p-3 border border-surface-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-surface-800">
                <span>Validation Summary</span>
                <span>{parsedRows.length} Rows</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-1.5 rounded">
                  <span className="font-bold font-mono">{validCount}</span> Valid
                </div>
                <div className="bg-amber-50 text-amber-800 border border-amber-200 p-1.5 rounded">
                  <span className="font-bold font-mono">{duplicateCount}</span> Duplicates
                </div>
                <div className="bg-red-50 text-red-800 border border-red-200 p-1.5 rounded">
                  <span className="font-bold font-mono">{errorCount}</span> Errors
                </div>
              </div>
            </div>
          )}

          {/* Commit Button */}
          <button
            onClick={handleCommitImport}
            disabled={validCount === 0 || isProcessing || importCompleted}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Ingesting Records...
              </>
            ) : importCompleted ? (
              <>
                <CheckCircle2 size={14} /> Import Successfully Committed
              </>
            ) : (
              <>
                <Database size={14} /> Commit {validCount} Records to Store
              </>
            )}
          </button>
        </div>

        {/* Right Column (2 cols wide): Preview & Validation Reporting */}
        <div className="lg:col-span-2 glass-panel p-5.5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-surface-900">Parsed Schema Preview & Validation</h2>
                <p className="text-xs text-surface-500 font-medium">
                  Pre-import schema verification with automatic ULPIN and spatial boundary standardization
                </p>
              </div>
            </div>

            {/* Success Banner if Completed */}
            {importCompleted && importSummary && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 rounded-xl p-3 text-xs flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Batch Ingest Complete!</p>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Imported: <strong>{importSummary.imported}</strong> • Duplicates Skipped: <strong>{importSummary.duplicates}</strong> • Rejected: <strong>{importSummary.rejected}</strong>. Audit event logged.
                  </p>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {parsedRows.length === 0 ? (
              <div className="border border-surface-200/80 rounded-2xl p-14 text-center text-surface-400 text-xs space-y-2 bg-white/40">
                <Layers size={36} className="mx-auto text-primary-400 opacity-60" />
                <p className="font-semibold text-surface-700">No records parsed yet.</p>
                <p className="text-[11px] font-medium text-surface-400">Upload a CSV/JSON file or click "Load Sample Data" to preview records.</p>
              </div>
            ) : (
              <div className="glass-table-container max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="glass-table-header sticky top-0">
                    <tr>
                      <th className="p-3 w-12 text-center font-semibold text-surface-700">Row</th>
                      <th className="p-3 w-28 font-semibold text-surface-700">Validation</th>
                      <th className="p-3 font-semibold text-surface-700">Key Attributes</th>
                      <th className="p-3 font-semibold text-surface-700">Standardized Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200/50">
                    {parsedRows.slice(0, 100).map(row => (
                      <tr key={row.rowNumber} className="hover:bg-primary-500/5 transition-colors">
                        <td className="p-2.5 text-center font-mono text-[11px] text-surface-400">
                          {row.rowNumber}
                        </td>
                        <td className="p-2.5">
                          {row.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              <CheckCircle2 size={10} /> Valid
                            </span>
                          )}
                          {row.status === 'duplicate' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded" title={row.errorMessage}>
                              <AlertTriangle size={10} /> Duplicate
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded" title={row.errorMessage}>
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-surface-800">
                          {entityType === 'parcels' && (
                            <div>
                              <span>Survey: <strong>{row.data.surveyNumber || 'N/A'}</strong></span>
                              <span className="text-surface-400 ml-2">({row.data.village}, {row.data.district})</span>
                              {row.errorMessage && <p className="text-[10px] text-red-600 mt-0.5">{row.errorMessage}</p>}
                            </div>
                          )}
                          {entityType === 'projects' && (
                            <div>
                              <span>{row.data.name || 'Untitled'}</span>
                              <span className="text-surface-400 ml-2 text-[10px]">({row.data.projectType})</span>
                              {row.errorMessage && <p className="text-[10px] text-red-600 mt-0.5">{row.errorMessage}</p>}
                            </div>
                          )}
                          {entityType === 'awards' && (
                            <div>
                              <span>{row.data.beneficiary}</span>
                              <span className="text-surface-400 ml-2 text-[10px]">₹{(row.data.awardAmount || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {entityType === 'compensation' && (
                            <div>
                              <span>{row.data.beneficiary}</span>
                              <span className="text-surface-400 ml-2 text-[10px]">₹{(row.data.assessedAmount || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {entityType === 'families' && (
                            <div>
                              <span>{row.data.headOfFamily}</span>
                              <span className="text-surface-400 ml-2 text-[10px]">{row.data.village} ({row.data.members} members)</span>
                            </div>
                          )}
                          {entityType === 'milestones' && (
                            <div>
                              <span>{row.data.name}</span>
                              <span className="text-surface-400 ml-2 text-[10px]">{row.data.plannedDate}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-surface-500 truncate max-w-xs">
                          {JSON.stringify(row.data)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-surface-50 p-3 rounded-lg border border-surface-200 text-[11px] text-surface-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              Standardized mapping transforms incoming schemas into state-neutral BhoomiSetu models.
            </span>
            <span>Batch Capacity: up to 10,000 records/session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
