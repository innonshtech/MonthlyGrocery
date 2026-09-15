'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Layers,
  Camera,
  Tag,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

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
  handleExcelUpload,
}: BulkLoaderTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-teal-950/30 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Bulk SKU & Catalog Loader</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                v2.0 · 36 Columns
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Import thousands of products in one go with full support for multi-angle photo carousels, video demos,
              pack size variants (1-unit, 2-unit, 3-unit, 4-unit), wholesaler pricing, barcodes, and FSSAI compliance specs.
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" /> Download Sample Template (.xlsx)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Form & Report */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" /> Upload Spreadsheet
              </h3>
              <span className="text-[11px] text-slate-500">supports .xlsx, .xls</span>
            </div>

            <form onSubmit={handleExcelUpload} className="space-y-4">
              <div className="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all bg-slate-950/40 cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                  {excelFile ? excelFile.name : 'Choose Excel File (.xlsx)'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Drag and drop or browse from computer</p>
              </div>

              {excelError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{excelError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingExcel || !excelFile}
                className={`w-full h-11 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs ${
                  excelFile
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/15'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {uploadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Bulk Import'}
              </button>
            </form>

            {excelReport && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Import Summary
                  </span>
                  <span>{excelReport.rows_processed} Rows</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Processed</p>
                    <p className="text-base font-bold text-slate-200">{excelReport.rows_processed}</p>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Created</p>
                    <p className="text-base font-bold text-emerald-400">{excelReport.created}</p>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Updated</p>
                    <p className="text-base font-bold text-teal-400">{excelReport.updated}</p>
                  </div>
                </div>

                {Array.isArray(excelReport.errors) && excelReport.errors.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold text-amber-400">Warnings / Row Issues:</p>
                    <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-slate-400">
                      {excelReport.errors.map((err: any, i: number) => (
                        <div key={i} className="p-1.5 bg-slate-950/60 rounded border border-slate-800/60 flex items-start gap-1">
                          <span className="text-amber-500 font-mono">Row {err.row}:</span>
                          <span>{err.error || 'Failed'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Visual Guide & Field Reference */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Info className="w-4 h-4 text-teal-400" />
              <span>How To Prepare Your Spreadsheet (Field Reference)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Card 1: 1-Unit vs Multi-Unit Variants */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Layers className="w-4 h-4" /> 1-Unit vs Multi-Unit Packs
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every pack size is <strong>1 row</strong>. For products with multiple sizes (e.g. 500ml, 1L, 5L), fill the <strong>exact same <code className="text-emerald-300">family_key</code></strong> on all rows. The customer app will automatically render interactive size buttons.
                </p>
              </div>

              {/* Card 2: Multi-Angle Photo Carousels */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <Camera className="w-4 h-4" /> Multi-Angle Photos & Video
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Use <code className="text-blue-300">primary_image_url</code> (Front photo), <code className="text-blue-300">image_url_2</code> (Back/Nutrition), <code className="text-blue-300">image_url_3</code> (Side), and <code className="text-blue-300">video_url</code>. The app renders a swipeable gallery.
                </p>
              </div>

              {/* Card 3: Pricing Tiers */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Tag className="w-4 h-4" /> Pricing & Wholesale Margin
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <code className="text-amber-300">mrp</code> is the printed pack price. <code className="text-amber-300">price</code> is the discounted customer price. <code className="text-amber-300">wholesaler_price</code> tracks merchant procurement cost.
                </p>
              </div>

              {/* Card 4: Compliance & Specs */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" /> Specifications & Badges
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Add <code className="text-purple-300">fssai_license</code>, <code className="text-purple-300">shelf_life</code>, <code className="text-purple-300">ingredients</code>, and flags (<code className="text-purple-300">is_veg</code>, <code className="text-purple-300">best_seller</code>) for rich product detail pages.
                </p>
              </div>
            </div>

            {/* Quick Column Checklist */}
            <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Supported Columns Checklist (36)
                </span>
                <span className="text-[10px] text-emerald-400">All normalized automatically</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 leading-relaxed break-words">
                sku, name, brand, company, family_key, primary_category, secondary_category, quantity_value, quantity_unit, unit, mrp, price, wholesaler_price, gst, stock, city, primary_image_url, image_url_2, image_url_3, image_url_4, additional_images, video_url, short_description, description, ingredients, shelf_life, storage_instructions, fssai_license, country_of_origin, barcode, is_veg, featured, todays_deal, best_seller, search_keywords, available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
