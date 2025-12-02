import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopBar from './components/TopBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Cards from './pages/Cards';
import VerifyEmail from './pages/VerifyEmail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail';
import axios from 'axios';
import './App.css';

function AppContent({
  user,
  userToken,
  login,
  logout,
  adminUser,
  adminToken,
  adminLogin,
  adminLogout,
  isSidebarCollapsed,
  toggleSidebar,
  adminNotifications,
  markAdminOrdersSeen,
  markAdminCustomersSeen
}) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLoginOrRegister = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    if (isAdminRoute) {
      if (adminToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    } else {
      if (userToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    }
  }, [isAdminRoute, adminToken, userToken]);

  useEffect(() => {
    if (!isAdminRoute) {
      document.body.classList.remove('admin-sidebar-collapsed');
      return;
    }

    if (isSidebarCollapsed) {
      document.body.classList.add('admin-sidebar-collapsed');
    } else {
      document.body.classList.remove('admin-sidebar-collapsed');
    }

    return () => {
      document.body.classList.remove('admin-sidebar-collapsed');
    };
  }, [isAdminRoute, isSidebarCollapsed]);

  return (
    <div className="app-wrapper">
      {!isAdminRoute && (
        <>
          <TopBar />
          <Navbar user={user} logout={logout} />
        </>
      )}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={!user ? <Login login={login} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
          <Route path="/orders/:orderId" element={user ? <OrderDetail /> : <Navigate to="/login" />} />
          <Route path="/cards" element={user ? <Cards /> : <Navigate to="/login" />} />
          <Route
            path="/admin/login"
            element={!adminUser ? <AdminLogin login={adminLogin} /> : <Navigate to="/admin/dashboard" />}
          />
          <Route
            path="/admin/dashboard"
            element={
              adminUser ? (
                <AdminDashboard
                  admin={adminUser}
                  logout={adminLogout}
                  isSidebarCollapsed={isSidebarCollapsed}
                  toggleSidebar={toggleSidebar}
                  adminNotifications={adminNotifications}
                  markAdminOrdersSeen={markAdminOrdersSeen}
                  markAdminCustomersSeen={markAdminCustomersSeen}
                />
              ) : (
                <Navigate to="/admin/login" />
              )
            }
          />
          <Route
            path="/admin/products"
            element={
              adminUser ? (
                <AdminProducts
                  admin={adminUser}
                  logout={adminLogout}
                  isSidebarCollapsed={isSidebarCollapsed}
                  toggleSidebar={toggleSidebar}
                  adminNotifications={adminNotifications}
                  markAdminOrdersSeen={markAdminOrdersSeen}
                  markAdminCustomersSeen={markAdminCustomersSeen}
                />
              ) : (
                <Navigate to="/admin/login" />
              )
            }
          />
          <Route
            path="/admin/orders"
            element={
              adminUser ? (
                <AdminOrders
                  admin={adminUser}
                  logout={adminLogout}
                  isSidebarCollapsed={isSidebarCollapsed}
                  toggleSidebar={toggleSidebar}
                  adminNotifications={adminNotifications}
                  markAdminOrdersSeen={markAdminOrdersSeen}
                  markAdminCustomersSeen={markAdminCustomersSeen}
                />
              ) : (
                <Navigate to="/admin/login" />
              )
            }
          />
          <Route
            path="/admin/customers"
            element={
              adminUser ? (
                <AdminCustomers
                  admin={adminUser}
                  logout={adminLogout}
                  isSidebarCollapsed={isSidebarCollapsed}
                  toggleSidebar={toggleSidebar}
                  adminNotifications={adminNotifications}
                  markAdminOrdersSeen={markAdminOrdersSeen}
                  markAdminCustomersSeen={markAdminCustomersSeen}
                />
              ) : (
                <Navigate to="/admin/login" />
              )
            }
          />
          <Route
            path="/admin/customers/:customerId"
            element={
              adminUser ? (
                <AdminCustomerDetail
                  admin={adminUser}
                  logout={adminLogout}
                  isSidebarCollapsed={isSidebarCollapsed}
                  toggleSidebar={toggleSidebar}
                  adminNotifications={adminNotifications}
                  markAdminOrdersSeen={markAdminOrdersSeen}
                  markAdminCustomersSeen={markAdminCustomersSeen}
                />
              ) : (
                <Navigate to="/admin/login" />
              )
            }
          />
        </Routes>
      </div>
      {!isAdminRoute && !isLoginOrRegister && <Footer />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [adminNotifications, setAdminNotifications] = useState(() => {
    if (typeof window === 'undefined') {
      return { orders: 0, customers: 0, latestOrderId: 0, latestCustomerId: 0 };
    }
    return {
      orders: 0,
      customers: 0,
      latestOrderId: Number(localStorage.getItem('admin_latest_order_id') || 0),
      latestCustomerId: Number(localStorage.getItem('admin_latest_customer_id') || 0)
    };
  });
  const notificationsPollRef = React.useRef(null);

  useEffect(() => {
    const customerToken = localStorage.getItem('token');
    if (customerToken) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setUserToken(customerToken);
    }

    const storedAdminToken = localStorage.getItem('admin_token');
    if (storedAdminToken) {
      const adminData = localStorage.getItem('admin_user');
      if (adminData) {
        setAdminUser(JSON.parse(adminData));
      }
      setAdminToken(storedAdminToken);
    }

    setIsLoading(false);
  }, []);

  // Poll admin notifications when admin is logged in
  useEffect(() => {
    if (!adminToken) {
      if (notificationsPollRef.current) {
        clearInterval(notificationsPollRef.current);
        notificationsPollRef.current = null;
      }
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/admin/notification-summary');
        const { latestOrderId = 0, latestCustomerId = 0 } = response.data || {};

        setAdminNotifications((prev) => {
          const lastSeenOrderId = Number(localStorage.getItem('admin_last_seen_order_id') || 0);
          const lastSeenCustomerId = Number(localStorage.getItem('admin_last_seen_customer_id') || 0);

          const newOrders = Math.max(0, latestOrderId - lastSeenOrderId);
          const newCustomers = Math.max(0, latestCustomerId - lastSeenCustomerId);

          return {
            orders: newOrders,
            customers: newCustomers,
            latestOrderId,
            latestCustomerId
          };
        });
      } catch (error) {
        console.error('Failed to fetch admin notifications:', error);
      }
    };

    fetchNotifications();
    notificationsPollRef.current = setInterval(fetchNotifications, 15000);

    return () => {
      if (notificationsPollRef.current) {
        clearInterval(notificationsPollRef.current);
        notificationsPollRef.current = null;
      }
    };
  }, [adminToken]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_sidebar_collapsed', isAdminSidebarCollapsed ? 'true' : 'false');
    }
  }, [isAdminSidebarCollapsed]);

  const login = (userData, token) => {
    setUser(userData);
    setUserToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userChanged', { detail: { user: userData } }));
    }
  };

  const logout = () => {
    setUser(null);
    setUserToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userChanged', { detail: { user: null } }));
    }
  };

  const adminLogin = (adminData, token) => {
    setAdminUser(adminData);
    setAdminToken(token);
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(adminData));
  };

  const adminLogout = () => {
    setAdminUser(null);
    setAdminToken('');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const markAdminOrdersSeen = () => {
    setAdminNotifications((prev) => {
      const latestId = prev.latestOrderId || 0;
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_last_seen_order_id', String(latestId));
        localStorage.setItem('admin_latest_order_id', String(latestId));
      }
      return { ...prev, orders: 0 };
    });
  };

  const markAdminCustomersSeen = () => {
    setAdminNotifications((prev) => {
      const latestId = prev.latestCustomerId || 0;
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_last_seen_customer_id', String(latestId));
        localStorage.setItem('admin_latest_customer_id', String(latestId));
      }
      return { ...prev, customers: 0 };
    });
  };

  const toggleSidebar = () => {
    setIsAdminSidebarCollapsed((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent
        user={user}
        userToken={userToken}
        login={login}
        logout={logout}
        adminUser={adminUser}
        adminToken={adminToken}
        adminLogin={adminLogin}
        adminLogout={adminLogout}
        isSidebarCollapsed={isAdminSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        adminNotifications={adminNotifications}
        markAdminOrdersSeen={markAdminOrdersSeen}
        markAdminCustomersSeen={markAdminCustomersSeen}
      />
    </Router>
  );
}

export default App;

