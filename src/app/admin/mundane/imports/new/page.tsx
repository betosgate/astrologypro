"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const IMPORT_TYPES = [
  { value: "csv_events", label: "Events", description: "Import historical and forecast events" },
  { value: "csv_entities", label: "Entities", description: "Import countries, cities, institutions" },
  { value: "csv_leaders", label: "Leaders", description: "Import political and public figures" },
  { value: "csv_forecasts", label: "Forecasts", description: "Import forecast records" },
] as const;

const DB_FIELDS: Record<string, { field: string; required: boolean }[]> = {
  csv_events: [
    { field: "title", required: true },
    { field: "event_date", required: true },
    { field: "location", required: false },
    { field: "event_type", required: false },
  ],
  csv_entities: [
    { field: "name", required: true },
    { field: "type", required: false },
    { field: "region", required: false },
  ],
  csv_leaders: [
    { field: "name", required: true },
    { field: "title", required: false },
    { field: "entity_id", required: false },
    { field: "birth_date", required: false },
  ],
  csv_forecasts: [
    { field: "title", required: true },
    { field: "forecast_period_start", required: true },
    { field: "forecast_period_end", required: false },
    { field: "entity_id", required: false },
    { field: "content", required: false },
  ],
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "select" | "preview" | "results";

type PreviewRow = Record<string, string>;

type ImportRecord = {
  id: string;
  import_type: string;
  file_name: string;
  status: string;
  total_rows: number;
  imported_rows: number;
  error_rows: number;
  detected_columns: string[];
  raw_preview: PreviewRow[];
};

type ProcessResult = {
  id: string;
  status: string;
  imported_rows: number;
  error_rows: number;
  error_details: Array<{ row: number; error: string }>;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminMundaneImportNewPage() {
  const [step, setStep] = useState<Step>("select");
  const [importType, setImportType] = useState<string>("");
  const [csvText, setCsvText] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [processError, setProcessError] = useState("");

  const [importRecord, setImportRecord] = useState<ImportRecord | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ProcessResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Step 1: Upload ───────────────────────────────────────────────────────────
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");
    if (!importType) { setUploadError("Select an import type."); return; }
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadError("Select a CSV file."); return; }

    setUploading(true);
    try {
      const text = await file.text();
      setCsvText(text);

      const fd = new FormData();
      fd.append("import_type", importType);
      fd.append("file", file);

      const res = await fetch("/api/mundane/imports", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) {
        setImportRecord(json as ImportRecord);
        // Default mapping: exact match on field name
        const mapping: Record<string, string> = {};
        const fields = DB_FIELDS[importType] ?? [];
        for (const col of json.detected_columns as string[]) {
          const matched = fields.find((f) => f.field.toLowerCase() === col.toLowerCase());
          if (matched) mapping[col] = matched.field;
        }
        setColumnMapping(mapping);
        setStep("preview");
      } else {
        setUploadError(json.detail ?? json.error ?? "Upload failed.");
      }
    } catch {
      setUploadError("Network error — please try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Step 2: Process ──────────────────────────────────────────────────────────
  async function handleProcess() {
    if (!importRecord) return;
    setProcessError("");
    setProcessing(true);
    try {
      const res = await fetch(`/api/mundane/imports/${importRecord.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column_mapping: columnMapping, csv_text: csvText }),
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json as ProcessResult);
        setStep("results");
      } else {
        setProcessError(json.detail ?? json.error ?? "Processing failed.");
      }
    } catch {
      setProcessError("Network error — please try again.");
    } finally {
      setProcessing(false);
    }
  }

  const dbFields = DB_FIELDS[importType] ?? [];
  const detectedColumns = importRecord?.detected_columns ?? [];
  const preview = importRecord?.raw_preview ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mundane/imports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Imports
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="size-6 text-cyan-500" />
          New CSV Import
        </h1>
        <p className="text-muted-foreground mt-1">Upload a CSV file to import data into the mundane registry.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(["select", "preview", "results"] as Step[]).map((s, i) => (
          <span
            key={s}
            className={`flex items-center gap-1 ${
              step === s ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            <span
              className={`size-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className="capitalize">{s === "select" ? "Upload" : s === "preview" ? "Map Columns" : "Results"}</span>
            {i < 2 && <span className="text-muted-foreground/50 mx-1">→</span>}
          </span>
        ))}
      </div>

      {/* ── STEP 1: Select type + upload ─────────────────────────────────────── */}
      {step === "select" && (
        <form onSubmit={handleUpload} className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Import Type</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {IMPORT_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImportType(opt.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    importType === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Click to select a CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">Max 5 MB · .csv only</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={() => setUploadError("")}
                />
              </div>
              {fileRef.current?.files?.[0] && (
                <p className="text-xs text-muted-foreground">
                  Selected: <span className="font-medium">{fileRef.current.files[0].name}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {uploadError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              {uploadError}
            </p>
          )}

          <Button type="submit" disabled={uploading}>
            {uploading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {uploading ? "Uploading…" : "Upload & Preview"}
          </Button>
        </form>
      )}

      {/* ── STEP 2: Column mapping + preview ─────────────────────────────────── */}
      {step === "preview" && importRecord && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{importRecord.file_name}</span>
            <span>·</span>
            <span>{importRecord.total_rows} rows detected</span>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Column Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Map each CSV column to the target database field. Required fields are marked with *.
              </p>
              <div className="space-y-2">
                {detectedColumns.map((col) => (
                  <div key={col} className="flex items-center gap-3">
                    <div className="w-40 shrink-0">
                      <Badge variant="outline" className="text-xs font-mono max-w-full truncate">
                        {col}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">→</span>
                    <select
                      value={columnMapping[col] ?? ""}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({
                          ...prev,
                          [col]: e.target.value,
                        }))
                      }
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">(skip)</option>
                      {dbFields.map((f) => (
                        <option key={f.field} value={f.field}>
                          {f.field}{f.required ? " *" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview table */}
          {preview.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Data Preview{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (first {preview.length} rows)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {detectedColumns.map((col) => (
                          <th
                            key={col}
                            className="text-left pb-2 pr-3 font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {preview.map((row, i) => (
                        <tr key={i}>
                          {detectedColumns.map((col) => (
                            <td
                              key={col}
                              className="py-1.5 pr-3 max-w-[140px] truncate text-muted-foreground"
                            >
                              {row[col] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {processError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              {processError}
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={handleProcess} disabled={processing}>
              {processing && <Loader2 className="mr-2 size-4 animate-spin" />}
              {processing ? "Importing…" : "Confirm & Import"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setStep("select"); setImportRecord(null); setCsvText(""); }}
              disabled={processing}
            >
              Start Over
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Results ──────────────────────────────────────────────────── */}
      {step === "results" && result && (
        <div className="space-y-5">
          <Card
            className={
              result.status === "completed"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }
          >
            <CardContent className="pt-5 pb-5 flex items-start gap-3">
              {result.status === "completed" ? (
                <CheckCircle2 className="size-6 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="size-6 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {result.status === "completed"
                    ? "Import completed"
                    : "Import finished with errors"}
                </p>
                <p className="text-sm mt-1">
                  <span className="text-green-700 font-medium">{result.imported_rows} rows</span>{" "}
                  imported successfully
                  {result.error_rows > 0 && (
                    <>
                      {" · "}
                      <span className="text-red-600 font-medium">{result.error_rows} rows</span>{" "}
                      failed
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {result.error_details && result.error_details.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-red-700">Row Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.error_details.map((e, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="shrink-0 font-medium text-muted-foreground w-12">
                        Row {e.row}
                      </span>
                      <span className="text-red-600">{e.error}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button asChild>
              <Link href="/admin/mundane/imports">Back to Imports</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("select");
                setImportRecord(null);
                setCsvText("");
                setResult(null);
                setColumnMapping({});
                setImportType("");
              }}
            >
              New Import
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
