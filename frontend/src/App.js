import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ViewAsBanner from "@/components/ViewAsBanner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";

import ConsumerHome from "@/pages/consumer/Home";
import ProductPage from "@/pages/consumer/Product";
import CartPage from "@/pages/consumer/Cart";
import CheckoutPage from "@/pages/consumer/Checkout";
import ConsumerOrders from "@/pages/consumer/Orders";
import OrderDetail from "@/pages/consumer/OrderDetail";

import AdminLayout from "@/pages/admin/Layout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminInventory from "@/pages/admin/Inventory";
import AdminOrders from "@/pages/admin/Orders";
import AdminStoreProfile from "@/pages/admin/StoreProfile";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminApprovals from "@/pages/admin/Approvals";
import AdminTwilioLogs from "@/pages/admin/TwilioLogs";
import AdminActivity from "@/pages/admin/Activity";
import AdminBanners from "@/pages/admin/Banners";

function App() {
  useEffect(() => {
    const title = "MonthlyGrocery · Monthly Groceries Delivered Home";
    document.title = title;
    const t = setInterval(() => { if (document.title !== title) document.title = title; }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster position="top-center" richColors closeButton />
            <ViewAsBanner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Navigate to="/login" replace/>} />

              {/* Consumer — guest browsing allowed on shop/product/cart. OTP kicks in at checkout. */}
              <Route path="/shop" element={<ConsumerHome />} />
              <Route path="/products/:productId" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<ProtectedRoute roles={["consumer"]}><ConsumerOrders /></ProtectedRoute>} />
              <Route path="/orders/:orderId" element={<ProtectedRoute roles={["consumer"]}><OrderDetail /></ProtectedRoute>} />

              {/* Admin & Super Admin share the same console */}
              <Route path="/admin" element={<ProtectedRoute roles={["admin","super_admin"]}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="inventory" element={<ProtectedRoute roles={["admin"]}><AdminInventory /></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute roles={["admin"]}><AdminOrders /></ProtectedRoute>} />
                <Route path="store-profile" element={<ProtectedRoute roles={["admin"]}><AdminStoreProfile /></ProtectedRoute>} />
                <Route path="analytics" element={<ProtectedRoute roles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
                <Route path="approvals" element={<ProtectedRoute roles={["super_admin"]}><AdminApprovals /></ProtectedRoute>} />
                <Route path="activity" element={<ProtectedRoute roles={["super_admin"]}><AdminActivity /></ProtectedRoute>} />
                <Route path="twilio-logs" element={<ProtectedRoute roles={["super_admin"]}><AdminTwilioLogs /></ProtectedRoute>} />
                <Route path="banners" element={<ProtectedRoute roles={["super_admin"]}><AdminBanners /></ProtectedRoute>} />
              </Route>

              <Route path="/merchant/*" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
