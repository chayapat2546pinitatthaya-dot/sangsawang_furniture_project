import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import './AdminHeader.css';

export default function AdminHeader({
  admin,
  onLogout,
  isCollapsed = false,
  onToggleSidebar,
  adminNotifications = {},
  markAdminOrdersSeen,
  markAdminCustomersSeen
}) {
  const displayName = admin?.name || admin?.username || 'ผู้ดูแลระบบ';
  const email = admin?.email || '';
  const location = useLocation();
  const sidebarClassNames = ['admin-sidebar'];
  if (isCollapsed) {
    sidebarClassNames.push('admin-sidebar--collapsed');
  }
  const canToggleSidebar = typeof onToggleSidebar === 'function';

  const NAV_LINKS = [
    {
      to: '/admin/dashboard',
      icon: 'bi bi-speedometer2',
      label: 'แดชบอร์ด'
    },
    {
      to: '/admin/orders',
      icon: 'bi bi-card-checklist',
      label: 'คำสั่งซื้อ',
      notificationKey: 'orders'
    },
    {
      to: '/admin/products',
      icon: 'bi bi-box-seam',
      label: 'สินค้า'
    },
    {
      to: '/admin/customers',
      icon: 'bi bi-people',
      label: 'ลูกค้า',
      notificationKey: 'customers'
    }
  ];

  return (
    <aside className={sidebarClassNames.join(' ')} aria-label="แถบเมนูผู้ดูแล">
      <div className="admin-sidebar__brand">
        <Link to="/admin/dashboard" className="admin-sidebar__logo">
          <i className="bi bi-gear-wide-connected"></i>
          <span className="admin-sidebar__logo-text" aria-hidden={isCollapsed}>
            SangSawang Admin
          </span>
        </Link>
        {canToggleSidebar && (
          <button
            type="button"
            className="admin-sidebar__toggle"
            onClick={onToggleSidebar}
            aria-pressed={isCollapsed}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'ขยายแถบเมนูผู้ดูแล' : 'ย่อแถบเมนูผู้ดูแล'}
          >
            <i className={`bi ${isCollapsed ? 'bi-arrow-bar-right' : 'bi-arrow-bar-left'}`}></i>
          </button>
        )}
      </div>

      <nav className="admin-sidebar__nav">
        {NAV_LINKS.map((item) => {
          const itemPath = item.to.split('?')[0];
          const currentPath = location.pathname;
          const currentSearch = location.search;
          const fullCurrentPath = currentPath + currentSearch;
          
          // ตรวจสอบ active state ของ main menu
          let isMainActive = false;
          if (item.to.includes('?')) {
            isMainActive = fullCurrentPath === item.to;
          } else {
            isMainActive = currentPath === itemPath || 
              (currentPath.startsWith(itemPath) && itemPath !== '/admin/dashboard');
          }
          
          // ตรวจสอบว่ามี submenu active หรือไม่
          let hasActiveSubItem = false;
          if (item.subItems) {
            hasActiveSubItem = item.subItems.some(subItem => {
              if (subItem.to.includes('?')) {
                return fullCurrentPath === subItem.to;
              }
              return currentPath === subItem.to.split('?')[0];
            });
          }
          
          const isParentActive = isMainActive || hasActiveSubItem;
          
          return (
            <div key={item.to} className="admin-sidebar__nav-group">
              <Link
                to={item.to}
                className={`admin-sidebar__nav-link ${isMainActive ? 'is-active' : ''} ${isParentActive ? 'has-active-child' : ''}`}
                onClick={() => {
                  if (item.notificationKey === 'orders' && typeof markAdminOrdersSeen === 'function') {
                    markAdminOrdersSeen();
                  }
                  if (item.notificationKey === 'customers' && typeof markAdminCustomersSeen === 'function') {
                    markAdminCustomersSeen();
                  }
                }}
              >
                <span className="admin-sidebar__nav-icon">
                  <i className={item.icon}></i>
                  {item.notificationKey && adminNotifications[item.notificationKey] > 0 && (
                    <span className="admin-sidebar__nav-badge">
                      {adminNotifications[item.notificationKey] > 9 ? '9+' : adminNotifications[item.notificationKey]}
                    </span>
                  )}
                </span>
                <span className="admin-sidebar__nav-label" aria-hidden={isCollapsed}>
                  {item.label}
                </span>
              </Link>
              {item.subItems && !isCollapsed && (
                <div className="admin-sidebar__subnav">
                  {item.subItems.map((subItem) => {
                    const subItemPath = subItem.to.split('?')[0];
                    const isSubActive = subItem.to.includes('?') 
                      ? fullCurrentPath === subItem.to
                      : currentPath === subItemPath;
                    
                    return (
                      <Link
                        key={subItem.to}
                        to={subItem.to}
                        className={`admin-sidebar__subnav-link ${isSubActive ? 'is-active' : ''}`}
                      >
                        <span className="admin-sidebar__subnav-icon">
                          <i className={subItem.icon}></i>
                        </span>
                        <span className="admin-sidebar__subnav-label">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__profile">
          <div className="admin-sidebar__avatar">
            <i className="bi bi-person"></i>
          </div>
          <div className="admin-sidebar__meta">
            <strong>{displayName}</strong>
            {email && <span>{email}</span>}
          </div>
        </div>
        <Button variant="light" size="sm" className="admin-sidebar__logout" onClick={onLogout}>
          <i className="bi bi-box-arrow-right me-2"></i>
          <span className="admin-sidebar__logout-label">ออกจากระบบ</span>
        </Button>
      </div>
    </aside>
  );
}

