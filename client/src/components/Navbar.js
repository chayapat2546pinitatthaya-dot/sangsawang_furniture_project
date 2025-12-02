import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { fetchCartItems, calculateCartCount } from '../utils/cartApi';

export default function Navigation({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isCartHighlighted, setIsCartHighlighted] = useState(false);
  const userMenuRef = useRef(null);
  const cartHighlightTimeout = useRef(null);

  const handleLogout = () => {
    logout();
    if (user && user.role === 'admin') {
      navigate('/admin/login');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const readCartCount = async () => {
      if (!user) {
        if (isMounted) {
          setCartCount(0);
        }
        return 0;
      }
      const result = await fetchCartItems();
      if (!isMounted) {
        return 0;
      }
      if (result.unauthorized || result.error) {
        setCartCount(0);
        return 0;
      }
      const total = calculateCartCount(result.items);
      setCartCount(total);
      return total;
    };

    const triggerCartHighlight = () => {
      if (cartHighlightTimeout.current) {
        clearTimeout(cartHighlightTimeout.current);
      }
      setIsCartHighlighted(true);
      cartHighlightTimeout.current = setTimeout(() => {
        setIsCartHighlighted(false);
      }, 700);
    };

    const handleCartUpdated = (event) => {
      const detail = event?.detail ?? {};
      if (typeof detail.count === 'number') {
        setCartCount(detail.count);
      } else {
        readCartCount();
      }
      if (!detail.silent) {
        triggerCartHighlight();
      }
    };

    if (user) {
      readCartCount();
    } else {
      setCartCount(0);
    }

    window.addEventListener('cartUpdated', handleCartUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (cartHighlightTimeout.current) {
        clearTimeout(cartHighlightTimeout.current);
      }
    };
  }, []);

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const isCustomerOrGuest = !user || user.role !== 'admin';

  const linkIsActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const renderPrimaryLinks = () => (
    <>
      <Link
        className={`ss-nav-link ss-home-link${linkIsActive('/') ? ' active' : ''}`}
        to="/"
        onClick={() => setIsMenuOpen(false)}
      >
        <span className="ss-home-icon">
          <i className="bi bi-house-door"></i>
        </span>
        <span className="ss-home-label">หน้าแรก</span>
      </Link>
      {isCustomerOrGuest && (
        <Link
          className={`ss-nav-link ss-orders-link${linkIsActive('/orders') ? ' active' : ''}`}
          to={user ? "/orders" : "/login"}
          onClick={() => {
            setIsMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
        >
          <span className="ss-orders-icon">
            <i className="bi bi-receipt"></i>
          </span>
          <span className="ss-orders-label">คำสั่งซื้อ</span>
        </Link>
      )}
      <Link
        className={`ss-nav-link ss-cart-link${linkIsActive('/cart') ? ' active' : ''}${isCartHighlighted ? ' bump' : ''}`}
        to={user ? "/cart" : "/login"}
        onClick={() => setIsMenuOpen(false)}
      >
        <span className="ss-cart-icon">
          <i className="bi bi-cart"></i>
          {cartCount > 0 && <span className="ss-cart-badge">{cartCount}</span>}
        </span>
        <span className="ss-cart-label">ตะกร้าสินค้า</span>
      </Link>
    </>
  );

  const renderUserActions = () => {
    if (user) {
      const menuItems = user.role === 'admin'
        ? [
            { label: 'แดชบอร์ด', to: '/admin/dashboard' },
            { label: 'ออกจากระบบ', action: handleLogout }
          ]
        : [
            { label: 'บัญชีของฉัน', to: '/profile' },
            { label: 'การผ่อนชำระ', to: '/cards' },
            { label: 'ออกจากระบบ', action: handleLogout }
          ];

      const fullName = user.customer_fname && user.customer_lname
        ? `${user.customer_fname} ${user.customer_lname}`
        : user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : null;
      const username = user.username || 'สมาชิก';

      return (
        <div className="ss-user-actions">
          <div className="ss-user-name-wrapper">
            {fullName && <span className="ss-user-name">{fullName}</span>}
            <span className="ss-username">{username}</span>
          </div>
          <div className="ss-user-shell" ref={userMenuRef}>
            <button
              type="button"
              className={`ss-user-icon${isUserMenuOpen ? ' open' : ''}`}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen}
            >
              <i className="bi bi-person"></i>
            </button>
            <div className={`ss-user-dropdown${isUserMenuOpen ? ' show' : ''}`}>
              <div className="ss-user-dropdown-inner">
                {user.role !== 'admin' && (
                  <div className="ss-user-account-info">
                    <div className="ss-user-account-avatar">
                      <i className="bi bi-person-circle"></i>
                    </div>
                    <div className="ss-user-account-details">
                      <strong>{user.username || 'สมาชิก'}</strong>
                      <span>{user.email || 'ไม่ระบุอีเมล'}</span>
                    </div>
                  </div>
                )}
                {user.role !== 'admin' && <div className="ss-user-dropdown-divider"></div>}
                {menuItems.map((item) =>
                  item.to ? (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => {
                        closeMenus();
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        item.action();
                      }}
                    >
                      {item.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="ss-auth-buttons">
        <Link className="ss-btn-outline" to="/login" onClick={() => setIsMenuOpen(false)}>
          เข้าสู่ระบบ
        </Link>
        <Link className="ss-btn-solid" to="/register" onClick={() => setIsMenuOpen(false)}>
          สมัครสมาชิก
        </Link>
      </div>
    );
  };

  return (
    <header className="ss-navbar">
      <div className="ss-navbar-inner">
        <Link
          className="ss-brand"
          to={user && user.role === 'admin' ? '/admin/dashboard' : '/'}
          onClick={() => setIsMenuOpen(false)}
        >
          <img src="/images/sangsawanglogo.png" alt="Sangsawang Furniture" />
          <div className="ss-brand-text">
            <span className="ss-brand-th">แสงสว่างเฟอร์นิเจอร์</span>
            <span className="ss-brand-en">Sangsawang Furniture</span>
          </div>
        </Link>

        <button
          type="button"
          className={`ss-menu-toggle${isMenuOpen ? ' open' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`ss-primary-nav${isMenuOpen ? ' open' : ''}`}>
          {isCustomerOrGuest && renderPrimaryLinks()}
          {renderUserActions()}
        </nav>
      </div>
    </header>
  );
}
