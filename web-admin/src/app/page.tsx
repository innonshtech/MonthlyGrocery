'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch, clearAdminSession, API_BASE } from '../utils/api';
import { packUnitPayloadFromInput, resolvePackUnitLabel } from '../lib/packUnits';
import {
  Shop,
  AdminState,
  AdminDistrict,
  ServiceableLocation,
  PromotionalBanner,
  HomeScreenConfig,
  SearchScreenConfig,
  CategoriesScreenConfig,
  CategoryProductsScreenConfig,
  ProductDetailScreenConfig,
  CartScreenConfig,
  OffersCouponsScreenConfig,
  FranchiseRequest,
  PlatformOrder,
  City,
  Area,
  TabType,
} from '../types/admin.types';

// Layout Components
import AdminSidebar from '../components/layout/AdminSidebar';
import AdminHeader from '../components/layout/AdminHeader';

// Tab Components
import ShopsTab from '../components/tabs/ShopsTab';
import LocationsTab from '../components/tabs/LocationsTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import BannersTab from '../components/tabs/BannersTab';
import AppScreenTab from '../components/tabs/AppScreenTab';
import FranchiseTab from '../components/tabs/FranchiseTab';
import BulkLoaderTab from '../components/tabs/BulkLoaderTab';
import CitiesAreasTab from '../components/tabs/CitiesAreasTab';
import { SkuRequestsTab } from '../components/tabs/SkuRequestsTab';
import { CategoriesAdminTab } from '../components/tabs/CategoriesAdminTab';
import { MasterCatalogTab } from '../components/tabs/MasterCatalogTab';
import { CouponsAdminTab } from '../components/tabs/CouponsAdminTab';
import { OrdersAdminTab } from '../components/tabs/OrdersAdminTab';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('shops');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lists & data states
  const [shops, setShops] = useState<Shop[]>([]);
  const [locations, setLocations] = useState<ServiceableLocation[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [franchiseRequests, setFranchiseRequests] = useState<FranchiseRequest[]>([]);
  const [orders, setOrders] = useState<PlatformOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [skuRequests, setSkuRequests] = useState<any[]>([]);
  const [skuApproveRequest, setSkuApproveRequest] = useState<any | null>(null);
  const [skuApproveImageFile, setSkuApproveImageFile] = useState<File | null>(null);
  const [skuApproveImagePreview, setSkuApproveImagePreview] = useState('');
  const [skuApproveSaving, setSkuApproveSaving] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImageFile, setNewCategoryImageFile] = useState<File | null>(null);
  const [newCategoryImageUploading, setNewCategoryImageUploading] = useState(false);
  const [categoryImageUploadingId, setCategoryImageUploadingId] = useState<string | null>(null);
  const [subcategoriesList, setSubcategoriesList] = useState<any[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryCategoryId, setNewSubcategoryCategoryId] = useState('');
  const [newSubcategoryImageFile, setNewSubcategoryImageFile] = useState<File | null>(null);
  const [newSubcategorySaving, setNewSubcategorySaving] = useState(false);
  const [subcategoryImageUploadingId, setSubcategoryImageUploadingId] = useState<string | null>(null);

  // Master Catalog States
  const [masterProductsList, setMasterProductsList] = useState<any[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCompany, setNewProdCompany] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdSubcategory, setNewProdSubcategory] = useState('');
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

  // Forms for City / Area registration
  const [newCityName, setNewCityName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [searchStateQuery, setSearchStateQuery] = useState('');
  const [searchDistrictQuery, setSearchDistrictQuery] = useState('');
  const [searchCityQuery, setSearchCityQuery] = useState('');
  const [searchAreaQuery, setSearchAreaQuery] = useState('');

  // Franchise Lead Generation States
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadCity, setNewLeadCity] = useState('');
  const [newLeadBudget, setNewLeadBudget] = useState('');
  const [newLeadMessage, setNewLeadMessage] = useState('');
  const [newLeadStatus, setNewLeadStatus] = useState<'new' | 'contacted' | 'converted' | 'rejected'>('new');
  const [newLeadSaving, setNewLeadSaving] = useState(false);
  const [searchFranchiseQuery, setSearchFranchiseQuery] = useState('');
  const [franchiseStatusFilter, setFranchiseStatusFilter] = useState('all');

  // Forms for Store registration
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regOwnerMobile, setRegOwnerMobile] = useState('');
  const [regStateId, setRegStateId] = useState('');
  const [regDistrictId, setRegDistrictId] = useState('');
  const [regCity, setRegCity] = useState('');
  const [adminStates, setAdminStates] = useState<AdminState[]>([]);
  const [adminDistricts, setAdminDistricts] = useState<AdminDistrict[]>([]);
  const [regDistrictOptions, setRegDistrictOptions] = useState<AdminDistrict[]>([]);
  const [newStateName, setNewStateName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [selectedStateForDistrict, setSelectedStateForDistrict] = useState('');

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

  // Locations form states
  const [locCity, setLocCity] = useState('Mumbai');
  const [locArea, setLocArea] = useState('');
  const [locPin, setLocPin] = useState('');
  const [locShop, setLocShop] = useState('');

  // Banners form states
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerKind, setBannerKind] = useState<'image' | 'promo'>('image');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerBody, setBannerBody] = useState('');
  const [bannerCta, setBannerCta] = useState('');

  // App Screen configs
  const [homeScreenDraft, setHomeScreenDraft] = useState<HomeScreenConfig | null>(null);
  const [searchScreenDraft, setSearchScreenDraft] = useState<SearchScreenConfig | null>(null);
  const [categoriesScreenDraft, setCategoriesScreenDraft] = useState<CategoriesScreenConfig | null>(null);
  const [categoryProductsDraft, setCategoryProductsDraft] = useState<CategoryProductsScreenConfig | null>(null);
  const [productDetailDraft, setProductDetailDraft] = useState<ProductDetailScreenConfig | null>(null);
  const [cartScreenDraft, setCartScreenDraft] = useState<CartScreenConfig | null>(null);
  const [offersCouponsDraft, setOffersCouponsDraft] = useState<OffersCouponsScreenConfig | null>(null);

  // 1. Guard check on mount — validate token against local backend
  useEffect(() => {
    const savedToken = localStorage.getItem('@admin_token');
    const savedUserStr = localStorage.getItem('@admin_user');
    if (!savedToken || !savedUserStr) {
      router.replace('/login');
      return;
    }

    apiFetch('/auth/me')
      .then((data) => {
        if (data.user?.role !== 'super_admin') {
          clearAdminSession();
          router.replace('/login');
          return;
        }
        setToken(savedToken);
        setUser(data.user || JSON.parse(savedUserStr));
      })
      .catch(() => {
        clearAdminSession();
        router.replace('/login');
      });
  }, [router]);

  useEffect(() => {
    if (!regStateId) {
      setRegDistrictOptions([]);
      setRegDistrictId('');
      return;
    }
    setRegDistrictOptions(adminDistricts.filter((d) => d.state_id === regStateId));
    setRegDistrictId('');
  }, [regStateId, adminDistricts]);

  // Fetch data depending on active tab
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'shops' || activeTab === 'locations') {
        const data = await apiFetch('/shops/all');
        setShops(data.shops || []);

        const masterData = await apiFetch('/products/master');
        setMasterProductsList(masterData.products || []);
      }

      if (activeTab === 'shops' || activeTab === 'locations' || activeTab === 'cities-areas') {
        const statesData = await apiFetch('/admin/states');
        setAdminStates(statesData.states || []);

        const districtsData = await apiFetch('/admin/districts');
        setAdminDistricts(districtsData.districts || []);
      }

      if (activeTab === 'locations' || activeTab === 'cities-areas') {
        const dataCities = await apiFetch('/admin/cities');
        setCities(dataCities.cities || []);

        const dataAreas = await apiFetch('/admin/areas');
        setAreas(dataAreas.areas || []);
      }

      if (activeTab === 'locations') {
        const data = await apiFetch('/admin/locations');
        setLocations(data.locations || []);
      }

      if (activeTab === 'banners') {
        const data = await apiFetch('/admin/banners/all');
        if (data.banners) {
          setBanners(data.banners);
        }
      }

      if (activeTab === 'home-screen') {
        const data = await apiFetch('/admin/home');
        if (data.home) setHomeScreenDraft(data.home);

        const searchData = await apiFetch('/admin/search-screen');
        if (searchData.search) setSearchScreenDraft(searchData.search);

        const categoriesData = await apiFetch('/admin/categories-screen');
        if (categoriesData.categories) setCategoriesScreenDraft(categoriesData.categories);

        const categoryProductsData = await apiFetch('/admin/category-products-screen');
        if (categoryProductsData.category_products) setCategoryProductsDraft(categoryProductsData.category_products);

        const productDetailData = await apiFetch('/admin/product-detail-screen');
        if (productDetailData.product_detail) setProductDetailDraft(productDetailData.product_detail);

        const cartScreenData = await apiFetch('/admin/cart-screen');
        if (cartScreenData.cart) setCartScreenDraft(cartScreenData.cart);

        const offersCouponsData = await apiFetch('/admin/offers-coupons-screen');
        if (offersCouponsData.offers_coupons) setOffersCouponsDraft(offersCouponsData.offers_coupons);
      }

      if (activeTab === 'franchise') {
        const data = await apiFetch('/admin/franchise');
        if (data.requests) setFranchiseRequests(data.requests);
      }

      if (activeTab === 'analytics') {
        const data = await apiFetch('/orders/platform/all');
        if (data.orders) setOrders(data.orders);
      }

      if (activeTab === 'sku-requests') {
        const data = await apiFetch('/admin/sku-requests');
        setSkuRequests(data.requests || []);
      }

      if (activeTab === 'categories-admin') {
        const data = await apiFetch('/admin/categories');
        setCategoriesList(data.categories || []);
        const subData = await apiFetch('/admin/subcategories');
        setSubcategoriesList(subData.subcategories || []);
      }

      if (activeTab === 'master-catalog') {
        const data = await apiFetch('/products/master');
        setMasterProductsList(data.products || []);

        const dataCat = await apiFetch('/admin/categories');
        setCategoriesList(dataCat.categories || []);
        const subData = await apiFetch('/admin/subcategories');
        setSubcategoriesList(subData.subcategories || []);
      }

      if (activeTab === 'coupons-admin') {
        const data = await apiFetch('/admin/coupons');
        if (data.coupons) setCouponsList(data.coupons || []);
      }

      if (activeTab === 'orders-admin') {
        const data = await apiFetch('/admin/orders/all');
        if (data.orders) setAllOrdersList(data.orders || []);
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
      await apiFetch(`/shops/${shopId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete store "${shopName}"?`)) return;
    try {
      await apiFetch(`/shops/${shopId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting store');
    }
  };

  // Add serviceable locations PIN mapping
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !locCity.trim() || !locArea.trim() || !locPin.trim()) {
      alert('Please fill out all location fields (including City name)');
      return;
    }
    if (!locShop) {
      alert('Please assign a merchant shop — orders from this area will go to that shopkeeper.');
      return;
    }
    try {
      const data = await apiFetch('/admin/locations', {
        method: 'POST',
        body: JSON.stringify({
          city: locCity.trim(),
          area_name: locArea.trim(),
          pincode: locPin.trim(),
          shop_id: locShop,
        }),
      });
      setLocations(data.locations || []);
      setLocCity('');
      setLocArea('');
      setLocPin('');
      setLocShop('');
      alert('Location zone saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Error creating location');
    }
  };

  const handleUpdateLocationShop = async (locId: string, shopId: string) => {
    if (!token || !shopId) return;
    const loc = locations.find((l) => l.id === locId);
    if (!loc) return;
    try {
      const data = await apiFetch('/admin/locations', {
        method: 'POST',
        body: JSON.stringify({
          id: locId,
          city: loc.city,
          area_name: loc.area_name,
          pincode: loc.pincode,
          is_serviceable: loc.is_serviceable !== false,
          shop_id: shopId,
        }),
      });
      setLocations(data.locations || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update shop assignment');
    }
  };

  // Delete serviceable location zone
  const handleDeleteLocation = async (locId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;
    try {
      const data = await apiFetch(`/admin/locations/${locId}`, { method: 'DELETE' });
      setLocations(data.locations || []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete locality');
    }
  };

  // Franchise Lead Handlers
  const handleCreateFranchiseLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newLeadName.trim() || !newLeadPhone.trim() || !newLeadCity.trim()) {
      alert('Please enter partner full name, mobile number, and target city.');
      return;
    }
    setNewLeadSaving(true);
    try {
      const data = await apiFetch('/admin/franchise', {
        method: 'POST',
        body: JSON.stringify({
          name: newLeadName,
          phone: newLeadPhone,
          email: newLeadEmail,
          city: newLeadCity,
          investment_budget: newLeadBudget,
          message: newLeadMessage,
          status: newLeadStatus,
        }),
      });
      alert(data.message || 'Franchise partnership lead created successfully!');
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setNewLeadCity('');
      setNewLeadBudget('');
      setNewLeadMessage('');
      setNewLeadStatus('new');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create franchise lead');
    } finally {
      setNewLeadSaving(false);
    }
  };

  const handleDeleteFranchiseLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this franchise inquiry?')) return;
    try {
      await apiFetch(`/admin/franchise/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  const handleUpdateFranchiseStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/admin/franchise/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update lead status');
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
      const data = await apiFetch('/admin/cities', {
        method: 'POST',
        body: JSON.stringify({ name: newCityName.trim() }),
      });
      setCities(data.cities || []);
      setNewCityName('');
      alert('City registered successfully!');
    } catch (err: any) {
      alert(err.message || 'Error creating city');
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!confirm('Are you sure you want to delete this city? This will also delete all registered areas under it.')) return;
    try {
      const data = await apiFetch(`/admin/cities/${cityId}`, { method: 'DELETE' });
      setCities(data.cities || []);
      setAreas(data.areas || []);
      if (selectedCityId === cityId) {
        setSelectedCityId('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete city');
    }
  };

  // Area operations
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCityId || !newAreaName.trim()) {
      alert('Please select a city and enter area name');
      return;
    }
    const pin = newAreaPincode.replace(/\D/g, '').slice(0, 6);
    if (pin && pin.length !== 6) {
      alert('Please enter a valid 6-digit pincode, or leave it blank to set later in Localities.');
      return;
    }
    try {
      const data = await apiFetch('/admin/areas', {
        method: 'POST',
        body: JSON.stringify({
          city_id: selectedCityId,
          name: newAreaName.trim(),
          pincode: pin || undefined,
        }),
      });
      const refreshed = await apiFetch('/admin/areas');
      setAreas(refreshed.areas || data.areas || []);
      setNewAreaName('');
      setNewAreaPincode('');
      alert('Area/locality registered successfully!');
    } catch (err: any) {
      alert(err.message || 'Error creating area');
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this area?')) return;
    try {
      const data = await apiFetch(`/admin/areas/${areaId}`, { method: 'DELETE' });
      setAreas(data.areas || []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete area');
    }
  };

  // SKU request approvals
  const openSkuApproveModal = (req: any) => {
    setSkuApproveRequest(req);
    setSkuApproveImageFile(null);
    setSkuApproveImagePreview('');
  };

  const closeSkuApproveModal = () => {
    setSkuApproveRequest(null);
    setSkuApproveImageFile(null);
    setSkuApproveImagePreview('');
  };

  const uploadAdminImage = async (file: File): Promise<string> => {
    const freshToken = token || localStorage.getItem('@admin_token');
    const formData = new FormData();
    formData.append('image', file);
    const uploadRes = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.image_url) {
      throw new Error(uploadData.error || 'Image upload failed');
    }
    return uploadData.image_url;
  };

  const handleConfirmSkuApprove = async () => {
    if (!token || !skuApproveRequest) return;
    if (!skuApproveImageFile) {
      alert('Please upload a product PNG before approving.');
      return;
    }

    setSkuApproveSaving(true);
    try {
      const imageUrl = await uploadAdminImage(skuApproveImageFile);
      const data = await apiFetch(`/admin/sku-requests/${skuApproveRequest.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'approved', image_url: imageUrl }),
      });
      alert(data.message || 'SKU request approved successfully!');
      closeSkuApproveModal();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve SKU request');
    } finally {
      setSkuApproveSaving(false);
    }
  };

  const handleUpdateSkuRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    if (status === 'approved') return;
    try {
      const data = await apiFetch(`/admin/sku-requests/${requestId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      alert(data.message || `SKU request ${status} successfully!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update SKU request status');
    }
  };

  const getSubcategoriesForCategory = (categoryId: string) =>
    subcategoriesList
      .filter((sub) => sub.category_id === categoryId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));

  const getSubcategoriesForCategoryName = (categoryName: string) => {
    const cat = categoriesList.find((c) => c.name === categoryName);
    return cat ? getSubcategoriesForCategory(cat.id) : [];
  };

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      let imageUrl = '';
      if (newCategoryImageFile) {
        setNewCategoryImageUploading(true);
        imageUrl = await uploadAdminImage(newCategoryImageFile);
        setNewCategoryImageUploading(false);
      }

      await apiFetch('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCategoryName,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }),
      });
      setNewCategoryName('');
      setNewCategoryImageFile(null);
      fetchData();
    } catch (err: any) {
      setNewCategoryImageUploading(false);
      alert(err.message || 'Error adding category');
    }
  };

  const handleCategoryImageChange = async (catId: string, file: File) => {
    if (!token || !file) return;
    setCategoryImageUploadingId(catId);
    try {
      const imageUrl = await uploadAdminImage(file);
      await apiFetch(`/admin/categories/${catId}`, {
        method: 'PUT',
        body: JSON.stringify({ image_url: imageUrl }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating category image');
    } finally {
      setCategoryImageUploadingId(null);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this category? Its subcategories will also be removed.')) return;
    try {
      await apiFetch(`/admin/categories/${catId}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting category');
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoryCategoryId || !newSubcategoryName.trim()) return;
    setNewSubcategorySaving(true);
    try {
      let imageUrl = '';
      if (newSubcategoryImageFile) {
        imageUrl = await uploadAdminImage(newSubcategoryImageFile);
      }
      await apiFetch('/admin/subcategories', {
        method: 'POST',
        body: JSON.stringify({
          category_id: newSubcategoryCategoryId,
          name: newSubcategoryName.trim(),
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }),
      });
      setNewSubcategoryName('');
      setNewSubcategoryImageFile(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add subcategory');
    } finally {
      setNewSubcategorySaving(false);
    }
  };

  const handleSubcategoryImageChange = async (subId: string, file: File) => {
    if (!file) return;
    setSubcategoryImageUploadingId(subId);
    try {
      const imageUrl = await uploadAdminImage(file);
      await apiFetch(`/admin/subcategories/${subId}`, {
        method: 'PUT',
        body: JSON.stringify({ image_url: imageUrl }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating subcategory image');
    } finally {
      setSubcategoryImageUploadingId(null);
    }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!confirm('Delete this subcategory?')) return;
    try {
      await apiFetch(`/admin/subcategories/${subId}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting subcategory');
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
      // Step 1: Upload image to bucket first (if a file was selected)
      let uploadedImageUrl = '';
      if (newProdImageFile) {
        setNewProdImageUploading(true);
        uploadedImageUrl = await uploadAdminImage(newProdImageFile);
        setNewProdImageUploading(false);
      }

      // Step 2: Loop and create each variant SKU
      const createPromises = validVariants.map(async (v) => {
        const pack = packUnitPayloadFromInput(v.quantityValue, v.quantityUnit);
        const variantName = `${newProdName.trim()} ${pack.unit}`.trim();
        return apiFetch('/products/create', {
          method: 'POST',
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
            secondary_category: newProdSubcategory || null,
            image_url: uploadedImageUrl,
            quantity_value: pack.quantity_value,
            quantity_unit: pack.quantity_unit,
            unit: pack.unit,
          })
        });
      });

      await Promise.all(createPromises);
      alert('Product and all configured unit variants created successfully!');
      setNewProdName('');
      setNewProdBrand('');
      setNewProdCompany('');
      setNewProdCategory('');
      setNewProdSubcategory('');
      setNewProdDescription('');
      setNewProdShortDescription('');
      setNewProdImageFile(null);
      setNewProdImagePreview('');
      setNewProdVariants([{ sku: '', quantityValue: '1', quantityUnit: 'kg', mrp: '', price: '' }]);
      fetchData();
    } catch (err: any) {
      setNewProdImageUploading(false);
      alert(err.message || 'Error creating product variants');
    }
  };

  const handleUpdateProductCategory = async (productId: string, newCategory: string) => {
    try {
      await apiFetch(`/products/master/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ primary_category: newCategory, secondary_category: null }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };

  const handleUpdateProductSubcategory = async (productId: string, subcategory: string) => {
    try {
      await apiFetch(`/products/master/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ secondary_category: subcategory || null }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update subcategory');
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
      await apiFetch(`/products/master/${packEditProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity_value: pack.quantity_value,
          quantity_unit: pack.quantity_unit,
          unit: pack.unit,
          name: baseName ? `${baseName} ${pack.unit}` : packEditProduct.name,
        }),
      });
      setPackEditProduct(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update pack size');
    } finally {
      setPackEditSaving(false);
    }
  };

  // Delete Product Handler (Super Admin)
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product from the master catalog?')) return;
    try {
      await apiFetch(`/products/master/${productId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
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
      await apiFetch('/admin/coupons', {
        method: 'POST',
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
      alert('Coupon campaign created successfully!');
      setNewCouponCode('');
      setNewCouponVal('');
      setNewCouponDesc('');
      setNewCouponMaxDiscount('');
      setNewCouponTarget('all');
      setNewCouponUserLimit('1');
      setNewCouponGlobalLimit('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating coupon');
    }
  };

  // Delete Promo Coupon Handler
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiFetch(`/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting coupon');
    }
  };

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleAddState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newStateName.trim()) {
      alert('Please enter a state name');
      return;
    }
    try {
      const data = await apiFetch('/admin/states', {
        method: 'POST',
        body: JSON.stringify({ name: newStateName.trim() }),
      });
      setAdminStates(data.states || []);
      setNewStateName('');
      alert('State added successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to add state');
    }
  };

  const handleDeleteState = async (stateId: string) => {
    if (!confirm('Delete this state and all its districts?')) return;
    try {
      const data = await apiFetch(`/admin/states/${stateId}`, { method: 'DELETE' });
      setAdminStates(data.states || []);
      setAdminDistricts(data.districts || []);
      if (regStateId === stateId) {
        setRegStateId('');
        setRegDistrictId('');
      }
      if (selectedStateForDistrict === stateId) {
        setSelectedStateForDistrict('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete state');
    }
  };

  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedStateForDistrict || !newDistrictName.trim()) {
      alert('Please select a state and enter a district name');
      return;
    }
    try {
      const data = await apiFetch('/admin/districts', {
        method: 'POST',
        body: JSON.stringify({
          state_id: selectedStateForDistrict,
          name: newDistrictName.trim(),
        }),
      });
      setAdminDistricts(data.districts || []);
      setNewDistrictName('');
      alert('District added successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to add district');
    }
  };

  const handleDeleteDistrict = async (districtId: string) => {
    if (!confirm('Delete this district?')) return;
    try {
      const data = await apiFetch(`/admin/districts/${districtId}`, { method: 'DELETE' });
      setAdminDistricts(data.districts || []);
      if (regDistrictId === districtId) {
        setRegDistrictId('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete district');
    }
  };

  // Store registration handler
  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !regShopName.trim() || !regOwnerName.trim() || !regOwnerMobile.trim()) {
      alert('Please fill out all store and owner fields');
      return;
    }
    if (!regStateId || !regDistrictId || !regCity.trim()) {
      alert('Please select state, district, and enter the city for merchant access');
      return;
    }
    try {
      await apiFetch('/shops/register', {
        method: 'POST',
        body: JSON.stringify({
          shop_name: regShopName.trim(),
          owner_name: regOwnerName.trim(),
          owner_mobile: regOwnerMobile.trim(),
          state_id: regStateId,
          district_id: regDistrictId,
          city: regCity.trim(),
        }),
      });
      alert('Store and owner profile registered successfully!');
      setRegShopName('');
      setRegOwnerName('');
      setRegOwnerMobile('');
      setRegStateId('');
      setRegDistrictId('');
      setRegCity('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to register store');
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
      const data = await apiFetch('/admin/banners', {
        method: 'POST',
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
      setBanners(data.banners || []);
      setBannerTitle('');
      setBannerImage('');
      setBannerLink('');
      setBannerKind('image');
      setBannerSubtitle('');
      setBannerBody('');
      setBannerCta('');
      alert('Campaign banner added successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving campaign banner');
    }
  };

  // Delete promotional banner
  const handleDeleteBanner = async (bannerId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to remove this promo campaign banner?')) return;
    try {
      const data = await apiFetch(`/admin/banners/${bannerId}`, {
        method: 'DELETE',
      });
      setBanners(data.banners || []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete campaign banner');
    }
  };

  // Download excel product templates
  const handleDownloadTemplate = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/products/excel-template`, {
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
      const data = await apiFetch('/products/import-excel', {
        method: 'POST',
        body: formData
      });
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
    clearAdminSession();
    router.replace('/login');
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#10B981] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090D16] via-[#0F172A] to-[#1E1B4B] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Navigation Bar */}
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        shops={shops}
        allOrdersList={allOrdersList}
        skuRequests={skuRequests}
        masterProductsList={masterProductsList}
        franchiseRequests={franchiseRequests}
      />

      {/* Desktop Sidebar & Mobile Drawer Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        shops={shops}
        allOrdersList={allOrdersList}
        skuRequests={skuRequests}
        masterProductsList={masterProductsList}
        franchiseRequests={franchiseRequests}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 overflow-y-auto max-w-[1700px]">
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 sm:gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 mb-4 sm:mb-6 text-xs sm:text-sm text-emerald-400 font-semibold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> Syncing data...
          </div>
        )}

        <div className="w-full">
          {/* 1. SHOPS / STORES TAB */}
          {activeTab === 'shops' && (
            <ShopsTab
              shops={shops}
              adminStates={adminStates}
              adminDistricts={adminDistricts}
              regDistrictOptions={regDistrictOptions}
              regShopName={regShopName}
              setRegShopName={setRegShopName}
              regOwnerName={regOwnerName}
              setRegOwnerName={setRegOwnerName}
              regOwnerMobile={regOwnerMobile}
              setRegOwnerMobile={setRegOwnerMobile}
              regStateId={regStateId}
              setRegStateId={setRegStateId}
              regDistrictId={regDistrictId}
              setRegDistrictId={setRegDistrictId}
              regCity={regCity}
              setRegCity={setRegCity}
              handleRegisterShop={handleRegisterShop}
              handleUpdateShopStatus={handleUpdateShopStatus}
              handleDeleteShop={handleDeleteShop}
              fetchData={fetchData}
              masterProductsList={masterProductsList}
              token={token}
            />
          )}

          {/* 2. LOCATIONS / LOCALITIES MAPPING TAB */}
          {activeTab === 'locations' && (
            <LocationsTab
              locations={locations}
              shops={shops}
              cities={cities}
              areas={areas}
              locCity={locCity}
              setLocCity={setLocCity}
              locArea={locArea}
              setLocArea={setLocArea}
              locPin={locPin}
              setLocPin={setLocPin}
              locShop={locShop}
              setLocShop={setLocShop}
              handleAddLocation={handleAddLocation}
              handleUpdateLocationShop={handleUpdateLocationShop}
              handleDeleteLocation={handleDeleteLocation}
            />
          )}

          {/* 3. PLATFORM ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <AnalyticsTab orders={orders} />
          )}

          {/* 4. FESTIVE PROMO CAMPAIGNS TAB */}
          {activeTab === 'banners' && (
            <BannersTab
              banners={banners}
              bannerTitle={bannerTitle}
              setBannerTitle={setBannerTitle}
              bannerImage={bannerImage}
              setBannerImage={setBannerImage}
              bannerLink={bannerLink}
              setBannerLink={setBannerLink}
              bannerKind={bannerKind}
              setBannerKind={setBannerKind}
              bannerSubtitle={bannerSubtitle}
              setBannerSubtitle={setBannerSubtitle}
              bannerBody={bannerBody}
              setBannerBody={setBannerBody}
              bannerCta={bannerCta}
              setBannerCta={setBannerCta}
              handleAddBanner={handleAddBanner}
              handleDeleteBanner={handleDeleteBanner}
            />
          )}

          {/* 5. APP SCREEN COPY / CONFIGURATION TAB */}
          {activeTab === 'home-screen' && (
            <AppScreenTab
              token={token}
              homeScreenDraft={homeScreenDraft}
              setHomeScreenDraft={setHomeScreenDraft}
              searchScreenDraft={searchScreenDraft}
              setSearchScreenDraft={setSearchScreenDraft}
              categoriesScreenDraft={categoriesScreenDraft}
              setCategoriesScreenDraft={setCategoriesScreenDraft}
              categoryProductsDraft={categoryProductsDraft}
              setCategoryProductsDraft={setCategoryProductsDraft}
              productDetailDraft={productDetailDraft}
              setProductDetailDraft={setProductDetailDraft}
              cartScreenDraft={cartScreenDraft}
              setCartScreenDraft={setCartScreenDraft}
              offersCouponsDraft={offersCouponsDraft}
              setOffersCouponsDraft={setOffersCouponsDraft}
            />
          )}

          {/* 6. FRANCHISE PARTNERSHIP INQUIRIES TAB */}
          {activeTab === 'franchise' && (
            <FranchiseTab
              franchiseRequests={franchiseRequests}
              franchiseStatusFilter={franchiseStatusFilter}
              setFranchiseStatusFilter={setFranchiseStatusFilter}
              searchFranchiseQuery={searchFranchiseQuery}
              setSearchFranchiseQuery={setSearchFranchiseQuery}
              newLeadName={newLeadName}
              setNewLeadName={setNewLeadName}
              newLeadPhone={newLeadPhone}
              setNewLeadPhone={setNewLeadPhone}
              newLeadEmail={newLeadEmail}
              setNewLeadEmail={setNewLeadEmail}
              newLeadCity={newLeadCity}
              setNewLeadCity={setNewLeadCity}
              newLeadBudget={newLeadBudget}
              setNewLeadBudget={setNewLeadBudget}
              newLeadMessage={newLeadMessage}
              setNewLeadMessage={setNewLeadMessage}
              newLeadStatus={newLeadStatus}
              setNewLeadStatus={setNewLeadStatus}
              newLeadSaving={newLeadSaving}
              handleCreateFranchiseLead={handleCreateFranchiseLead}
              handleUpdateFranchiseStatus={handleUpdateFranchiseStatus}
              handleDeleteFranchiseLead={handleDeleteFranchiseLead}
              fetchData={fetchData}
            />
          )}

          {/* 7. BULK EXCEL INVENTORY LOADER TAB */}
          {activeTab === 'bulk-loader' && (
            <BulkLoaderTab
              excelFile={excelFile}
              setExcelFile={setExcelFile}
              uploadingExcel={uploadingExcel}
              excelReport={excelReport}
              excelError={excelError}
              handleDownloadTemplate={handleDownloadTemplate}
              handleExcelUpload={handleExcelUpload}
            />
          )}

          {/* 8. CITIES & LOCALITIES MASTER TAB */}
          {activeTab === 'cities-areas' && (
            <CitiesAreasTab
              adminStates={adminStates}
              adminDistricts={adminDistricts}
              cities={cities}
              areas={areas}
              newStateName={newStateName}
              setNewStateName={setNewStateName}
              selectedStateForDistrict={selectedStateForDistrict}
              setSelectedStateForDistrict={setSelectedStateForDistrict}
              newDistrictName={newDistrictName}
              setNewDistrictName={setNewDistrictName}
              newCityName={newCityName}
              setNewCityName={setNewCityName}
              selectedCityId={selectedCityId}
              setSelectedCityId={setSelectedCityId}
              newAreaName={newAreaName}
              setNewAreaName={setNewAreaName}
              newAreaPincode={newAreaPincode}
              setNewAreaPincode={setNewAreaPincode}
              searchStateQuery={searchStateQuery}
              setSearchStateQuery={setSearchStateQuery}
              searchDistrictQuery={searchDistrictQuery}
              setSearchDistrictQuery={setSearchDistrictQuery}
              searchCityQuery={searchCityQuery}
              setSearchCityQuery={setSearchCityQuery}
              searchAreaQuery={searchAreaQuery}
              setSearchAreaQuery={setSearchAreaQuery}
              handleAddState={handleAddState}
              handleDeleteState={handleDeleteState}
              handleAddDistrict={handleAddDistrict}
              handleDeleteDistrict={handleDeleteDistrict}
              handleAddCity={handleAddCity}
              handleDeleteCity={handleDeleteCity}
              handleAddArea={handleAddArea}
              handleDeleteArea={handleDeleteArea}
              setActiveTab={setActiveTab}
            />
          )}

          {/* 9. SKU REQUESTS TAB */}
          {activeTab === 'sku-requests' && (
            <SkuRequestsTab
              skuRequests={skuRequests}
              fetchData={fetchData}
              openSkuApproveModal={openSkuApproveModal}
              handleUpdateSkuRequestStatus={handleUpdateSkuRequestStatus}
              skuApproveRequest={skuApproveRequest}
              skuApproveSaving={skuApproveSaving}
              skuApproveImageFile={skuApproveImageFile}
              skuApproveImagePreview={skuApproveImagePreview}
              setSkuApproveImageFile={setSkuApproveImageFile}
              setSkuApproveImagePreview={setSkuApproveImagePreview}
              closeSkuApproveModal={closeSkuApproveModal}
              handleConfirmSkuApprove={handleConfirmSkuApprove}
            />
          )}

          {/* 10. CATEGORIES MANAGEMENT TAB */}
          {activeTab === 'categories-admin' && (
            <CategoriesAdminTab
              categoriesList={categoriesList}
              fetchData={fetchData}
              expandedCategoryId={expandedCategoryId}
              setExpandedCategoryId={setExpandedCategoryId}
              getSubcategoriesForCategory={getSubcategoriesForCategory}
              categoryImageUploadingId={categoryImageUploadingId}
              subcategoryImageUploadingId={subcategoryImageUploadingId}
              handleCategoryImageChange={handleCategoryImageChange}
              handleSubcategoryImageChange={handleSubcategoryImageChange}
              handleDeleteCategory={handleDeleteCategory}
              handleDeleteSubcategory={handleDeleteSubcategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              newCategoryImageUploading={newCategoryImageUploading}
              setNewCategoryImageFile={setNewCategoryImageFile}
              handleCreateCategory={handleCreateCategory}
              newSubcategoryCategoryId={newSubcategoryCategoryId}
              setNewSubcategoryCategoryId={setNewSubcategoryCategoryId}
              newSubcategoryName={newSubcategoryName}
              setNewSubcategoryName={setNewSubcategoryName}
              setNewSubcategoryImageFile={setNewSubcategoryImageFile}
              newSubcategorySaving={newSubcategorySaving}
              handleCreateSubcategory={handleCreateSubcategory}
            />
          )}

          {/* 11. MASTER CATALOGUE TAB */}
          {activeTab === 'master-catalog' && (
            <MasterCatalogTab
              masterProductsList={masterProductsList}
              categoriesList={categoriesList}
              getSubcategoriesForCategoryName={getSubcategoriesForCategoryName}
              fetchData={fetchData}
              openPackEditModal={openPackEditModal}
              handleUpdateProductCategory={handleUpdateProductCategory}
              handleUpdateProductSubcategory={handleUpdateProductSubcategory}
              handleDeleteProduct={handleDeleteProduct}
              newProdName={newProdName}
              setNewProdName={setNewProdName}
              newProdBrand={newProdBrand}
              setNewProdBrand={setNewProdBrand}
              newProdCompany={newProdCompany}
              setNewProdCompany={setNewProdCompany}
              newProdCategory={newProdCategory}
              setNewProdCategory={setNewProdCategory}
              newProdSubcategory={newProdSubcategory}
              setNewProdSubcategory={setNewProdSubcategory}
              newProdShortDescription={newProdShortDescription}
              setNewProdShortDescription={setNewProdShortDescription}
              newProdDescription={newProdDescription}
              setNewProdDescription={setNewProdDescription}
              newProdImageFile={newProdImageFile}
              setNewProdImageFile={setNewProdImageFile}
              newProdImagePreview={newProdImagePreview}
              setNewProdImagePreview={setNewProdImagePreview}
              newProdImageUploading={newProdImageUploading}
              newProdVariants={newProdVariants}
              setNewProdVariants={setNewProdVariants}
              handleCreateProduct={handleCreateProduct}
              packEditProduct={packEditProduct}
              packEditQty={packEditQty}
              setPackEditQty={setPackEditQty}
              packEditUnit={packEditUnit}
              setPackEditUnit={setPackEditUnit}
              packEditSaving={packEditSaving}
              setPackEditProduct={setPackEditProduct}
              handleSavePackSize={handleSavePackSize}
            />
          )}

          {/* 12. MANAGE COUPONS TAB */}
          {activeTab === 'coupons-admin' && (
            <CouponsAdminTab
              couponsList={couponsList}
              newCouponCode={newCouponCode}
              setNewCouponCode={setNewCouponCode}
              newCouponType={newCouponType}
              setNewCouponType={setNewCouponType}
              newCouponVal={newCouponVal}
              setNewCouponVal={setNewCouponVal}
              newCouponMinOrder={newCouponMinOrder}
              setNewCouponMinOrder={setNewCouponMinOrder}
              newCouponMaxDiscount={newCouponMaxDiscount}
              setNewCouponMaxDiscount={setNewCouponMaxDiscount}
              newCouponDesc={newCouponDesc}
              setNewCouponDesc={setNewCouponDesc}
              newCouponTarget={newCouponTarget}
              setNewCouponTarget={setNewCouponTarget}
              newCouponUserLimit={newCouponUserLimit}
              setNewCouponUserLimit={setNewCouponUserLimit}
              newCouponGlobalLimit={newCouponGlobalLimit}
              setNewCouponGlobalLimit={setNewCouponGlobalLimit}
              handleCreateCoupon={handleCreateCoupon}
              handleDeleteCoupon={handleDeleteCoupon}
            />
          )}

          {/* 13. LIVE ORDERS TRACKER TAB */}
          {activeTab === 'orders-admin' && (
            <OrdersAdminTab
              allOrdersList={allOrdersList}
              orderStatusFilter={orderStatusFilter}
              setOrderStatusFilter={setOrderStatusFilter}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}
        </div>
      </main>
    </div>
  );
}
