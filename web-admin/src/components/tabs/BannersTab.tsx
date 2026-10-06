'use client';

import React from 'react';
import { ImageIcon, Trash2 } from 'lucide-react';
import { PromotionalBanner } from '../../types/admin.types';
import { resolveImageUrl } from '@/utils/api';

interface BannersTabProps {
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
      {/* Left Column: Banners List */}
      <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-emerald-400" /> Promotional Festive Banners
        </h2>

        <div className="space-y-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex gap-4 p-4 border border-slate-800/80 rounded-2xl items-center bg-slate-950/40"
            >
              {b.kind === 'promo' ? (
                <div className="w-24 h-16 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xs font-bold px-2 text-center">
                  Promo card
                </div>
              ) : (
                <img
                  src={resolveImageUrl(b.image_url)}
                  alt={b.title}
                  className="w-24 h-16 object-cover rounded-lg bg-slate-900 border border-slate-800"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-200">{b.title}</h4>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {b.kind || 'image'}
                  </span>
                </div>
                {b.subtitle ? <p className="text-xs text-slate-400 mt-1">{b.subtitle}</p> : null}
                <p className="text-xs text-slate-500 mt-1">Deep Link: {b.action_link || 'None'}</p>
              </div>
              <button
                onClick={() => handleDeleteBanner(b.id)}
                className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {banners.length === 0 && (
            <p className="text-sm text-slate-500 italic text-center py-6">No campaign banners added yet.</p>
          )}
        </div>
      </section>

      {/* Right Column: Add Banner Form */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">➕ Publish New Campaign</h3>

        <form onSubmit={handleAddBanner} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Banner Type</label>
            <select
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={bannerKind}
              onChange={(e) => setBannerKind(e.target.value as 'image' | 'promo')}
            >
              <option value="image">Image banner</option>
              <option value="promo">Promo text card (orange)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Banner Title</label>
            <input
              type="text"
              placeholder="e.g. MONTHLY SAVINGS SALE"
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
            />
          </div>

          {bannerKind === 'promo' ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Promo Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Up to ₹500 off"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Promo Body</label>
                <input
                  type="text"
                  placeholder="e.g. on your full monthly basket"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={bannerBody}
                  onChange={(e) => setBannerBody(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">CTA Label</label>
                <input
                  type="text"
                  placeholder="e.g. Grab deals"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={bannerCta}
                  onChange={(e) => setBannerCta(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Image URL</label>
              <input
                type="text"
                placeholder="e.g. https://images.unsplash.com/..."
                className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Action Deep Link</label>
            <input
              type="text"
              placeholder="e.g. deals or CategoryProducts?category=Oils & Ghee"
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 uppercase font-semibold self-center">Presets:</span>
              <button
                type="button"
                onClick={() => setBannerLink('deals')}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 hover:border-emerald-500 cursor-pointer transition-colors"
              >
                ⚡ Deals
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('categories')}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-teal-400 hover:border-teal-500 cursor-pointer transition-colors"
              >
                🏷️ Categories
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('CategoryProducts?category=Atta & Rice')}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-amber-400 hover:border-amber-500 cursor-pointer transition-colors"
              >
                🌾 Atta & Rice
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('CategoryProducts?category=Oils & Ghee')}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-amber-400 hover:border-amber-500 cursor-pointer transition-colors"
              >
                🫒 Oils & Ghee
              </button>
              <button
                type="button"
                onClick={() => setBannerLink('OneClickCart')}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-purple-400 hover:border-purple-500 cursor-pointer transition-colors"
              >
                🛒 1-Click Cart
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all mt-4 cursor-pointer"
          >
            Publish Campaign Banner
          </button>
        </form>
      </section>
    </div>
  );
}
