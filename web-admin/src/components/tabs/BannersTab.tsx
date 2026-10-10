'use client';

import React, { useState } from 'react';
import { ImageIcon, Trash2, Upload, Loader2, CheckCircle2, X } from 'lucide-react';
import { PromotionalBanner } from '../../types/admin.types';
import { API_BASE, resolveImageUrl } from '@/utils/api';
import { compressImageForUpload } from '@/utils/imageCompressor';

interface BannersTabProps {
  token?: string | null;
  banners: PromotionalBanner[];
  bannerTitle: string;
  setBannerTitle: (val: string) => void;
  bannerImage: string;
  setBannerImage: (val: string) => void;
  bannerLink: string;
  setBannerLink: (val: string) => void;
  bannerKind: 'image' | 'promo';
  setBannerKind: (val: 'image' | 'promo') => void;
  bannerSubtitle: string;
  setBannerSubtitle: (val: string) => void;
  bannerBody: string;
  setBannerBody: (val: string) => void;
  bannerCta: string;
  setBannerCta: (val: string) => void;
  handleAddBanner: (e: React.FormEvent) => void;
  handleDeleteBanner: (id: string) => void;
}

export default function BannersTab({
  token,
  banners,
  bannerTitle,
  setBannerTitle,
  bannerImage,
  setBannerImage,
  bannerLink,
  setBannerLink,
  bannerKind,
  setBannerKind,
  bannerSubtitle,
  setBannerSubtitle,
  bannerBody,
  setBannerBody,
  bannerCta,
  setBannerCta,
  handleAddBanner,
  handleDeleteBanner
}: BannersTabProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localFilePreview, setLocalFilePreview] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);
    setLocalFilePreview(URL.createObjectURL(file));

    try {
      const optimizedFile = await compressImageForUpload(file, 1600, 900, 900 * 1024);
      const freshToken = token || (typeof window !== 'undefined' ? localStorage.getItem('@admin_token') : null);
      const formData = new FormData();
      formData.append('image', optimizedFile);
      formData.append('folder', 'banners');

      let uploadRes: Response;
      try {
        uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}) },
          body: formData,
        });

        if (!uploadRes.ok && uploadRes.status === 404) {
          uploadRes = await fetch(`${API_BASE}/products/upload-image`, {
            method: 'POST',
            headers: { ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}) },
            body: formData,
          });
        }
      } catch {
        uploadRes = await fetch(`${API_BASE}/products/upload-image`, {
          method: 'POST',
          headers: { ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}) },
          body: formData,
        });
      }

      const text = await uploadRes.text();
      let uploadData: any = {};
      if (text) {
        try {
          uploadData = JSON.parse(text);
        } catch {
          throw new Error(`Upload server error (${uploadRes.status}): ${text.slice(0, 150)}`);
        }
      }

      if (!uploadRes.ok || !uploadData.image_url) {
        throw new Error(uploadData.error || `Upload failed with status ${uploadRes.status}`);
      }

      setBannerImage(uploadData.image_url);
    } catch (err: any) {
      console.error('Banner upload failed:', err);
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleClearImage = () => {
    setBannerImage('');
    setLocalFilePreview(null);
    setUploadError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
      {/* Left Column: Banners List */}
      <section className="lg:col-span-2 bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-xl">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Promotional Festive Banners ({banners.length})
        </h2>

        <div className="space-y-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex gap-4 p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl items-center bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              {b.kind === 'promo' ? (
                <div className="w-28 h-18 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-800 dark:text-amber-300 text-xs font-bold px-2 text-center">
                  Promo Card
                </div>
              ) : (
                <img
                  src={resolveImageUrl(b.image_url)}
                  alt={b.title}
                  className="w-28 h-18 object-cover rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{b.title}</h4>
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-300/50 dark:border-slate-700">
                    {b.kind || 'image'}
                  </span>
                </div>
                {b.subtitle ? <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">{b.subtitle}</p> : null}
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Deep Link: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{b.action_link || 'None'}</span>
                </p>
              </div>
              <button
                onClick={() => handleDeleteBanner(b.id)}
                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                title="Delete this banner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-transparent">
              <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">No campaign banners added yet.</p>
              <p className="text-xs text-slate-500 mt-0.5">Use the form on the right to upload a banner from your laptop.</p>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Add Banner Form */}
      <section className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-xl h-max">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          ➕ Publish New Campaign
        </h3>

        <form onSubmit={handleAddBanner} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Banner Type
            </label>
            <select
              className="w-full mt-1.5 h-11 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-500 rounded-xl text-xs outline-none cursor-pointer font-medium"
              value={bannerKind}
              onChange={(e) => setBannerKind(e.target.value as 'image' | 'promo')}
            >
              <option value="image">Image banner (Photo from Laptop)</option>
              <option value="promo">Promo text card (orange)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Banner Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DIWALI DHAMAKA SALE"
              className="w-full mt-1.5 h-11 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-500 rounded-xl text-xs outline-none font-medium"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
            />
          </div>

          {bannerKind === 'promo' ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Promo Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Up to ₹500 off"
                  className="w-full mt-1.5 h-11 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-500 rounded-xl text-xs outline-none font-medium"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Promo Body
                </label>
                <input
                  type="text"
                  placeholder="e.g. on your full monthly basket"
                  className="w-full mt-1.5 h-11 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-500 rounded-xl text-xs outline-none font-medium"
                  value={bannerBody}
                  onChange={(e) => setBannerBody(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grab Deals"
                  className="w-full mt-1.5 h-11 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-500 rounded-xl text-xs outline-none font-medium"
                  value={bannerCta}
                  onChange={(e) => setBannerCta(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                Banner Graphic / Photo *
              </label>

              {/* DIRECT FILE UPLOAD FROM LAPTOP */}
              <label className="block cursor-pointer">
                <div className={`w-full py-4 px-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
                  bannerImage || localFilePreview
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-300 hover:border-emerald-500 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100/70'
                }`}>
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Uploading banner from laptop...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Click to Choose Banner from Laptop
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          PNG, JPG, WebP (Landscape recommended)
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={uploadingImage}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{uploadError}</p>
              )}

              {/* LIVE BANNER PREVIEW */}
              {(bannerImage || localFilePreview) && (
                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 overflow-hidden p-2">
                  <div className="flex items-center justify-between pb-1.5 px-1">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Banner Ready to Publish
                    </span>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="text-xs text-red-500 hover:text-red-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <img
                    src={localFilePreview || resolveImageUrl(bannerImage)}
                    alt="Banner Preview"
                    className="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner"
                  />
                </div>
              )}

              {/* OPTIONAL DIRECT URL INPUT */}
              <div className="pt-1">
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                    Or paste Image URL manually
                  </summary>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="w-full mt-1.5 h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs outline-none"
                    value={bannerImage}
                    onChange={(e) => {
                      setBannerImage(e.target.value);
                      setLocalFilePreview(null);
                    }}
                  />
                </details>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Action Deep Link
            </label>
            <input
              type="text"
              placeholder="e.g. deals or CategoryProducts?category=Oils & Ghee"
              className="w-full mt-1.5 h-11 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-500 rounded-xl text-xs outline-none font-medium font-mono"
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold self-center">Presets:</span>
              <button
                type="button"
                onClick={() => setBannerLink('deals')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold cursor-pointer transition-colors"
              >
                ⚡ Deals
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('categories')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-semibold cursor-pointer transition-colors"
              >
                🏷️ Categories
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('CategoryProducts?category=Atta & Rice')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-semibold cursor-pointer transition-colors"
              >
                🌾 Atta & Rice
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('CategoryProducts?category=Oils & Ghee')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-semibold cursor-pointer transition-colors"
              >
                🫒 Oils & Ghee
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('OneClickCart')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300 font-semibold cursor-pointer transition-colors"
              >
                🛒 1-Click Cart
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploadingImage || (bannerKind === 'image' && !bannerImage)}
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading Banner...</span>
              </>
            ) : (
              <span>Publish Campaign Banner</span>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
