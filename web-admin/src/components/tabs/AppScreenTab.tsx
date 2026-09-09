'use client';

import React, { useState } from 'react';
import { Home } from 'lucide-react';
import {
  HomeScreenConfig,
  SearchScreenConfig,
  CategoriesScreenConfig,
  CategoryProductsScreenConfig,
  ProductDetailScreenConfig,
  CartScreenConfig,
  OffersCouponsScreenConfig
} from '../../types/admin.types';
import { apiFetch } from '../../utils/api';

interface AppScreenTabProps {
  token: string | null;
  homeScreenDraft: HomeScreenConfig | null;
  setHomeScreenDraft: React.Dispatch<React.SetStateAction<HomeScreenConfig | null>>;
  searchScreenDraft: SearchScreenConfig | null;
  setSearchScreenDraft: React.Dispatch<React.SetStateAction<SearchScreenConfig | null>>;
  categoriesScreenDraft: CategoriesScreenConfig | null;
  setCategoriesScreenDraft: React.Dispatch<React.SetStateAction<CategoriesScreenConfig | null>>;
  categoryProductsDraft: CategoryProductsScreenConfig | null;
  setCategoryProductsDraft: React.Dispatch<React.SetStateAction<CategoryProductsScreenConfig | null>>;
  productDetailDraft: ProductDetailScreenConfig | null;
  setProductDetailDraft: React.Dispatch<React.SetStateAction<ProductDetailScreenConfig | null>>;
  cartScreenDraft: CartScreenConfig | null;
  setCartScreenDraft: React.Dispatch<React.SetStateAction<CartScreenConfig | null>>;
  offersCouponsDraft: OffersCouponsScreenConfig | null;
  setOffersCouponsDraft: React.Dispatch<React.SetStateAction<OffersCouponsScreenConfig | null>>;
}

export default function AppScreenTab({
  token,
  homeScreenDraft,
  setHomeScreenDraft,
  searchScreenDraft,
  setSearchScreenDraft,
  categoriesScreenDraft,
  setCategoriesScreenDraft,
  categoryProductsDraft,
  setCategoryProductsDraft,
  productDetailDraft,
  setProductDetailDraft,
  cartScreenDraft,
  setCartScreenDraft,
  offersCouponsDraft,
  setOffersCouponsDraft
}: AppScreenTabProps) {
  const [homeScreenSaving, setHomeScreenSaving] = useState(false);
  const [searchScreenSaving, setSearchScreenSaving] = useState(false);
  const [categoriesScreenSaving, setCategoriesScreenSaving] = useState(false);
  const [categoryProductsSaving, setCategoryProductsSaving] = useState(false);
  const [productDetailSaving, setProductDetailSaving] = useState(false);
  const [cartScreenSaving, setCartScreenSaving] = useState(false);
  const [offersCouponsSaving, setOffersCouponsSaving] = useState(false);

  const handleSaveHomeScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !homeScreenDraft) return;
    setHomeScreenSaving(true);
    try {
      const data = await apiFetch('/admin/home', {
        method: 'POST',
        body: JSON.stringify(homeScreenDraft)
      });
      setHomeScreenDraft(data.home);
      alert('Home screen copy updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving home screen copy');
    } finally {
      setHomeScreenSaving(false);
    }
  };

  const updateHomeField = (key: keyof HomeScreenConfig, value: string) => {
    if (!homeScreenDraft) return;
    setHomeScreenDraft({ ...homeScreenDraft, [key]: value });
  };

  const handleSaveSearchScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !searchScreenDraft) return;
    setSearchScreenSaving(true);
    try {
      const data = await apiFetch('/admin/search-screen', {
        method: 'POST',
        body: JSON.stringify(searchScreenDraft)
      });
      setSearchScreenDraft(data.search);
      alert('Search screen copy updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving search screen copy');
    } finally {
      setSearchScreenSaving(false);
    }
  };

  const updateSearchField = (key: keyof SearchScreenConfig, value: string) => {
    if (!searchScreenDraft) return;
    setSearchScreenDraft({ ...searchScreenDraft, [key]: value });
  };

  const handleSaveCategoriesScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !categoriesScreenDraft) return;
    setCategoriesScreenSaving(true);
    try {
      const data = await apiFetch('/admin/categories-screen', {
        method: 'POST',
        body: JSON.stringify(categoriesScreenDraft)
      });
      setCategoriesScreenDraft(data.categories);
      alert('Categories screen copy updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving categories screen copy');
    } finally {
      setCategoriesScreenSaving(false);
    }
  };

  const updateCategoriesField = (key: keyof CategoriesScreenConfig, value: string) => {
    if (!categoriesScreenDraft) return;
    setCategoriesScreenDraft({ ...categoriesScreenDraft, [key]: value });
  };

  const handleSaveCategoryProducts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !categoryProductsDraft) return;
    setCategoryProductsSaving(true);
    try {
      const data = await apiFetch('/admin/category-products-screen', {
        method: 'POST',
        body: JSON.stringify(categoryProductsDraft)
      });
      setCategoryProductsDraft(data.category_products);
      alert('Product list screen copy updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving product list screen copy');
    } finally {
      setCategoryProductsSaving(false);
    }
  };

  const updateCategoryProductsField = (key: keyof CategoryProductsScreenConfig, value: string) => {
    if (!categoryProductsDraft) return;
    setCategoryProductsDraft({ ...categoryProductsDraft, [key]: value });
  };

  const handleSaveProductDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !productDetailDraft) return;
    setProductDetailSaving(true);
    try {
      const data = await apiFetch('/admin/product-detail-screen', {
        method: 'POST',
        body: JSON.stringify(productDetailDraft)
      });
      setProductDetailDraft(data.product_detail);
      alert('Product detail screen copy updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving product detail copy');
    } finally {
      setProductDetailSaving(false);
    }
  };

  const updateProductDetailField = (key: keyof ProductDetailScreenConfig, value: string) => {
    if (!productDetailDraft) return;
    setProductDetailDraft({ ...productDetailDraft, [key]: value });
  };

  const handleSaveCartScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cartScreenDraft) return;
    setCartScreenSaving(true);
    try {
      const data = await apiFetch('/admin/cart-screen', {
        method: 'POST',
        body: JSON.stringify(cartScreenDraft)
      });
      setCartScreenDraft(data.cart);
      alert('Cart screen copy updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving cart screen copy');
    } finally {
      setCartScreenSaving(false);
    }
  };

  const updateCartScreenField = (key: keyof CartScreenConfig, value: string) => {
    if (!cartScreenDraft) return;
    setCartScreenDraft({ ...cartScreenDraft, [key]: value });
  };

  const handleSaveOffersCouponsScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !offersCouponsDraft) return;
    setOffersCouponsSaving(true);
    try {
      const data = await apiFetch('/admin/offers-coupons-screen', {
        method: 'POST',
        body: JSON.stringify(offersCouponsDraft)
      });
      setOffersCouponsDraft(data.offers_coupons);
      alert('Offers & coupons screen copy updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving offers & coupons screen copy');
    } finally {
      setOffersCouponsSaving(false);
    }
  };

  const updateOffersCouponsField = (key: keyof OffersCouponsScreenConfig, value: string) => {
    if (!offersCouponsDraft) return;
    setOffersCouponsDraft({ ...offersCouponsDraft, [key]: value });
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. Home Screen Copy */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Home className="w-5 h-5 text-emerald-400" /> Home Screen Copy (B1)
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Labels and messages shown on the customer app home screen. Changes apply immediately after save.
        </p>

        {!homeScreenDraft ? (
          <p className="text-slate-400 text-sm">Loading home screen config…</p>
        ) : (
          <form onSubmit={handleSaveHomeScreen} className="space-y-6">
            {(
              [
                ['delivering_label', 'Delivering label'],
                ['location_prefix', 'Location prefix'],
                ['choose_location_label', 'Choose location label'],
                ['delivery_pill_text', 'Delivery pill text'],
                ['search_placeholder', 'Search placeholder'],
                ['mmg_label', 'MMG label'],
                ['mmg_title', 'MMG title'],
                ['mmg_subtitle', 'MMG subtitle'],
                ['categories_title', 'Categories title'],
                ['categories_see_all', 'Categories see all'],
                ['deals_title', 'Deals title'],
                ['deals_see_all', 'Deals see all'],
                ['loading_deals_label', 'Loading deals label'],
                ['empty_deals_label', 'Empty deals label'],
                ['location_required_deals_label', 'Location required (deals)'],
                ['reorder_title', 'Reorder title'],
                ['reorder_subtitle_template', 'Reorder subtitle template ({count}, {total})'],
                ['reorder_cta_label', 'Reorder CTA'],
                ['first_basket_title', 'First basket title'],
                ['first_basket_subtitle', 'First basket subtitle'],
                ['first_basket_cta_label', 'First basket CTA'],
                ['load_error_message', 'Load error message'],
                ['retry_label', 'Retry button label']
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={homeScreenDraft[key]}
                  onChange={(e) => updateHomeField(key, e.target.value)}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={homeScreenSaving}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {homeScreenSaving ? 'Saving…' : 'Save Home Screen Copy'}
            </button>
          </form>
        )}
      </section>

      {/* 2. Search Screen Copy */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2">Search Screen Copy (B2)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Labels for the customer search screen. Popular chips use live categories from the catalog.
        </p>

        {!searchScreenDraft ? (
          <p className="text-slate-400 text-sm">Loading search screen config…</p>
        ) : (
          <form onSubmit={handleSaveSearchScreen} className="space-y-6">
            {(
              [
                ['search_placeholder', 'Search placeholder'],
                ['popular_searches_label', 'Popular searches label'],
                ['products_section_label', 'Products section label'],
                ['empty_title_template', 'Empty title template ({query})'],
                ['empty_subtitle', 'Empty subtitle'],
                ['location_required_message', 'Location required message'],
                ['choose_location_label', 'Choose location label'],
                ['load_error_message', 'Load error message'],
                ['retry_label', 'Retry button label']
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={searchScreenDraft[key]}
                  onChange={(e) => updateSearchField(key, e.target.value)}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={searchScreenSaving}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {searchScreenSaving ? 'Saving…' : 'Save Search Screen Copy'}
            </button>
          </form>
        )}
      </section>

      {/* 3. Categories Screen Copy */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2">Categories Screen Copy (B3)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Title, search placeholder, and section labels on the customer categories tab. Category tiles use live catalog data.
        </p>

        {!categoriesScreenDraft ? (
          <p className="text-slate-400 text-sm">Loading categories screen config…</p>
        ) : (
          <form onSubmit={handleSaveCategoriesScreen} className="space-y-6">
            {(
              [
                ['title', 'Screen title'],
                ['search_placeholder', 'Search placeholder'],
                ['section_grocery_label', 'Grocery section label'],
                ['section_snacks_label', 'Snacks section label'],
                ['section_household_label', 'Household section label'],
                ['section_default_label', 'Default section label'],
                ['empty_message', 'Empty search message'],
                ['load_error_message', 'Load error message'],
                ['retry_label', 'Retry button label']
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={categoriesScreenDraft[key]}
                  onChange={(e) => updateCategoriesField(key, e.target.value)}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={categoriesScreenSaving}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {categoriesScreenSaving ? 'Saving…' : 'Save Categories Screen Copy'}
            </button>
          </form>
        )}
      </section>

      {/* 4. Product List Screen Copy */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2">Product List Screen Copy (B4)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Category product grid, sort bar, floating cart, and filter sheet labels. Products load from the catalog API.
        </p>

        {!categoryProductsDraft ? (
          <p className="text-slate-400 text-sm">Loading product list screen config…</p>
        ) : (
          <form onSubmit={handleSaveCategoryProducts} className="space-y-6">
            {(
              [
                ['search_placeholder_template', 'Search placeholder ({category})'],
                ['items_count_template', 'Items count ({category}, {count})'],
                ['sort_label', 'Sort button label'],
                ['sub_category_all_label', 'Sidebar “All” label'],
                ['empty_message', 'Empty products message'],
                ['deals_title', 'Deals screen title'],
                ['location_required_message', 'Location required message'],
                ['choose_location_label', 'Choose location button'],
                ['load_error_message', 'Load error message'],
                ['retry_label', 'Retry button label'],
                ['view_cart_label', 'View cart label'],
                ['cart_item_label', 'Cart — 1 item label'],
                ['cart_items_template', 'Cart items template ({count})'],
                ['add_button_label', 'ADD button label'],
                ['filter_sheet_title', 'Filter sheet title'],
                ['filter_sort_section_label', 'Filter sort section label'],
                ['filter_sort_relevance', 'Sort — Relevance'],
                ['filter_sort_price_low', 'Sort — Price low to high'],
                ['filter_sort_price_high', 'Sort — Price high to low'],
                ['filter_sort_discount', 'Sort — Discount'],
                ['filter_pack_section_label', 'Pack size section label'],
                ['filter_clear_label', 'Clear all button'],
                ['filter_apply_label', 'Apply button']
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={categoryProductsDraft[key]}
                  onChange={(e) => updateCategoryProductsField(key, e.target.value)}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={categoryProductsSaving}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {categoryProductsSaving ? 'Saving…' : 'Save Product List Screen Copy'}
            </button>
          </form>
        )}
      </section>

      {/* 5. Product Detail Screen Copy */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2">Product Detail Screen Copy (C1)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Product detail hero, delivery banner, highlights section, and sticky add-to-cart bar. Product data loads from the catalog API.
        </p>

        {!productDetailDraft ? (
          <p className="text-slate-400 text-sm">Loading product detail screen config…</p>
        ) : (
          <form onSubmit={handleSaveProductDetail} className="space-y-6">
            {(
              [
                ['delivery_window_label', 'Delivery window banner'],
                ['highlights_section_label', 'Highlights section title'],
                ['add_to_cart_label', 'Add to cart button'],
                ['unit_price_suffix_template', 'Unit price suffix ({unit})'],
                ['not_found_message', 'Product not found message'],
                ['location_required_message', 'Location required message'],
                ['choose_location_label', 'Choose location button'],
                ['load_error_message', 'Load error message'],
                ['retry_label', 'Retry button label']
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={productDetailDraft[key]}
                  onChange={(e) => updateProductDetailField(key, e.target.value)}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={productDetailSaving}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {productDetailSaving ? 'Saving…' : 'Save Product Detail Screen Copy'}
            </button>
          </form>
        )}
      </section>

      {/* 6. Cart Screen Copy */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2">Cart Screen Copy (C2)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Cart header, empty state, bill details, min-order banners, and checkout bar. Min order amount comes from server config API.
        </p>

        {!cartScreenDraft ? (
          <p className="text-slate-400 text-sm">Loading cart screen config…</p>
        ) : (
          <form onSubmit={handleSaveCartScreen} className="space-y-6">
            {(
              [
                ['title', 'Screen title'],
                ['cart_item_label', 'Header — 1 item'],
                ['cart_items_template', 'Header items template ({count})'],
                ['empty_title', 'Empty cart title'],
                ['empty_message', 'Empty cart message'],
                ['start_shopping_label', 'Start shopping button'],
                ['reorder_last_month_label', 'Reorder last month link'],
                ['save_basket_label', 'Save basket row'],
                ['apply_coupon_label', 'Apply coupon label'],
                ['coupon_applied_template', 'Coupon applied ({code}, {discount})'],
                ['bill_details_title', 'Bill details title'],
                ['bill_item_total_label', 'Bill — item total (MRP)'],
                ['bill_savings_label', 'Bill — savings label'],
                ['bill_delivery_fee_label', 'Bill — delivery fee label'],
                ['bill_delivery_fee_value', 'Bill — delivery fee value'],
                ['bill_coupon_discount_label', 'Bill — coupon discount label'],
                ['bill_to_pay_label', 'Bill — to pay label'],
                ['sticky_to_pay_label', 'Sticky bar — TO PAY label'],
                ['proceed_to_pay_label', 'Proceed to pay button'],
                ['below_min_title_template', 'Below min banner ({amount})'],
                ['below_min_footnote_template', 'Below min footnote ({current}, {minimum})'],
                ['savings_banner_template', 'Savings banner ({savings})'],
                ['add_more_checkout_template', 'Add more checkout CTA ({amount})'],
                ['min_order_alert_template', 'Min order alert ({amount}, {minimum})'],
                ['empty_preview_image_1', 'Empty state preview image URL 1'],
                ['empty_preview_image_2', 'Empty state preview image URL 2'],
                ['load_error_message', 'Load error message'],
                ['retry_label', 'Retry button label']
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={cartScreenDraft[key]}
                  onChange={(e) => updateCartScreenField(key, e.target.value)}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={cartScreenSaving}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {cartScreenSaving ? 'Saving…' : 'Save Cart Screen Copy'}
            </button>
          </form>
        )}
      </section>

      {/* 7. Offers & Coupons Screen Copy */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2">Offers & Coupons Screen Copy (C3)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Coupon list screen header, manual apply bar, section labels, and eligibility messages. Live coupons load from the coupons API.
        </p>

        {!offersCouponsDraft ? (
          <p className="text-slate-400 text-sm">Loading offers screen config…</p>
        ) : (
          <form onSubmit={handleSaveOffersCouponsScreen} className="space-y-6">
            {(
              [
                ['title', 'Screen title'],
                ['manual_code_placeholder', 'Manual code placeholder'],
                ['manual_apply_label', 'Manual apply button'],
                ['available_section_label', 'Available section label'],
                ['expires_template', 'Expiry template ({date})'],
                ['list_apply_label', 'List APPLY button'],
                ['empty_message', 'Empty state message'],
                ['load_error_message', 'Load error message'],
                ['retry_label', 'Retry button label'],
                ['min_order_alert_title', 'Min order alert title'],
                ['min_order_alert_template', 'Min order alert ({amount}, {code})'],
                ['invalid_coupon_alert_title', 'Invalid coupon alert title'],
                ['apply_failed_fallback', 'Apply failed fallback'],
                ['connection_error_title', 'Connection error title'],
                ['connection_error_message', 'Connection error message'],
                ['unlock_offer_template', 'Unlock offer template ({amount})'],
                ['audience_new_guideline', 'New customer guideline'],
                ['audience_loyal_guideline', 'Loyal customer guideline'],
                ['audience_all_guideline', 'All customers guideline'],
                ['usage_limit_template', 'Usage limit template ({limit})']
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={offersCouponsDraft[key]}
                  onChange={(e) => updateOffersCouponsField(key, e.target.value)}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={offersCouponsSaving}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {offersCouponsSaving ? 'Saving…' : 'Save Offers Screen Copy'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
