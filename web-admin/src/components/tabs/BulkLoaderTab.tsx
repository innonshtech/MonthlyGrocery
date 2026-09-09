'use client';

import React from 'react';
import { FileSpreadsheet, Download, Upload, Loader2, CheckCircle } from 'lucide-react';

interface BulkLoaderTabProps {
  excelFile: File | null;
  setExcelFile: (file: File | null) => void;
  uploadingExcel: boolean;
  excelReport: any;
  excelError: string;
  handleDownloadTemplate: () => void;
  handleExcelUpload: (e: React.FormEvent) => void;
}

export default function BulkLoaderTab({
  excelFile,
  setExcelFile,
  uploadingExcel,
  excelReport,
  excelError,
  handleDownloadTemplate,
  handleExcelUpload
}: BulkLoaderTabProps) {
  return (
    <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl max-w-md shadow-xl">
      <div className="flex items-center gap-2.5 mb-6">
        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Bulk Inventory Loader</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-200">1. Download Template Sheet</h3>
          <p className="text-xs text-slate-500">
            Download the standard layout template containing configurations schema.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="w-full py-2.5 border-2 border-dashed border-slate-800 hover:border-emerald-500 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download template.xlsx
          </button>
        </div>

        <hr className="border-slate-850" />

        <form onSubmit={handleExcelUpload} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200">2. Upload Spreadsheet</h3>
          <p className="text-xs text-slate-500">Select the updated spreadsheet file containing SKUs to upload.</p>

          <div className="relative border-2 border-dashed border-slate-850 hover:border-slate-700 rounded-2xl p-6 text-center cursor-pointer">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">
              {excelFile ? excelFile.name : 'Choose Excel File'}
            </p>
            <p className="text-xs text-slate-500 mt-1">supports .xlsx up to 5MB</p>
          </div>

          {excelError && (
            <div className="p-3 bg-red-500/10 border border-red-500/15 text-xs text-red-400 rounded-xl">
              {excelError}
            </div>
          )}

          <button
            type="submit"
            disabled={uploadingExcel || !excelFile}
            className={`w-full h-11 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              excelFile
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {uploadingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Bulk Import'}
          </button>
        </form>

        {excelReport && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-4 h-4" /> Bulk Import Finished
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/10">
                <p className="text-slate-500">Processed</p>
                <p className="text-base font-bold text-slate-200">{excelReport.rows_processed}</p>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/10">
                <p className="text-slate-500">Created</p>
                <p className="text-base font-bold text-emerald-400">{excelReport.created}</p>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/10">
                <p className="text-slate-500">Updated</p>
                <p className="text-base font-bold text-blue-400">{excelReport.updated}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
