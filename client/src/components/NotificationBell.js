import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

export default function NotificationBell({
  adminNotifications = {},
  markAdminOrdersSeen,
  markAdminCustomersSeen
}) {
  const navigate = useNavigate();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const notificationRef = useRef(null);

  // คำนวณจำนวนรวมของแจ้งเตือน
  const totalNotifications = useMemo(() => {
    if (!adminNotifications) return 0;
    return (adminNotifications.orders || 0) + (adminNotifications.customers || 0);
  }, [adminNotifications]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationMenu && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificationMenu]);

  return (
    <div className="admin-notification-bell" ref={notificationRef}>
      <button 
        className="admin-notification-bell__btn" 
        title="แจ้งเตือน"
        onClick={() => setShowNotificationMenu(!showNotificationMenu)}
      >
        <i className="bi bi-bell"></i>
        {totalNotifications > 0 && (
          <span className="admin-notification-bell__badge">{totalNotifications}</span>
        )}
      </button>
      
      {/* Notification Dropdown Menu */}
      {showNotificationMenu && (
        <div className="admin-notification-bell__menu">
          <div className="admin-notification-bell__menu-header">
            <span>แจ้งเตือน</span>
            {totalNotifications > 0 && (
              <span className="admin-notification-bell__menu-count">
                {totalNotifications} รายการใหม่
              </span>
            )}
          </div>
          <div className="admin-notification-bell__menu-items">
            <button
              className="admin-notification-bell__menu-item"
              onClick={() => {
                if (markAdminOrdersSeen) markAdminOrdersSeen();
                setShowNotificationMenu(false);
                navigate('/admin/orders');
              }}
            >
              <div className="admin-notification-bell__menu-item-content">
                <i className="bi bi-card-checklist"></i>
                <span>คำสั่งซื้อสินค้า</span>
              </div>
              {adminNotifications?.orders > 0 && (
                <span className="admin-notification-bell__menu-item-badge">
                  {adminNotifications.orders}
                </span>
              )}
            </button>
            
            <button
              className="admin-notification-bell__menu-item"
              onClick={() => {
                setShowNotificationMenu(false);
                navigate('/admin/products');
              }}
            >
              <div className="admin-notification-bell__menu-item-content">
                <i className="bi bi-box-seam"></i>
                <span>สินค้า</span>
              </div>
              {/* จำนวนสินค้าใหม่จะแสดงในหน้า Products */}
            </button>
            
            <button
              className="admin-notification-bell__menu-item"
              onClick={() => {
                if (markAdminCustomersSeen) markAdminCustomersSeen();
                setShowNotificationMenu(false);
                navigate('/admin/customers');
              }}
            >
              <div className="admin-notification-bell__menu-item-content">
                <i className="bi bi-people"></i>
                <span>ลูกค้า</span>
              </div>
              {adminNotifications?.customers > 0 && (
                <span className="admin-notification-bell__menu-item-badge">
                  {adminNotifications.customers}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


