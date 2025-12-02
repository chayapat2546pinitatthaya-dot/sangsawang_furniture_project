import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import './AdminDashboard.css';

const STATUS_MAP = {
  pending: { variant: 'warning', label: 'รออนุมัติ', color: '#FFD700' },
  awaiting_payment: { variant: 'info', label: 'รอชำระเงิน', color: '#00BFFF' },
  approved: { variant: 'success', label: 'อนุมัติแล้ว', color: '#32CD32' },
  waiting_for_delivery: { variant: 'primary', label: 'รอจัดส่ง', color: '#9370DB' },
  completed: { variant: 'success', label: 'ส่งมอบสำเร็จ', color: '#1DB954' },
  cancelled: { variant: 'danger', label: 'ยกเลิกโดยผู้ดูแล', color: '#000000' },
  cancelled_by_customer: { variant: 'danger', label: 'ลูกค้ายกเลิก', color: '#FF6B6B' }
};

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return `฿${number.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH');
};

export default function AdminDashboard({
  admin,
  logout,
  isSidebarCollapsed,
  toggleSidebar,
  adminNotifications,
  markAdminOrdersSeen,
  markAdminCustomersSeen
}) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    newCustomersThisMonth: 0
  });
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        axios.get('/api/orders'),
        axios.get('/api/admin/customers')
      ]);

      const allOrders = ordersRes.data || [];
      const allCustomers = customersRes.data || [];

      // Calculate today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Calculate this month's date range
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      // Filter today's orders
      const todayOrders = allOrders.filter((order) => {
        const orderDate = new Date(order.order_date);
        return orderDate >= today && orderDate <= todayEnd;
      });

      // Calculate today's revenue
      const todayRevenue = todayOrders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      );

      // Filter new customers this month
      const newCustomersThisMonth = allCustomers.filter((customer) => {
        if (!customer.createdAt) return false;
        const customerDate = new Date(customer.createdAt);
        return customerDate >= monthStart && customerDate <= monthEnd;
      }).length;

      // Filter pending orders
      const pendingOrdersList = allOrders.filter((order) => order.order_status === 'pending');

      setStats({
        todayRevenue,
        todayOrders: todayOrders.length,
        pendingOrders: pendingOrdersList.length,
        newCustomersThisMonth
      });

      // Sort pending orders by OrderID (newest/highest first)
      setOrders(
        pendingOrdersList.slice().sort((a, b) => {
          const idA = Number(a.order_id) || 0;
          const idB = Number(b.order_id) || 0;
          return idB - idA;
        })
      );

      setLastFetchedAt(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      setSelectedOrder(response.data);
      setIsSlidePanelOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleCloseSlidePanel = () => {
    setIsSlidePanelOpen(false);
    setSelectedOrder(null);
  };

  const refreshAfterAction = async () => {
    await fetchDashboardData();
    if (selectedOrder) {
      try {
        const response = await axios.get(`/api/orders/${selectedOrder.order_id}`);
        setSelectedOrder(response.data);
      } catch (error) {
        console.error('Error refreshing selected order:', error);
      }
    }
  };

  const handleApproveOrder = async (orderId) => {
    if (!window.confirm('ยืนยันการอนุมัติคำสั่งซื้อนี้?')) {
      return;
    }
    setActionLoadingId(orderId);
    try {
      await axios.put(`/api/orders/approve/${orderId}`);
      await refreshAfterAction();
    } catch (error) {
      console.error('Error approving order:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!window.confirm('ต้องการยกเลิกคำสั่งซื้อนี้หรือไม่?')) {
      return;
    }
    setActionLoadingId(orderId);
    try {
      await axios.put(`/api/orders/reject/${orderId}`);
      await refreshAfterAction();
    } catch (error) {
      console.error('Error rejecting order:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/admin/orders?search=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_MAP[status] || { variant: 'secondary', label: status, color: '#666' };
    return (
      <span className="dashboard-status-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  const kpiCards = useMemo(
    () => [
      {
        key: 'todayRevenue',
        label: 'ยอดขายรวมวันนี้',
        value: formatCurrency(stats.todayRevenue),
        icon: 'bi bi-currency-dollar',
        gradient: 'linear-gradient(135deg, rgba(77, 166, 255, 0.15) 0%, rgba(29, 185, 84, 0.15) 100%)',
        borderColor: 'rgba(77, 166, 255, 0.3)'
      },
      {
        key: 'todayOrders',
        label: 'คำสั่งซื้อใหม่วันนี้',
        value: `${stats.todayOrders.toLocaleString('th-TH')} รายการ`,
        icon: 'bi bi-cart-plus',
        gradient: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%)',
        borderColor: 'rgba(255, 193, 7, 0.3)'
      },
      {
        key: 'pendingOrders',
        label: 'คำสั่งซื้อรออนุมัติ',
        value: `${stats.pendingOrders.toLocaleString('th-TH')} รายการ`,
        icon: 'bi bi-hourglass-split',
        gradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)',
        borderColor: 'rgba(255, 215, 0, 0.3)'
      },
      {
        key: 'newCustomers',
        label: 'ลูกค้าใหม่เดือนนี้',
        value: `${stats.newCustomersThisMonth.toLocaleString('th-TH')} คน`,
        icon: 'bi bi-people',
        gradient: 'linear-gradient(135deg, rgba(147, 112, 219, 0.15) 0%, rgba(156, 39, 176, 0.15) 100%)',
        borderColor: 'rgba(147, 112, 219, 0.3)'
      }
    ],
    [stats]
  );


  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <AdminHeader
          admin={admin}
          onLogout={logout}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <div className="admin-dashboard__loading">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">กำลังรวบรวมข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminHeader
        admin={admin}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        adminNotifications={adminNotifications}
        markAdminOrdersSeen={markAdminOrdersSeen}
        markAdminCustomersSeen={markAdminCustomersSeen}
      />

      <Container fluid className="admin-dashboard__container">
        {/* Header Section */}
        <section className="admin-dashboard__header">
          <div className="admin-dashboard__header-content">
            <div>
              <h1 className="admin-dashboard__title">Sangsawang Dashboard</h1>
              <p className="admin-dashboard__subtitle">ภาพรวมธุรกิจของคุณ</p>
            </div>
            <div className="admin-dashboard__header-meta">
              <span className="admin-dashboard__date">
                <i className="bi bi-calendar3"></i>
                {new Date().toLocaleDateString('th-TH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {lastFetchedAt && (
                <span className="admin-dashboard__last-updated">
                  <i className="bi bi-clock"></i>
                  อัปเดตล่าสุด: {lastFetchedAt.toLocaleTimeString('th-TH')}
                </span>
              )}
            </div>
          </div>

          <div className="admin-dashboard__header-actions">
            <form className="admin-dashboard__quick-search" onSubmit={handleQuickSearch}>
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="ค้นหาอย่างเร็ว: คำสั่งซื้อ / ชื่อลูกค้า / เบอร์โทร"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
              />
            </form>
            <Button variant="primary" className="admin-dashboard__refresh-btn" onClick={fetchDashboardData}>
              <i className="bi bi-arrow-repeat"></i>
              รีเฟรชข้อมูล
            </Button>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="admin-dashboard__kpi">
          <Row className="g-2">
            {kpiCards.map((card) => (
              <Col key={card.key} xs={12} sm={6} lg={3}>
                <div
                  className="admin-dashboard__kpi-card"
                  style={{
                    background: card.gradient,
                    borderColor: card.borderColor
                  }}
                >
                  <div className="admin-dashboard__kpi-icon">
                    <i className={card.icon}></i>
                  </div>
                  <div className="admin-dashboard__kpi-content">
                    <span className="admin-dashboard__kpi-label">{card.label}</span>
                    <strong className="admin-dashboard__kpi-value">{card.value}</strong>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        {/* Main Content - Order Overview */}
        <Card className="admin-dashboard__panel">
          <div className="admin-dashboard__panel-header">
            <div>
              <h2>ออเดอร์รอการอนุมัติ</h2>
              <p>ออเดอร์ที่ยังรอการอนุมัติทั้งหมด {orders.length.toLocaleString('th-TH')} ชิ้น</p>
            </div>
            <Link to="/admin/orders" className="admin-dashboard__panel-link">
              ดูทั้งหมด <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          <div className="admin-dashboard__panel-body">
            {orders.length > 0 ? (
              <Table responsive hover className="admin-dashboard__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ลูกค้า</th>
                    <th>ยอดรวม</th>
                    <th>สถานะ</th>
                    <th>วันที่</th>
                    <th className="text-end">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td className="fw-semibold">#{order.order_id}</td>
                      <td>
                        <div className="admin-dashboard__customer-info">
                          <strong>
                            {order.customer_fname} {order.customer_lname}
                          </strong>
                          <span>{order.customer_tel || '-'}</span>
                        </div>
                      </td>
                      <td className="admin-dashboard__amount">{formatCurrency(order.total_amount)}</td>
                      <td>{getStatusBadge(order.order_status)}</td>
                      <td>{formatDate(order.order_date)}</td>
                      <td className="text-end">
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                          {order.order_status === 'pending' && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="admin-dashboard__action-btn admin-dashboard__action-btn--approve"
                                title="อนุมัติ"
                                disabled={actionLoadingId === order.order_id}
                                onClick={() => handleApproveOrder(order.order_id)}
                              >
                                {actionLoadingId === order.order_id ? (
                                  <Spinner animation="border" size="sm" role="status">
                                    <span className="visually-hidden">Processing...</span>
                                  </Spinner>
                                ) : (
                                  <i className="bi bi-check-circle"></i>
                                )}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="admin-dashboard__action-btn admin-dashboard__action-btn--reject"
                                title="ยกเลิก"
                                disabled={actionLoadingId === order.order_id}
                                onClick={() => handleRejectOrder(order.order_id)}
                              >
                                {actionLoadingId === order.order_id ? (
                                  <Spinner animation="border" size="sm" role="status">
                                    <span className="visually-hidden">Processing...</span>
                                  </Spinner>
                                ) : (
                                  <i className="bi bi-x-circle"></i>
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="admin-dashboard__action-btn admin-dashboard__action-btn--view"
                            title="ดูรายละเอียด"
                            onClick={() => handleViewOrderDetails(order.order_id)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="admin-dashboard__empty-state">
                <i className="bi bi-clipboard-minus"></i>
                <strong>ยังไม่มีคำสั่งซื้อใหม่</strong>
                <p>เมื่อมีคำสั่งซื้อเข้ามา จะเห็นรายการล่าสุดที่นี่ทันที</p>
              </div>
            )}
          </div>
        </Card>
      </Container>

      {/* Slide Panel for Order Details */}
      <div className={`admin-dashboard__slide-panel ${isSlidePanelOpen ? 'is-open' : ''}`}>
        <div className="admin-dashboard__slide-panel-header">
          <h3>
            <i className="bi bi-receipt"></i>
            รายละเอียดคำสั่งซื้อ {selectedOrder ? `#${selectedOrder.order_id}` : ''}
          </h3>
          <button
            className="admin-dashboard__slide-panel-close"
            onClick={handleCloseSlidePanel}
            aria-label="ปิด"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        {selectedOrder && (
          <div className="admin-dashboard__slide-panel-body">
            <div className="admin-dashboard__detail-section">
              <h4>
                <i className="bi bi-person"></i>
                ข้อมูลลูกค้า
              </h4>
              <div className="admin-dashboard__detail-content">
                <div className="admin-dashboard__detail-row">
                  <span>ชื่อ:</span>
                  <strong>
                    {selectedOrder.customer_fname} {selectedOrder.customer_lname}
                  </strong>
                </div>
                <div className="admin-dashboard__detail-row">
                  <span>เบอร์:</span>
                  <strong>{selectedOrder.customer_tel || '-'}</strong>
                </div>
                <div className="admin-dashboard__detail-row">
                  <span>อีเมล:</span>
                  <strong>{selectedOrder.customer_email || '-'}</strong>
                </div>
              </div>
            </div>

            <div className="admin-dashboard__detail-section">
              <h4>
                <i className="bi bi-box-seam"></i>
                รายการสินค้า
              </h4>
              <div className="admin-dashboard__detail-content">
                {selectedOrder.details && selectedOrder.details.length > 0 ? (
                  <div className="admin-dashboard__detail-items">
                    {selectedOrder.details.map((item) => (
                      <div key={item.order_detail_id} className="admin-dashboard__detail-item">
                        <div className="admin-dashboard__detail-item-name">{item.product_name}</div>
                        <div className="admin-dashboard__detail-item-meta">
                          <span>x{item.quantity}</span>
                          <strong>{formatCurrency(item.price)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">ไม่มีรายการสินค้า</p>
                )}
              </div>
            </div>

            <div className="admin-dashboard__detail-section">
              <h4>
                <i className="bi bi-currency-dollar"></i>
                สรุปยอด
              </h4>
              <div className="admin-dashboard__detail-content">
                <div className="admin-dashboard__detail-row">
                  <span>ยอดรวม:</span>
                  <strong className="admin-dashboard__detail-total">
                    {formatCurrency(selectedOrder.total_amount)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="admin-dashboard__detail-actions">
              <Button variant="primary" onClick={() => navigate(`/admin/orders`)}>
                <i className="bi bi-arrow-right me-1"></i>
                ไปที่หน้าจัดการคำสั่งซื้อ
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide Panel Overlay */}
      {isSlidePanelOpen && (
        <div className="admin-dashboard__slide-panel-overlay" onClick={handleCloseSlidePanel}></div>
      )}
    </div>
  );
}
