'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Store,
  FileSpreadsheet,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  MapPin,
  BarChart3,
  ImageIcon,
  MessageSquare,
  Plus,
  Trash2,
  Tag,
  Package,
  Ticket,
  ShoppingBag,
  Home
} from 'lucide-react';
import { PACK_UNIT_OPTIONS, resolvePackUnitLabel, packUnitPayloadFromInput } from '../lib/packUnits';

interface Shop {
  id: string;
  shop_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    name: string;
    phone: string;
  };
}

interface ServiceableLocation {
  id: string;
  city: string;
  area_name: string;
  pincode: string;
  is_serviceable: boolean;
  shop_id: string | null;
}

interface PromotionalBanner {
  id: string;
  title: string;
  image_url: string;
  action_link: string;
  active: boolean;
  kind?: 'image' | 'promo';
  subtitle?: string;
  body?: string;
  cta_text?: string;
}

interface HomeScreenConfig {
  delivering_label: string;
  location_prefix: string;
  choose_location_label: string;
  delivery_pill_text: string;
  search_placeholder: string;
  mmg_label: string;
  mmg_title: string;
  mmg_subtitle: string;
  categories_title: string;
  categories_see_all: string;
  deals_title: string;
  deals_see_all: string;
  loading_deals_label: string;
  empty_deals_label: string;
  reorder_title: string;
  reorder_subtitle_template: string;
  reorder_cta_label: string;
  first_basket_title: string;
  first_basket_subtitle: string;
  first_basket_cta_label: string;
  load_error_message: string;
  retry_label: string;
  location_required_deals_label: string;
}

interface SearchScreenConfig {
  search_placeholder: string;
  popular_searches_label: string;
  products_section_label: string;
  empty_title_template: string;
  empty_subtitle: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
}

interface CategoriesScreenConfig {
  title: string;
  search_placeholder: string;
  section_grocery_label: string;
  section_snacks_label: string;
  section_household_label: string;
  section_default_label: string;
  empty_message: string;
  load_error_message: string;
  retry_label: string;
}

interface CategoryProductsScreenConfig {
  search_placeholder_template: string;
  items_count_template: string;
  sort_label: string;
  sub_category_all_label: string;
  empty_message: string;
  deals_title: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
  view_cart_label: string;
  cart_item_label: string;
  cart_items_template: string;
  add_button_label: string;
  filter_sheet_title: string;
  filter_sort_section_label: string;
  filter_sort_relevance: string;
  filter_sort_price_low: string;
  filter_sort_price_high: string;
  filter_sort_discount: string;
  filter_pack_section_label: string;
  filter_clear_label: string;
  filter_apply_label: string;
}

interface ProductDetailScreenConfig {
  delivery_window_label: string;
  highlights_section_label: string;
  add_to_cart_label: string;
  unit_price_suffix_template: string;
  not_found_message: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
}

interface CartScreenConfig {
  title: string;
  cart_item_label: string;
  cart_items_template: string;
  empty_title: string;
  empty_message: string;
  start_shopping_label: string;
  reorder_last_month_label: string;
  save_basket_label: string;
  apply_coupon_label: string;
  coupon_applied_template: string;
  bill_details_title: string;
  bill_item_total_label: string;
  bill_savings_label: string;
  bill_delivery_fee_label: string;
  bill_delivery_fee_value: string;
  bill_coupon_discount_label: string;
  bill_to_pay_label: string;
  sticky_to_pay_label: string;
  proceed_to_pay_label: string;
  below_min_title_template: string;
  below_min_footnote_template: string;
  savings_banner_template: string;
  add_more_checkout_template: string;
  min_order_alert_template: string;
  empty_preview_image_1: string;
  empty_preview_image_2: string;
  load_error_message: string;
  retry_label: string;
}

interface OffersCouponsScreenConfig {
  title: string;
  manual_code_placeholder: string;
  manual_apply_label: string;
  available_section_label: string;
  expires_template: string;
  list_apply_label: string;
  empty_message: string;
  load_error_message: string;
  retry_label: string;
  min_order_alert_title: string;
  min_order_alert_template: string;
  invalid_coupon_alert_title: string;
  apply_failed_fallback: string;
  connection_error_title: string;
  connection_error_message: string;
  unlock_offer_template: string;
  audience_new_guideline: string;
  audience_loyal_guideline: string;
  audience_all_guideline: string;
  usage_limit_template: string;
}

interface FranchiseRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  created_at: string;
}

interface PlatformOrder {
  id: string;
  total_amount: string;
  status: string;
  created_at: string;
  shop_id: string;
  shops: {
    shop_name: string;
  };
  profiles: {
    name: string;
    phone: string;
  };
}

interface City {
  id: string;
  name: string;
}

interface Area {
  id: string;
  city_id: string;
  name: string;
}

type TabType = 'shops' | 'locations' | 'analytics' | 'banners' | 'home-screen' | 'franchise' | 'bulk-loader' | 'cities-areas' | 'sku-requests' | 'categories-admin' | 'master-catalog' | 'coupons-admin' | 'orders-admin';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('shops');

  // Lists & data states
  const [shops, setShops] = useState<Shop[]>([]);
  const [locations, setLocations] = useState<ServiceableLocation[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [franchiseRequests, setFranchiseRequests] = useState<FranchiseRequest[]>([]);
  const [orders, setOrders] = useState<PlatformOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [skuRequests, setSkuRequests] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImageFile, setNewCategoryImageFile] = useState<File | null>(null);
  const [newCategoryImageUploading, setNewCategoryImageUploading] = useState(false);
  const [categoryImageUploadingId, setCategoryImageUploadingId] = useState<string | null>(null);
  
  // Master Catalog States
  const [masterProductsList, setMasterProductsList] = useState<any[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCompany, setNewProdCompany] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdShortDescription, setNewProdShortDescription] = useState('');
  const [newProdImageFile, setNewProdImageFile] = useState<File | null>(null);
  const [newProdImagePreview, setNewProdImagePreview] = useState('');
  const [newProdImageUploading, setNewProdImageUploading] = useState(false);
  const [newProdVariants, setNewProdVariants] = useState<Array<{ sku: string; quantityValue: string; quantityUnit: string; mrp: string; price: string }>>([
    { sku: '', quantityValue: '1', quantityUnit: 'kg', mrp: '', price: '' }
  ]);
  const [packEditProduct, setPackEditProduct] = useState<any | null>(null);
  const [packEditQty, setPackEditQty] = useState('');
  const [packEditUnit, setPackEditUnit] = useState('kg');
  const [packEditSaving, setPackEditSaving] = useState(false);

  // Shop Inventory Modal States
  const [selectedShopForInventory, setSelectedShopForInventory] = useState<any | null>(null);
  const [shopInventoryList, setShopInventoryList] = useState<any[]>([]);
  const [assignProdId, setAssignProdId] = useState('');
  const [assignProdPrice, setAssignProdPrice] = useState('');
  const [assignProdDiscount, setAssignProdDiscount] = useState('');
  const [assignProdStock, setAssignProdStock] = useState('');

  // Forms for City / Area registration
  const [newCityName, setNewCityName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');

  // Forms for Store registration
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regOwnerMobile, setRegOwnerMobile] = useState('');

  // Super Admin Coupons States
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'flat'>('percentage');
  const [newCouponVal, setNewCouponVal] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('2500');
  const [newCouponMaxDiscount, setNewCouponMaxDiscount] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponTarget, setNewCouponTarget] = useState<'all' | 'new' | 'loyal'>('all');
  const [newCouponUserLimit, setNewCouponUserLimit] = useState('1');
  const [newCouponGlobalLimit, setNewCouponGlobalLimit] = useState('');

  // Central Orders States
  const [allOrdersList, setAllOrdersList] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bulk Excel Upload states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelReport, setExcelReport] = useState<any>(null);
  const [excelError, setExcelError] = useState('');

  // Forms states
  const [locCity, setLocCity] = useState('Mumbai');
  const [locArea, setLocArea] = useState('');
  const [locPin, setLocPin] = useState('');
  const [locShop, setLocShop] = useState('');

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerKind, setBannerKind] = useState<'image' | 'promo'>('image');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerBody, setBannerBody] = useState('');
  const [bannerCta, setBannerCta] = useState('');
  const [homeScreenDraft, setHomeScreenDraft] = useState<HomeScreenConfig | null>(null);
  const [homeScreenSaving, setHomeScreenSaving] = useState(false);
  const [searchScreenDraft, setSearchScreenDraft] = useState<SearchScreenConfig | null>(null);
  const [searchScreenSaving, setSearchScreenSaving] = useState(false);
  const [categoriesScreenDraft, setCategoriesScreenDraft] = useState<CategoriesScreenConfig | null>(null);
  const [categoriesScreenSaving, setCategoriesScreenSaving] = useState(false);
  const [categoryProductsDraft, setCategoryProductsDraft] = useState<CategoryProductsScreenConfig | null>(null);
  const [categoryProductsSaving, setCategoryProductsSaving] = useState(false);
  const [productDetailDraft, setProductDetailDraft] = useState<ProductDetailScreenConfig | null>(null);
  const [productDetailSaving, setProductDetailSaving] = useState(false);
  const [cartScreenDraft, setCartScreenDraft] = useState<CartScreenConfig | null>(null);
  const [cartScreenSaving, setCartScreenSaving] = useState(false);
  const [offersCouponsDraft, setOffersCouponsDraft] = useState<OffersCouponsScreenConfig | null>(null);
  const [offersCouponsSaving, setOffersCouponsSaving] = useState(false);

  // 1. Guard check on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('@admin_token');
    const savedUserStr = localStorage.getItem('@admin_user');
    if (!savedToken || !savedUserStr) {
      router.replace('/login');
      return;
    }
    setToken(savedToken);
    setUser(JSON.parse(savedUserStr));
  }, [router]);

  // Fetch data depending on active tab
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'shops' || activeTab === 'locations') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/shops/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setShops(data.shops);
        }

        // Fetch master catalogue to populate modal dropdown
        const masterRes = await fetch('https://monthly-grocery-rust.vercel.app/api/products/master', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const masterData = await masterRes.json();
        if (masterRes.ok && masterData.success) {
          setMasterProductsList(masterData.products || []);
        }
      }

      if (activeTab === 'locations' || activeTab === 'cities-areas') {
        const resCities = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/cities');
        const dataCities = await resCities.json();
        if (resCities.ok && dataCities.success) {
          setCities(dataCities.cities);
        }

        const resAreas = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/areas');
        const dataAreas = await resAreas.json();
        if (resAreas.ok && dataAreas.success) {
          setAreas(dataAreas.areas);
        }
      }

      if (activeTab === 'locations') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/locations');
        const data = await res.json();
        if (res.ok && data.success) {
          setLocations(data.locations);
        }
      }

      if (activeTab === 'banners') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/banners/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setBanners(data.banners);
        }
      }

      if (activeTab === 'home-screen') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/home');
        const data = await res.json();
        if (res.ok && data.success && data.home) {
          setHomeScreenDraft(data.home);
        }
        const searchRes = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/search-screen');
        const searchData = await searchRes.json();
        if (searchRes.ok && searchData.success && searchData.search) {
          setSearchScreenDraft(searchData.search);
        }
        const categoriesRes = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/categories-screen');
        const categoriesData = await categoriesRes.json();
        if (categoriesRes.ok && categoriesData.success && categoriesData.categories) {
          setCategoriesScreenDraft(categoriesData.categories);
        }
        const categoryProductsRes = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/category-products-screen');
        const categoryProductsData = await categoryProductsRes.json();
        if (categoryProductsRes.ok && categoryProductsData.success && categoryProductsData.category_products) {
          setCategoryProductsDraft(categoryProductsData.category_products);
        }
        const productDetailRes = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/product-detail-screen');
        const productDetailData = await productDetailRes.json();
        if (productDetailRes.ok && productDetailData.success && productDetailData.product_detail) {
          setProductDetailDraft(productDetailData.product_detail);
        }
        const cartScreenRes = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/cart-screen');
        const cartScreenData = await cartScreenRes.json();
        if (cartScreenRes.ok && cartScreenData.success && cartScreenData.cart) {
          setCartScreenDraft(cartScreenData.cart);
        }
        const offersCouponsRes = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/offers-coupons-screen');
        const offersCouponsData = await offersCouponsRes.json();
        if (offersCouponsRes.ok && offersCouponsData.success && offersCouponsData.offers_coupons) {
          setOffersCouponsDraft(offersCouponsData.offers_coupons);
        }
      }

      if (activeTab === 'franchise') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/franchise', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFranchiseRequests(data.requests);
        }
      }

      if (activeTab === 'analytics') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/orders/platform/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders);
        }
      }

      if (activeTab === 'sku-requests') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/sku-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSkuRequests(data.requests);
        }
      }

      if (activeTab === 'categories-admin') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCategoriesList(data.categories || []);
        }
      }

      if (activeTab === 'master-catalog') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/products/master', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMasterProductsList(data.products || []);
        }

        const resCat = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataCat = await resCat.json();
        if (resCat.ok && dataCat.success) {
          setCategoriesList(dataCat.categories || []);
        }
      }

      if (activeTab === 'coupons-admin') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/coupons', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCouponsList(data.coupons || []);
        }
      }

      if (activeTab === 'orders-admin') {
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/orders/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAllOrdersList(data.orders || []);
        }
      }

    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, activeTab]);

  // Shop Status approvals
  const handleUpdateShopStatus = async (shopId: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/shops/${shopId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Add serviceable locations PIN mapping
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !locCity.trim() || !locArea.trim() || !locPin.trim()) {
      alert('Please fill out all location fields (including City name)');
      return;
    }
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          city: locCity.trim(),
          area_name: locArea.trim(),
          pincode: locPin.trim(),
          shop_id: locShop || null
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLocations(data.locations);
        setLocCity('');
        setLocArea('');
        setLocPin('');
        setLocShop('');
        alert('Location zone saved successfully!');
      } else {
        alert(data.error || 'Failed to save location');
      }
    } catch (err) {
      alert('Error creating location');
    }
  };

  // Delete serviceable location zone
  const handleDeleteLocation = async (locId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/locations/${locId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLocations(data.locations);
      }
    } catch (err) {
      alert('Failed to delete locality');
    }
  };

  // City operations
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCityName.trim()) {
      alert('Please enter a city name');
      return;
    }
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCityName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCities(data.cities);
        setNewCityName('');
        alert('City registered successfully!');
      } else {
        alert(data.error || 'Failed to register city');
      }
    } catch (err) {
      alert('Error creating city');
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this city? This will also delete all registered areas under it.')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/cities/${cityId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCities(data.cities);
        const resAreas = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/areas');
        const dataAreas = await resAreas.json();
        if (resAreas.ok && dataAreas.success) {
          setAreas(dataAreas.areas);
        }
      }
    } catch (err) {
      alert('Failed to delete city');
    }
  };

  // Area operations
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCityId || !newAreaName.trim()) {
      alert('Please select a city and enter area name');
      return;
    }
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city_id: selectedCityId, name: newAreaName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAreas(data.areas);
        setNewAreaName('');
        alert('Area/locality registered successfully!');
      } else {
        alert(data.error || 'Failed to register area');
      }
    } catch (err) {
      alert('Error creating area');
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this area?')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/areas/${areaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAreas(data.areas);
      }
    } catch (err) {
      alert('Failed to delete area');
    }
  };

  // SKU request approvals
  const handleUpdateSkuRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/sku-requests/${requestId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`SKU request ${status} successfully!`);
        fetchData();
      } else {
        alert(data.error || 'Failed to update request status');
      }
    } catch (err) {
      alert('Error updating SKU status');
    }
  };

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      let imageUrl = '';
      if (newCategoryImageFile) {
        setNewCategoryImageUploading(true);
        const formData = new FormData();
        formData.append('image', newCategoryImageFile);
        const uploadRes = await fetch('https://monthly-grocery-rust.vercel.app/api/products/upload-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        setNewCategoryImageUploading(false);
        if (!uploadRes.ok || !uploadData.image_url) {
          alert('Image upload failed: ' + (uploadData.error || 'Unknown error'));
          return;
        }
        imageUrl = uploadData.image_url;
      }

      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewCategoryName('');
        setNewCategoryImageFile(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to add category');
      }
    } catch (err) {
      alert('Error adding category');
    }
  };

  const handleCategoryImageChange = async (catId: string, file: File) => {
    if (!token || !file) return;
    setCategoryImageUploadingId(catId);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch('https://monthly-grocery-rust.vercel.app/api/products/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.image_url) {
        alert('Image upload failed: ' + (uploadData.error || 'Unknown error'));
        return;
      }

      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/categories/${catId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_url: uploadData.image_url }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to update category image');
      }
    } catch {
      alert('Error updating category image');
    } finally {
      setCategoryImageUploadingId(null);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      alert('Error deleting category');
    }
  };

  // Create Product Handler (Super Admin)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCategory) return;
    
    // Validate variants
    const validVariants = newProdVariants.filter(
      (v) => v.quantityValue.trim() && v.quantityUnit.trim() && v.mrp.trim() && v.price.trim() && v.sku.trim(),
    );
    if (validVariants.length === 0) {
      alert('Please add at least one valid pack variant (quantity, unit type, SKU, MRP, and default price).');
      return;
    }

    try {
      // Step 1: Upload image to Supabase bucket first (if a file was selected)
      let uploadedImageUrl = '';
      if (newProdImageFile) {
        setNewProdImageUploading(true);
        const formData = new FormData();
        formData.append('image', newProdImageFile);
        const freshToken = token || localStorage.getItem('@admin_token');
        const uploadRes = await fetch('https://monthly-grocery-rust.vercel.app/api/products/upload-image', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${freshToken}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        setNewProdImageUploading(false);
        if (!uploadRes.ok || !uploadData.image_url) {
          alert('Image upload failed: ' + (uploadData.error || 'Unknown error'));
          return;
        }
        uploadedImageUrl = uploadData.image_url;
      }

      // Step 2: Loop and create each variant SKU
      const createPromises = validVariants.map(async (v) => {
        const pack = packUnitPayloadFromInput(v.quantityValue, v.quantityUnit);
        const variantName = `${newProdName.trim()} ${pack.unit}`.trim();
        const res = await fetch('https://monthly-grocery-rust.vercel.app/api/products/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: variantName,
            sku: v.sku.trim(),
            brand: newProdBrand.trim(),
            company: newProdCompany.trim(),
            description: newProdDescription.trim(),
            short_description: newProdShortDescription.trim(),
            mrp: parseFloat(v.mrp),
            price: parseFloat(v.price),
            primary_category: newProdCategory,
            image_url: uploadedImageUrl,
            quantity_value: pack.quantity_value,
            quantity_unit: pack.quantity_unit,
            unit: pack.unit,
          })
        });
        return res.json();
      });

      const results = await Promise.all(createPromises);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        alert(`Some variants failed to create: ${failed.map(f => f.error).join(', ')}`);
      } else {
        alert('Product and all configured unit variants created successfully!');
        setNewProdName('');
        setNewProdBrand('');
        setNewProdCompany('');
        setNewProdCategory('');
        setNewProdDescription('');
        setNewProdShortDescription('');
        setNewProdImageFile(null);
        setNewProdImagePreview('');
        setNewProdVariants([{ sku: '', quantityValue: '1', quantityUnit: 'kg', mrp: '', price: '' }]);
        fetchData();
      }
    } catch (err) {
      alert('Error creating product variants');
    }
  };

  // Update Product Category Handler (Super Admin)
  const handleUpdateProductCategory = async (productId: string, newCategory: string) => {
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/products/master/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ primary_category: newCategory })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to update category');
      }
    } catch (err) {
      alert('Error updating category');
    }
  };

  const openPackEditModal = (prod: any) => {
    setPackEditProduct(prod);
    const qty = prod.quantity_value != null ? String(prod.quantity_value) : '';
    const unitCode = prod.quantity_unit || 'kg';
    if (qty) {
      setPackEditQty(qty);
      setPackEditUnit(unitCode);
    } else {
      const label = resolvePackUnitLabel(prod);
      const match = label.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
      if (match) {
        setPackEditQty(match[1]);
        setPackEditUnit(match[2] === 'L' ? 'L' : match[2].toLowerCase());
      } else {
        setPackEditQty('1');
        setPackEditUnit('kg');
      }
    }
  };

  const handleSavePackSize = async () => {
    if (!packEditProduct || !token) return;
    const pack = packUnitPayloadFromInput(packEditQty, packEditUnit);
    if (!pack.unit) {
      alert('Enter a valid quantity and unit type.');
      return;
    }

    setPackEditSaving(true);
    try {
      const baseName = String(packEditProduct.name || '')
        .replace(/\s+\d+(?:\.\d+)?\s*(kg|g|ml|l|L|pcs|pack|dozen)\s*$/i, '')
        .trim();
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/products/master/${packEditProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity_value: pack.quantity_value,
          quantity_unit: pack.quantity_unit,
          unit: pack.unit,
          name: baseName ? `${baseName} ${pack.unit}` : packEditProduct.name,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPackEditProduct(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to update pack size');
      }
    } catch {
      alert('Error updating pack size');
    } finally {
      setPackEditSaving(false);
    }
  };

  // Delete Product Handler (Super Admin)
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product from the master catalog?')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/products/master/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  // Fetch Shop Inventory Handler
  const fetchShopInventory = async (shopId: string) => {
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/shop-inventory/${shopId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShopInventoryList(data.shop_products || []);
      }
    } catch (err) {
      console.error('Failed to fetch shop inventory:', err);
    }
  };

  // Direct Assign Product to Shop Handler
  const handleDirectAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopForInventory || !assignProdId || !assignProdPrice) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/shop-inventory/${selectedShopForInventory.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: assignProdId,
          selling_price: assignProdPrice,
          discount_percentage: assignProdDiscount || 0,
          stock: assignProdStock || 100
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Product assigned directly to shop!');
        setAssignProdId('');
        setAssignProdPrice('');
        setAssignProdDiscount('');
        setAssignProdStock('');
        fetchShopInventory(selectedShopForInventory.id);
      } else {
        alert(data.error || 'Failed to assign product');
      }
    } catch (err) {
      alert('Error assigning product');
    }
  };

  // Unassign Product from Shop Handler
  const handleUnassignShopProduct = async (mappingId: string) => {
    if (!confirm('Are you sure you want to unassign this product from this shop?')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/shop-inventory/${mappingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (selectedShopForInventory) {
          fetchShopInventory(selectedShopForInventory.id);
        }
      } else {
        alert(data.error || 'Failed to unassign product');
      }
    } catch (err) {
      alert('Error unassigning product');
    }
  };

  // Create Promo Coupon Handler
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCouponCode.trim() || !newCouponVal) {
      alert('Please fill out coupon code and discount value');
      return;
    }
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          discount_type: newCouponType,
          discount_value: parseFloat(newCouponVal) || 0,
          min_order_value: parseFloat(newCouponMinOrder) || 0,
          max_discount: newCouponMaxDiscount ? parseFloat(newCouponMaxDiscount) : undefined,
          description: newCouponDesc.trim() || undefined,
          target_audience: newCouponTarget,
          usage_limit_per_user: parseInt(newCouponUserLimit) || 1,
          max_global_uses: newCouponGlobalLimit ? parseInt(newCouponGlobalLimit) : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Coupon campaign created successfully!');
        setNewCouponCode('');
        setNewCouponVal('');
        setNewCouponDesc('');
        setNewCouponMaxDiscount('');
        setNewCouponTarget('all');
        setNewCouponUserLimit('1');
        setNewCouponGlobalLimit('');
        fetchData();
      } else {
        alert(data.error || 'Failed to create coupon');
      }
    } catch (err) {
      alert('Error creating coupon');
    }
  };

  // Delete Promo Coupon Handler
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete coupon');
      }
    } catch (err) {
      alert('Error deleting coupon');
    }
  };

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Store registration handler
  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !regShopName.trim() || !regOwnerName.trim() || !regOwnerMobile.trim()) {
      alert('Please fill out all fields');
      return;
    }
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/shops/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_name: regShopName.trim(),
          owner_name: regOwnerName.trim(),
          owner_mobile: regOwnerMobile.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Store and owner profile registered successfully!');
        setRegShopName('');
        setRegOwnerName('');
        setRegOwnerMobile('');
        fetchData();
      } else {
        alert(data.error || 'Failed to register store');
      }
    } catch (err) {
      alert('Error creating store');
    }
  };

  // Add festive promotional banner
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !bannerTitle) {
      alert('Please enter a banner title');
      return;
    }
    if (bannerKind === 'image' && !bannerImage) {
      alert('Please enter an image URL for image banners');
      return;
    }
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: bannerTitle,
          image_url: bannerImage,
          action_link: bannerLink,
          kind: bannerKind,
          subtitle: bannerSubtitle || undefined,
          body: bannerBody || undefined,
          cta_text: bannerCta || undefined,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanners(data.banners);
        setBannerTitle('');
        setBannerImage('');
        setBannerLink('');
        setBannerKind('image');
        setBannerSubtitle('');
        setBannerBody('');
        setBannerCta('');
        alert('Campaign banner added successfully!');
      } else {
        alert(data.error || 'Failed to add campaign banner');
      }
    } catch (err) {
      alert('Error saving campaign banner');
    }
  };

  const handleSaveHomeScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !homeScreenDraft) return;
    setHomeScreenSaving(true);
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/home', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(homeScreenDraft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHomeScreenDraft(data.home);
        alert('Home screen copy updated successfully!');
      } else {
        alert(data.error || 'Failed to update home screen copy');
      }
    } catch {
      alert('Error saving home screen copy');
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
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/search-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(searchScreenDraft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSearchScreenDraft(data.search);
        alert('Search screen copy updated successfully!');
      } else {
        alert(data.error || 'Failed to update search screen copy');
      }
    } catch {
      alert('Error saving search screen copy');
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
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/categories-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categoriesScreenDraft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategoriesScreenDraft(data.categories);
        alert('Categories screen copy updated successfully!');
      } else {
        alert(data.error || 'Failed to update categories screen copy');
      }
    } catch {
      alert('Error saving categories screen copy');
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
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/category-products-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categoryProductsDraft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategoryProductsDraft(data.category_products);
        alert('Product list screen copy updated successfully!');
      } else {
        alert(data.error || 'Failed to update product list screen copy');
      }
    } catch {
      alert('Error saving product list screen copy');
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
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/product-detail-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productDetailDraft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProductDetailDraft(data.product_detail);
        alert('Product detail screen copy updated successfully!');
      } else {
        alert(data.error || 'Failed to update product detail screen copy');
      }
    } catch {
      alert('Error saving product detail screen copy');
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
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/cart-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cartScreenDraft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCartScreenDraft(data.cart);
        alert('Cart screen copy updated successfully!');
      } else {
        alert(data.error || 'Failed to update cart screen copy');
      }
    } catch {
      alert('Error saving cart screen copy');
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
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/admin/offers-coupons-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(offersCouponsDraft),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOffersCouponsDraft(data.offers_coupons);
        alert('Offers & coupons screen copy updated successfully!');
      } else {
        alert(data.error || 'Failed to update offers screen copy');
      }
    } catch {
      alert('Error saving offers screen copy');
    } finally {
      setOffersCouponsSaving(false);
    }
  };

  const updateOffersCouponsField = (key: keyof OffersCouponsScreenConfig, value: string) => {
    if (!offersCouponsDraft) return;
    setOffersCouponsDraft({ ...offersCouponsDraft, [key]: value });
  };

  // Delete promotional banner
  const handleDeleteBanner = async (bannerId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to remove this promo campaign banner?')) return;
    try {
      const res = await fetch(`https://monthly-grocery-rust.vercel.app/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanners(data.banners);
      }
    } catch (err) {
      alert('Failed to delete campaign banner');
    }
  };

  // Download excel product templates
  const handleDownloadTemplate = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/products/excel-template', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download template failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monthlygrocery-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Could not download spreadsheet layout template.');
    }
  };

  // Upload spreadsheet SKU loader
  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !excelFile) return;

    setUploadingExcel(true);
    setExcelReport(null);
    setExcelError('');

    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      const res = await fetch('https://monthly-grocery-rust.vercel.app/api/products/import-excel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process spreadsheet');
      }
      setExcelReport(data);
      setExcelFile(null);
      alert('Spreadsheet processing completed successfully!');
    } catch (err: any) {
      setExcelError(err.message || 'Excel processing failed');
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@admin_token');
    localStorage.removeItem('@admin_user');
    router.replace('/login');
  };

  // Math metrics for Analytics
  const calculateAnalytics = () => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalSalesSum = delivered.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
    const activePipeline = orders.filter(o => ['pending', 'confirmed', 'packing', 'out_for_delivery'].includes(o.status));
    
    // Total revenue sum including pending for calculations
    const allSum = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
    const aov = orders.length > 0 ? Math.round(allSum / orders.length) : 0;

    // Rankings of shops by revenue
    const shopSales: { [key: string]: { name: string; total: number; count: number } } = {};
    for (const o of orders) {
      const name = o.shops?.shop_name || 'Unassigned Merchant';
      if (!shopSales[o.shop_id]) {
        shopSales[o.shop_id] = { name, total: 0, count: 0 };
      }
      shopSales[o.shop_id].count += 1;
      if (o.status === 'delivered') {
        shopSales[o.shop_id].total += parseFloat(o.total_amount || '0');
      }
    }

    const rankedShops = Object.values(shopSales).sort((a, b) => b.total - a.total);

    return {
      gmv: totalSalesSum,
      totalOrders: orders.length,
      activeOrders: activePipeline.length,
      completedOrders: delivered.length,
      aov,
      rankedShops
    };
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#10B981] animate-spin" />
      </div>
    );
  }

  const stats = calculateAnalytics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090D16] via-[#0F172A] to-[#1E1B4B] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#090D16]/65 border-b md:border-b-0 md:border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">MonthlyGrocery</h1>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Super Admin Console</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('shops')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'shops' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Store className="w-4 h-4" /> Store Approvals
            </button>

            <button
              onClick={() => setActiveTab('cities-areas')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'cities-areas' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MapPin className="w-4 h-4" /> Cities & Localities
            </button>

            <button
              onClick={() => setActiveTab('sku-requests')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'sku-requests' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> SKU Requests
            </button>

            <button
              onClick={() => setActiveTab('categories-admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'categories-admin' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Tag className="w-4 h-4" /> Manage Categories
            </button>

            <button
              onClick={() => setActiveTab('master-catalog')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'master-catalog' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Package className="w-4 h-4" /> Master Catalogue
            </button>

            <button
              onClick={() => setActiveTab('coupons-admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'coupons-admin' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Ticket className="w-4 h-4" /> Manage Coupons
            </button>

            <button
              onClick={() => setActiveTab('orders-admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'orders-admin' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Live Orders Tracker
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'locations' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MapPin className="w-4 h-4" /> Localities Mapping
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Platform Analytics
            </button>

            <button
              onClick={() => setActiveTab('home-screen')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'home-screen' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Home className="w-4 h-4" /> App Screen Copy
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'banners' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Festive Campaigns
            </button>

            <button
              onClick={() => setActiveTab('franchise')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'franchise' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Franchise Inquiries
            </button>

            <button
              onClick={() => setActiveTab('bulk-loader')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'bulk-loader' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Bulk SKU Loader
            </button>
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-100">{user.name}</p>
            <p className="text-[11px] text-slate-500">Super Admin Mobile: {user.mobile}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5 rounded-xl w-max shadow-sm backdrop-blur-md">
            <Loader2 className="w-4 h-4 animate-spin" /> Querying API Database...
          </div>
        )}

        {/* 1. STORE APPROVALS TAB */}
        {activeTab === 'shops' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
            {/* Left: Store Whitelisting table */}
            <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" /> Store Registration Whitelisting
                </h2>
                <button onClick={fetchData} className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Refresh</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Store Name</th>
                      <th className="pb-3">Owner Contact</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 text-sm">
                    {shops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 pr-3 font-semibold text-white">{shop.shop_name}</td>
                        <td className="py-4 pr-3">
                          <p className="font-semibold text-slate-200">{shop.profiles?.name || 'Owner'}</p>
                          <p className="text-xs text-slate-500">+{shop.profiles?.phone}</p>
                        </td>
                        <td className="py-4 pr-3">
                          {shop.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Approved
                            </span>
                          )}
                          {shop.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              Rejected
                            </span>
                          )}
                          {shop.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right space-x-2">
                          {shop.status === 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedShopForInventory(shop);
                                fetchShopInventory(shop.id);
                              }}
                              className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg transition-all cursor-pointer"
                            >
                              Manage Inventory
                            </button>
                          )}
                          {shop.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateShopStatus(shop.id, 'approved')}
                              className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {shop.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateShopStatus(shop.id, 'rejected')}
                              className="text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-lg transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right: Register New Store form */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">➕ Register New Store</h3>
              
              <form onSubmit={handleRegisterShop} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Store / Shop Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Thorat Wholesalers"
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={regShopName}
                    onChange={(e) => setRegShopName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Owner Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Owner Mobile Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={regOwnerMobile}
                    onChange={(e) => setRegOwnerMobile(e.target.value.replace(/[^\d]/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all mt-4 cursor-pointer"
                >
                  Register Store
                </button>
              </form>
            </section>
          </div>
        )}

        {/* 2. LOCALITIES MAPPING TAB */}
        {activeTab === 'locations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
            {/* Left Column: List of Mapped Zones */}
            <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" /> Serviceable Delivery Localities
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">City / Locality</th>
                      <th className="pb-3">PIN Code</th>
                      <th className="pb-3">Assigned Merchant</th>
                      <th className="pb-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 text-sm">
                    {locations.map((loc) => {
                      const matchedShop = shops.find(s => s.id === loc.shop_id);
                      return (
                        <tr key={loc.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 pr-3 font-semibold">
                            <span className="text-white">{loc.area_name}</span>
                            <span className="text-xs text-slate-500 block">{loc.city}</span>
                          </td>
                          <td className="py-4 pr-3 text-slate-300 font-mono font-bold">{loc.pincode}</td>
                          <td className="py-4 pr-3">
                            {matchedShop ? (
                              <span className="text-emerald-400 font-semibold">{matchedShop.shop_name}</span>
                            ) : (
                              <span className="text-slate-500 italic">No Shop Assigned</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right Column: Add Location form */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">➕ Add Serviceable Zone</h3>
              
              <form onSubmit={handleAddLocation} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">City Location</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={locCity}
                    onChange={(e) => {
                      setLocCity(e.target.value);
                      setLocArea('');
                    }}
                  >
                    <option value="">Select registered city...</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Locality Name</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    disabled={!locCity}
                    value={locArea}
                    onChange={(e) => setLocArea(e.target.value)}
                  >
                    <option value="">Select registered locality...</option>
                    {areas
                      .filter((area) => {
                        const cityObj = cities.find(c => c.name === locCity);
                        return cityObj ? area.city_id === cityObj.id : false;
                      })
                      .map((area) => (
                        <option key={area.id} value={area.name}>{area.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">6-Digit PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 400053"
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={locPin}
                    onChange={(e) => setLocPin(e.target.value.replace(/[^\d]/g, ''))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Shop</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={locShop}
                    onChange={(e) => setLocShop(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {shops.filter(s => s.status === 'approved').map(s => (
                      <option key={s.id} value={s.id}>{s.shop_name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all mt-4 cursor-pointer"
                >
                  Save Local Zone
                </button>
              </form>
            </section>
          </div>
        )}

        {/* 3. PLATFORM ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 max-w-6xl">
            {/* Sales Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform GMV</p>
                <p className="text-2xl font-bold text-emerald-400 mt-2">₹{stats.gmv.toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-slate-500 mt-1">Delivered orders revenue</p>
              </div>

              <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-slate-200 mt-2">{stats.totalOrders}</p>
                <p className="text-[9px] text-slate-500 mt-1">Total placed orders</p>
              </div>

              <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Orders</p>
                <p className="text-2xl font-bold text-amber-400 mt-2">{stats.activeOrders}</p>
                <p className="text-[9px] text-slate-500 mt-1">In processing pipeline</p>
              </div>

              <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Order (AOV)</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">₹{stats.aov.toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-slate-500 mt-1">Average spent per basket</p>
              </div>
            </div>

            {/* Merchant Rankings */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Merchant Sales Rankings
              </h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Shop Partner</th>
                    <th className="pb-3 text-center">Orders Placed</th>
                    <th className="pb-3 text-right">Revenue (GMV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-sm">
                  {stats.rankedShops.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 pr-3 font-semibold text-white">{item.name}</td>
                      <td className="py-4 pr-3 text-center text-slate-400">{item.count} orders</td>
                      <td className="py-4 text-right font-bold text-emerald-400">₹{item.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* 3b. HOME SCREEN COPY TAB */}
        {activeTab === 'home-screen' && (
          <div className="max-w-4xl">
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
                  {([
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
                    ['retry_label', 'Retry button label'],
                  ] as const).map(([key, label]) => (
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

            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Search Screen Copy (B2)</h2>
              <p className="text-sm text-slate-500 mb-6">
                Labels for the customer search screen. Popular chips use live categories from the catalog.
              </p>

              {!searchScreenDraft ? (
                <p className="text-slate-400 text-sm">Loading search screen config…</p>
              ) : (
                <form onSubmit={handleSaveSearchScreen} className="space-y-6">
                  {([
                    ['search_placeholder', 'Search placeholder'],
                    ['popular_searches_label', 'Popular searches label'],
                    ['products_section_label', 'Products section label'],
                    ['empty_title_template', 'Empty title template ({query})'],
                    ['empty_subtitle', 'Empty subtitle'],
                    ['location_required_message', 'Location required message'],
                    ['choose_location_label', 'Choose location label'],
                    ['load_error_message', 'Load error message'],
                    ['retry_label', 'Retry button label'],
                  ] as const).map(([key, label]) => (
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

            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Categories Screen Copy (B3)</h2>
              <p className="text-sm text-slate-500 mb-6">
                Title, search placeholder, and section labels on the customer categories tab. Category tiles use live catalog data.
              </p>

              {!categoriesScreenDraft ? (
                <p className="text-slate-400 text-sm">Loading categories screen config…</p>
              ) : (
                <form onSubmit={handleSaveCategoriesScreen} className="space-y-6">
                  {([
                    ['title', 'Screen title'],
                    ['search_placeholder', 'Search placeholder'],
                    ['section_grocery_label', 'Grocery section label'],
                    ['section_snacks_label', 'Snacks section label'],
                    ['section_household_label', 'Household section label'],
                    ['section_default_label', 'Default section label'],
                    ['empty_message', 'Empty search message'],
                    ['load_error_message', 'Load error message'],
                    ['retry_label', 'Retry button label'],
                  ] as const).map(([key, label]) => (
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

            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Product List Screen Copy (B4)</h2>
              <p className="text-sm text-slate-500 mb-6">
                Category product grid, sort bar, floating cart, and filter sheet labels. Products load from the catalog API.
              </p>

              {!categoryProductsDraft ? (
                <p className="text-slate-400 text-sm">Loading product list screen config…</p>
              ) : (
                <form onSubmit={handleSaveCategoryProducts} className="space-y-6">
                  {([
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
                    ['filter_apply_label', 'Apply button'],
                  ] as const).map(([key, label]) => (
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

            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Product Detail Screen Copy (C1)</h2>
              <p className="text-sm text-slate-500 mb-6">
                Product detail hero, delivery banner, highlights section, and sticky add-to-cart bar. Product data loads from the catalog API.
              </p>

              {!productDetailDraft ? (
                <p className="text-slate-400 text-sm">Loading product detail screen config…</p>
              ) : (
                <form onSubmit={handleSaveProductDetail} className="space-y-6">
                  {([
                    ['delivery_window_label', 'Delivery window banner'],
                    ['highlights_section_label', 'Highlights section title'],
                    ['add_to_cart_label', 'Add to cart button'],
                    ['unit_price_suffix_template', 'Unit price suffix ({unit})'],
                    ['not_found_message', 'Product not found message'],
                    ['location_required_message', 'Location required message'],
                    ['choose_location_label', 'Choose location button'],
                    ['load_error_message', 'Load error message'],
                    ['retry_label', 'Retry button label'],
                  ] as const).map(([key, label]) => (
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

            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Cart Screen Copy (C2)</h2>
              <p className="text-sm text-slate-500 mb-6">
                Cart header, empty state, bill details, min-order banners, and checkout bar. Min order amount comes from server config API.
              </p>

              {!cartScreenDraft ? (
                <p className="text-slate-400 text-sm">Loading cart screen config…</p>
              ) : (
                <form onSubmit={handleSaveCartScreen} className="space-y-6">
                  {([
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
                    ['retry_label', 'Retry button label'],
                  ] as const).map(([key, label]) => (
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

            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Offers & Coupons Screen Copy (C3)</h2>
              <p className="text-sm text-slate-500 mb-6">
                Coupon list screen header, manual apply bar, section labels, and eligibility messages. Live coupons load from the coupons API.
              </p>

              {!offersCouponsDraft ? (
                <p className="text-slate-400 text-sm">Loading offers screen config…</p>
              ) : (
                <form onSubmit={handleSaveOffersCouponsScreen} className="space-y-6">
                  {([
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
                    ['usage_limit_template', 'Usage limit template ({limit})'],
                  ] as const).map(([key, label]) => (
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
        )}

        {/* 4. FESTIVE CAMPAIGNS TAB */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
            {/* Left Column: Banners List */}
            <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" /> Promotional Festive Banners
              </h2>
              
              <div className="space-y-4">
                {banners.map((b) => (
                  <div key={b.id} className="flex gap-4 p-4 border border-slate-800/80 rounded-2xl items-center bg-slate-950/40">
                    {b.kind === 'promo' ? (
                      <div className="w-24 h-16 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xs font-bold px-2 text-center">
                        Promo card
                      </div>
                    ) : (
                      <img src={b.image_url} alt={b.title} className="w-24 h-16 object-cover rounded-lg bg-slate-900 border border-slate-800" />
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
                    placeholder="e.g. CategoryProducts?category=Oil"
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                  />
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
        )}

        {/* 5. FRANCHISE REQUESTS TAB */}
        {activeTab === 'franchise' && (
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl max-w-5xl shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Franchise Partnership Requests
            </h2>
            
            <div className="space-y-4">
              {franchiseRequests.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No partnership leads received yet.</p>
              ) : (
                franchiseRequests.map((req) => (
                  <div key={req.id} className="p-5 border border-slate-800/80 rounded-2xl bg-slate-950/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-slate-100">{req.name}</h4>
                        <p className="text-xs text-slate-500">📞 +91 {req.phone} | ✉️ {req.email || 'No email'}</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {req.city} Hub request
                      </span>
                    </div>
                    {req.message && (
                      <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-900 text-sm text-slate-400">
                        {req.message}
                      </div>
                    )}
                    <p className="text-[9px] text-slate-600 text-right">Received: {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* 6. BULK SKU LOADER TAB */}
        {activeTab === 'bulk-loader' && (
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl max-w-md shadow-xl">
            <div className="flex items-center gap-2.5 mb-6">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Bulk Inventory Loader</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200">1. Download Template Sheet</h3>
                <p className="text-xs text-slate-500">Download the standard layout template containing configurations schema.</p>
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
                    excelFile ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/10' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
        )}

        {/* 7. CITIES & LOCALITIES TAB */}
        {activeTab === 'cities-areas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
            {/* Left: Manage Cities */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" /> Register City
              </h2>
              
              <form onSubmit={handleAddCity} className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  className="flex-1 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                />
                <button
                  type="submit"
                  className="h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>

              <div className="border-t border-slate-850 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Registered Cities</h3>
                <div className="divide-y divide-slate-800/30 max-h-96 overflow-y-auto pr-1">
                  {cities.map((city) => (
                    <div key={city.id} className="flex justify-between items-center py-3">
                      <span className="text-sm font-semibold text-slate-200">{city.name}</span>
                      <button
                        onClick={() => handleDeleteCity(city.id)}
                        className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {cities.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 italic text-center">No cities registered yet.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Right: Manage Areas/Localities */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" /> Register Locality / Area
              </h2>

              <form onSubmit={handleAddArea} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select City</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                  >
                    <option value="">Choose registered city...</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Area / Locality Name</label>
                    <input
                      type="text"
                      placeholder="e.g. College Road"
                      className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </form>

              <div className="border-t border-slate-850 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Registered Localities</h3>
                <div className="divide-y divide-slate-800/30 max-h-80 overflow-y-auto pr-1">
                  {areas.map((area) => {
                    const matchedCity = cities.find(c => c.id === area.city_id);
                    return (
                      <div key={area.id} className="flex justify-between items-center py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{area.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{matchedCity?.name || 'Unknown City'}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  {areas.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 italic text-center">No areas registered yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 8. SKU REQUESTS TAB */}
        {activeTab === 'sku-requests' && (
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl max-w-5xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Merchant SKU Requests
              </h2>
              <button onClick={fetchData} className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Merchant / Shop</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Brand</th>
                    <th className="pb-3">MRP (Master)</th>
                    <th className="pb-3">Highlights</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-sm">
                  {skuRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 pr-3 font-semibold text-slate-200">{req.shop_name}</td>
                      <td className="py-4 pr-3 font-semibold text-white">{req.product_name}</td>
                      <td className="py-4 pr-3 text-slate-400">{req.unit || '—'}</td>
                      <td className="py-4 pr-3 text-slate-400">{req.category}</td>
                      <td className="py-4 pr-3 text-slate-400">{req.brand}</td>
                      <td className="py-4 pr-3 text-slate-300">₹{req.mrp}</td>
                      <td className="py-4 pr-3 text-slate-400 max-w-[200px] truncate" title={req.description || req.short_description || ''}>
                        {req.description || req.short_description || '—'}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateSkuRequestStatus(req.id, 'approved')}
                          className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateSkuRequestStatus(req.id, 'rejected')}
                          className="text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-lg transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {skuRequests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 italic">No pending SKU requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 9. CATEGORIES MANAGEMENT TAB */}
        {activeTab === 'categories-admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
            <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-400" /> Platform Categories
                </h2>
                <button onClick={fetchData} className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Refresh</button>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Tile PNGs shown on Home and All Categories in the customer app. Upload a new image to replace any category icon.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-3">Tile</th>
                      <th className="pb-3">Category Name</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 text-sm">
                    {categoriesList.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 pr-3">
                          <div className="w-14 h-14 rounded-xl bg-white/5 border border-slate-800 flex items-center justify-center overflow-hidden">
                            {cat.image_url ? (
                              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold uppercase">No PNG</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-3">
                          <div className="font-bold text-white">{cat.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{cat.id}</div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <label
                              className={`text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer ${
                                categoryImageUploadingId === cat.id ? 'opacity-60 pointer-events-none' : ''
                              }`}
                            >
                              {categoryImageUploadingId === cat.id ? 'Uploading…' : 'Change PNG'}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleCategoryImageChange(cat.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categoriesList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500 italic">No categories found in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-fit">
              <h2 className="text-lg font-bold text-white mb-2">Create New Category</h2>
              <p className="text-sm text-slate-500 mb-6">Optional tile PNG — same flow as master catalog image upload.</p>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dry Fruits, Gourmet Oils"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tile PNG (optional)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setNewCategoryImageFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:font-bold file:cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={newCategoryImageUploading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {newCategoryImageUploading ? 'Uploading…' : 'Add Category'}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* 10. MASTER CATALOGUE TAB */}
        {activeTab === 'master-catalog' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-7xl">
            {/* Products Table (Span 3) */}
            <section className="xl:col-span-3 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl font-sans">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" /> Master Catalogue Products
                </h2>
                <button onClick={fetchData} className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Refresh</button>
              </div>
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Product Info</th>
                      <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Pack Size</th>
                      <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">SKU</th>
                      <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Brand</th>
                      <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">MRP (Master)</th>
                      <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Category Assignment</th>
                      <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 text-sm">
                    {masterProductsList.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-3">
                            {prod.image_url && (
                              <img src={prod.image_url} alt={prod.name} className="w-10 h-10 object-contain rounded-lg bg-white/5 border border-slate-800" />
                            )}
                            <div>
                              <p className="font-bold text-white leading-tight">{prod.name}</p>
                              <p className="text-[10px] text-slate-500">{prod.brand || 'Unbranded'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-3">
                          <button
                            type="button"
                            onClick={() => openPackEditModal(prod)}
                            className="text-left group cursor-pointer"
                          >
                            <span className="font-semibold text-emerald-300 group-hover:text-emerald-200">
                              {resolvePackUnitLabel(prod) || '—'}
                            </span>
                            <span className="block text-[10px] text-slate-500 group-hover:text-slate-400">Edit pack</span>
                          </button>
                        </td>
                        <td className="py-4 pr-3 text-slate-300 font-semibold">{prod.sku}</td>
                        <td className="py-4 pr-3 text-slate-400">{prod.brand || '-'}</td>
                        <td className="py-4 pr-3 text-slate-200">₹{prod.mrp}</td>
                        <td className="py-4 pr-3">
                          <select
                            value={prod.primary_category || ''}
                            onChange={(e) => handleUpdateProductCategory(prod.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="">-- Unassigned --</option>
                            {categoriesList.map((cat) => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {masterProductsList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 italic">No products found in catalogue. Use Bulk Excel Loader or create one on the right.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Create Product Panel */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-fit">
              <h2 className="text-lg font-bold text-white mb-6 font-sans">Add New Product</h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name (Base Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fortune Soya Health Oil"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Fortune"
                      value={newProdBrand}
                      onChange={(e) => setNewProdBrand(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Adani Wilmar"
                      value={newProdCompany}
                      onChange={(e) => setNewProdCompany(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category Assignment *</label>
                  <select
                    required
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Category --</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Short Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Chakki-fresh whole wheat, no maida"
                    value={newProdShortDescription}
                    onChange={(e) => setNewProdShortDescription(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Highlights (Semicolon-separated ;)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Stone ground Chakki fresh; 100% whole wheat with zero maida; Milled in small batches for softness"
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Image</label>
                  <div className="flex items-center gap-3">
                    {/* Preview */}
                    {newProdImagePreview ? (
                      <img src={newProdImagePreview} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 flex items-center justify-center flex-shrink-0 bg-slate-900">
                        <ImageIcon className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    {/* File Input */}
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 hover:border-emerald-500 transition-colors text-center">
                        {newProdImageUploading ? '⏳ Uploading to bucket...' : newProdImageFile ? `✅ ${newProdImageFile.name}` : '📁 Click to choose image (PNG/JPG)'}
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewProdImageFile(file);
                            setNewProdImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Image will be shared across all configured pack unit variants below.</p>
                </div>

                {/* Variants Editor Block */}
                <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pack Unit Variants</h3>
                    <button
                      type="button"
                      onClick={() => setNewProdVariants([...newProdVariants, { sku: '', quantityValue: '', quantityUnit: 'kg', mrp: '', price: '' }])}
                      className="text-xs font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition-all cursor-pointer"
                    >
                      + Add Pack Size
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {newProdVariants.map((item, idx) => (
                      <div key={idx} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 space-y-2 relative">
                        {newProdVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewProdVariants(newProdVariants.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 text-slate-500 hover:text-red-400 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-1">Quantity</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              placeholder="e.g. 5"
                              value={item.quantityValue}
                              onChange={(e) => {
                                const copy = [...newProdVariants];
                                copy[idx].quantityValue = e.target.value;
                                if (newProdName.trim() && !copy[idx].sku) {
                                  const baseCode = newProdName.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
                                  const unitCode = `${e.target.value}${copy[idx].quantityUnit}`.toUpperCase();
                                  copy[idx].sku = `${baseCode}-${unitCode}`;
                                }
                                setNewProdVariants(copy);
                              }}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-1">Unit type</label>
                            <select
                              required
                              value={item.quantityUnit}
                              onChange={(e) => {
                                const copy = [...newProdVariants];
                                copy[idx].quantityUnit = e.target.value;
                                if (newProdName.trim() && copy[idx].quantityValue) {
                                  const baseCode = newProdName.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
                                  const unitCode = `${copy[idx].quantityValue}${e.target.value}`.toUpperCase();
                                  copy[idx].sku = `${baseCode}-${unitCode}`;
                                }
                                setNewProdVariants(copy);
                              }}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              {PACK_UNIT_OPTIONS.map((opt) => (
                                <option key={opt.code} value={opt.code}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-1">Preview</label>
                            <div className="h-[30px] flex items-center px-2.5 rounded-lg bg-slate-900/60 border border-slate-850 text-xs text-emerald-300 font-semibold">
                              {item.quantityValue && item.quantityUnit
                                ? packUnitPayloadFromInput(item.quantityValue, item.quantityUnit).unit
                                : '—'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-1">Variant SKU *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. FORT-SOYA-5L"
                              value={item.sku}
                              onChange={(e) => {
                                const copy = [...newProdVariants];
                                copy[idx].sku = e.target.value;
                                setNewProdVariants(copy);
                              }}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-1">Master MRP (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              placeholder="e.g. 800.00"
                              value={item.mrp}
                              onChange={(e) => {
                                const copy = [...newProdVariants];
                                copy[idx].mrp = e.target.value;
                                setNewProdVariants(copy);
                              }}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-1">Default Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              placeholder="e.g. 720.00"
                              value={item.price}
                              onChange={(e) => {
                                const copy = [...newProdVariants];
                                copy[idx].price = e.target.value;
                                setNewProdVariants(copy);
                              }}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={newProdImageUploading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" /> Create Product & Variants
                </button>
              </form>
            </section>
          </div>
        )}

        {packEditProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1">Edit pack size</h3>
              <p className="text-xs text-slate-400 mb-4 truncate">{packEditProduct.name}</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={packEditQty}
                    onChange={(e) => setPackEditQty(e.target.value)}
                    className="w-full mt-1 h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Unit type</label>
                  <select
                    value={packEditUnit}
                    onChange={(e) => setPackEditUnit(e.target.value)}
                    className="w-full mt-1 h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    {PACK_UNIT_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-emerald-300 font-semibold mb-5">
                Customer will see: {packEditQty && packEditUnit ? packUnitPayloadFromInput(packEditQty, packEditUnit).unit : '—'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setPackEditProduct(null)}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={packEditSaving}
                  onClick={handleSavePackSize}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer"
                >
                  {packEditSaving ? 'Saving…' : 'Save pack size'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SHOP INVENTORY MANAGEMENT MODAL */}
        {selectedShopForInventory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
                <div>
                  <h3 className="text-lg font-bold text-white">Inventory: {selectedShopForInventory.shop_name}</h3>
                  <p className="text-xs text-slate-400">Directly assign products and customize prices.</p>
                </div>
                <button
                  onClick={() => setSelectedShopForInventory(null)}
                  className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Direct Assignment Form (Col 1) */}
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50 h-fit space-y-4">
                  <h4 className="font-bold text-white text-sm mb-2">➕ Assign Product to Store</h4>
                  <form onSubmit={handleDirectAssignProduct} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product SKU *</label>
                      <select
                        required
                        value={assignProdId}
                        onChange={(e) => setAssignProdId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">-- Choose Product --</option>
                        {masterProductsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {resolvePackUnitLabel(p)} (MRP: ₹{p.mrp})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="165"
                        value={assignProdPrice}
                        onChange={(e) => setAssignProdPrice(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount %</label>
                        <input
                          type="number"
                          placeholder="5"
                          value={assignProdDiscount}
                          onChange={(e) => setAssignProdDiscount(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock</label>
                        <input
                          type="number"
                          placeholder="100"
                          value={assignProdStock}
                          onChange={(e) => setAssignProdStock(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Assign SKU to Shop
                    </button>
                  </form>
                </div>

                {/* Assigned Items List (Col 2-3) */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-bold text-white text-sm">Assigned Products ({shopInventoryList.length})</h4>
                  <div className="overflow-x-auto border border-slate-800/80 rounded-2xl max-h-[480px] overflow-y-auto pr-1">
                    <table className="w-full text-left border-collapse bg-[#0c1220]/40 text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/80 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Product</th>
                          <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Master MRP</th>
                          <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Shop Price</th>
                          <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Stock</th>
                          <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Status</th>
                          <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {shopInventoryList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/10 text-slate-200">
                            <td className="p-3">
                              <p className="font-bold text-white">{item.product_name}</p>
                              <p className="text-[9px] text-slate-500">SKU: {item.sku}</p>
                            </td>
                            <td className="p-3 text-slate-400">₹{item.mrp}</td>
                            <td className="p-3 font-semibold text-emerald-400">₹{item.selling_price}</td>
                            <td className="p-3">{item.stock}</td>
                            <td className="p-3">
                              {item.status === 'approved' ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/10 text-[9px]">Approved</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/10 text-[9px]">Pending</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleUnassignShopProduct(item.id)}
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {shopInventoryList.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500 italic">No products assigned to this shop yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. MANAGE COUPONS TAB */}
        {activeTab === 'coupons-admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
            {/* Create Coupon Form (Col 1) */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 h-fit space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-400" /> Create Promo Coupon
              </h3>
              <form onSubmit={handleCreateCoupon} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type *</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="percentage">% Percentage</option>
                      <option value="flat">₹ Flat Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount Value *</label>
                    <input
                      type="number"
                      required
                      placeholder="10"
                      value={newCouponVal}
                      onChange={(e) => setNewCouponVal(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      placeholder="2500"
                      value={newCouponMinOrder}
                      onChange={(e) => setNewCouponMinOrder(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Discount (₹)</label>
                    <input
                      type="number"
                      placeholder="300"
                      value={newCouponMaxDiscount}
                      onChange={(e) => setNewCouponMaxDiscount(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Save 10% on your monthly groceries"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience</label>
                  <select
                    value={newCouponTarget}
                    onChange={(e) => setNewCouponTarget(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Customers</option>
                    <option value="new">New Customers Only (0 orders)</option>
                    <option value="loyal">Loyal Customers Only (1+ orders)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Limit</label>
                    <select
                      value={newCouponUserLimit}
                      onChange={(e) => setNewCouponUserLimit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="1">Once Per User</option>
                      <option value="2">Twice Per User</option>
                      <option value="3">3 Times Per User</option>
                      <option value="999">Unlimited</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Global Cap</label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      value={newCouponGlobalLimit}
                      onChange={(e) => setNewCouponGlobalLimit(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer mt-2"
                >
                  Create Coupon Campaign
                </button>
              </form>
            </div>

            {/* Coupons List (Col 2-3) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-white">Active Promo Campaigns ({couponsList.length})</h3>
              <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-[#0c1220]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-3">Code</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Min Order</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Limits</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 text-slate-200">
                    {couponsList.map((cpn) => (
                      <tr key={cpn.id} className="hover:bg-slate-800/10">
                        <td className="p-3">
                          <span className="px-2 py-1 bg-emerald-500/15 border border-emerald-500/20 rounded-lg text-emerald-400 font-mono font-bold">
                            {cpn.code}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">
                          {cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} FLAT`}
                        </td>
                        <td className="p-3 text-slate-400">₹{cpn.min_order_value}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cpn.target_audience === 'new' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                            cpn.target_audience === 'loyal' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                            'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                          }`}>
                            {cpn.target_audience === 'new' ? 'New Users' :
                             cpn.target_audience === 'loyal' ? 'Loyal' : 'All'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          U: {cpn.usage_limit_per_user || 1} | G: {cpn.max_global_uses || '∞'}
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">{cpn.description}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(cpn.id)}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {couponsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500 italic">No coupons created yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 12. LIVE ORDERS TRACKER TAB */}
        {activeTab === 'orders-admin' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" /> Platform Orders ({allOrdersList.length})
                </h3>
                <p className="text-xs text-slate-400">Monitor and update customer orders across all stores in real-time.</p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                {['all', 'pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer capitalize ${
                      orderStatusFilter === st ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-[#0c1220]/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3">Order ID & Date</th>
                    <th className="p-3">Customer & Location</th>
                    <th className="p-3">Items Summary</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Live Status</th>
                    <th className="p-3 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-slate-200">
                  {allOrdersList
                    .filter((ord) => orderStatusFilter === 'all' || ord.status === orderStatusFilter)
                    .map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/10">
                        <td className="p-3">
                          <p className="font-bold text-white font-mono">#{ord.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-slate-500">{new Date(ord.created_at).toLocaleDateString('en-IN')}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-200">{ord.profiles?.name || 'Customer'}</p>
                          <p className="text-[10px] text-slate-400">{ord.delivery_address || 'Address on file'}</p>
                        </td>
                        <td className="p-3 text-slate-300">
                          {ord.order_items?.map((oi: any) => `${oi.products?.name || 'Item'} (x${oi.quantity})`).join(', ') || 'Grocery items'}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">
                          ₹{ord.total_amount}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ord.status === 'delivered' ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' :
                            ord.status === 'cancelled' ? 'bg-red-500/15 border-red-500/20 text-red-400' :
                            ord.status === 'out_for_delivery' ? 'bg-purple-500/15 border-purple-500/20 text-purple-400' :
                            'bg-amber-500/15 border-amber-500/20 text-amber-400'
                          }`}>
                            {ord.status?.toUpperCase().replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="packing">Packing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  {allOrdersList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">No customer orders placed yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

