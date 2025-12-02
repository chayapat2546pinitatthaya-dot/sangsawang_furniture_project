import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import NotificationBell from '../../components/NotificationBell';
import './AdminOrders.css';

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'รออนุมัติ', color: '#FFD700' },
  { value: 'awaiting_payment', label: 'รอชำระเงิน', color: '#00BFFF' },
  { value: 'approved', label: 'อนุมัติแล้ว', color: '#32CD32' },
  { value: 'waiting_for_delivery', label: 'รอจัดส่ง', color: '#9370DB' },
  { value: 'completed', label: 'ส่งมอบสำเร็จ', color: '#1DB954' },
  { value: 'cancelled', label: 'ยกเลิกโดยผู้ดูแล', color: '#000000' },
  { value: 'cancelled_by_customer', label: 'ลูกค้ายกเลิก', color: '#FF6B6B' }
];

const ALLOWED_STATUS_FILTERS = new Set(['all', ...ORDER_STATUS_OPTIONS.map((option) => option.value)]);

// สร้างเดือนและปีเริ่มต้น (เดือนที่แล้ว)
const getInitialMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear()
  };
};

export default function AdminOrders({
  admin,
  logout,
  isSidebarCollapsed,
  toggleSidebar,
  adminNotifications,
  markAdminOrdersSeen,
  markAdminCustomersSeen
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ show: false, text: '', variant: '' });
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const notifications = [];
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [previousOrdersCount, setPreviousOrdersCount] = useState(0);
  const [previousOrdersIds, setPreviousOrdersIds] = useState(new Set());
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const initialMonthYear = getInitialMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(initialMonthYear.month);
  const [selectedYear, setSelectedYear] = useState(initialMonthYear.year);
  
  // สร้างรายการเดือน (1-12)
  const months = [
    { value: 1, label: 'มกราคม' },
    { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' },
    { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' },
    { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' },
    { value: 12, label: 'ธันวาคม' }
  ];
  
  // สร้างรายการปี (เริ่มจากเดือนที่แล้ว ไปอีก 5 ปี)
  const getYears = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startYear = lastMonth.getFullYear();
    const years = [];
    for (let i = 0; i <= 5; i++) {
      years.push(startYear + i);
    }
    return years;
  };
  
  const years = getYears();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);


  // Sync filter จาก URL query params (เมื่อ component mount หรือ URL เปลี่ยนจากภายนอก)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    const newFilter = filterParam && ALLOWED_STATUS_FILTERS.has(filterParam) ? filterParam : 'all';
    setStatusFilter((currentFilter) => {
      // อัปเดตเฉพาะเมื่อค่าเปลี่ยนจริงๆ
      return newFilter !== currentFilter ? newFilter : currentFilter;
    });
  }, [location.search]);

  // Update URL เมื่อเปลี่ยน filter
  const handleStatusFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    const params = new URLSearchParams(location.search);
    if (newFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    const newSearch = params.toString();
    navigate(`/admin/orders${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      const newOrders = response.data;
      
      // ตรวจสอบว่ามีออเดอร์ใหม่หรือไม่ (ไม่แสดง popup)
      if (previousOrdersIds.size > 0 && !isLoading) {
        const newOrderIds = new Set(newOrders.map(o => o.order_id));
        // อัปเดต previousOrdersIds โดยไม่แสดง popup
      }
      
      setOrders(newOrders);
      setPreviousOrdersIds(new Set(newOrders.map(o => o.order_id)));
      setPreviousOrdersCount(newOrders.length);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleViewDetails = async (orderId) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      setSelectedOrder(response.data);
      setIsSlidePanelOpen(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้';
      setMessage({ show: true, text: errorMessage, variant: 'danger' });
      setTimeout(() => setMessage({ show: false }), 3000);
    }
  };

  const handleCloseSlidePanel = () => {
    setIsSlidePanelOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusDraftChange = (orderId, nextStatus) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [orderId]: nextStatus
    }));
  };

  const playNotificationSound = () => {
    try {
      // สร้างเสียงเตือนแบบ beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // ความถี่เสียง
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('ไม่สามารถเล่นเสียงเตือนได้:', error);
    }
  };

  const showToast = (message, variant = 'success', playSound = false) => {
    const id = Date.now();
    const toast = { id, message, variant };
    setToasts((prev) => [...prev, toast]);
    
    if (playSound) {
      playNotificationSound();
    }
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleStatusUpdate = async (orderId, reason = null) => {
    const targetOrder = orders.find((order) => order.order_id === orderId);
    if (!targetOrder) {
      return;
    }

    const nextStatus = statusDrafts[orderId] ?? targetOrder.order_status;
    if (!nextStatus || nextStatus === targetOrder.order_status) {
      showToast('สถานะคำสั่งซื้อไม่ได้เปลี่ยนแปลง', 'info');
      return;
    }

    // ถ้าเลือกสถานะ cancelled ให้แสดง modal เพื่อกรอกสาเหตุ
    if (nextStatus === 'cancelled' && !reason) {
      setCancelOrderId(orderId);
      setShowCancelModal(true);
      return;
    }

    setSavingStatusId(orderId);
    try {
      const payload = { status: nextStatus };
      if (nextStatus === 'cancelled' && reason) {
        payload.cancel_reason = reason;
      }
      
      await axios.put(`/api/orders/${orderId}/status`, payload);
      const statusLabel = ORDER_STATUS_OPTIONS.find((opt) => opt.value === nextStatus)?.label || nextStatus;
      showToast(`คำสั่งซื้อ #${orderId} เปลี่ยนสถานะเป็น "${statusLabel}" เรียบร้อยแล้ว`, 'success');
      setStatusDrafts((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      await fetchOrders();
      if (selectedOrder && selectedOrder.order_id === orderId) {
        const updatedResponse = await axios.get(`/api/orders/${orderId}`);
        setSelectedOrder(updatedResponse.data);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้';
      showToast(errorMessage, 'danger');
    } finally {
      setSavingStatusId(null);
      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      showToast('กรุณากรอกสาเหตุการยกเลิก', 'warning');
      return;
    }
    if (cancelOrderId) {
      handleStatusUpdate(cancelOrderId, cancelReason.trim());
    }
  };

  const handleApprove = async (orderId) => {
    if (!window.confirm('ยืนยันการอนุมัติคำสั่งซื้อนี้?')) {
      return;
    }

    try {
      await axios.put(`/api/orders/approve/${orderId}`);
      showToast(`คำสั่งซื้อ #${orderId} อนุมัติเรียบร้อยแล้ว`, 'success');
      await fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      showToast('เกิดข้อผิดพลาดในการอนุมัติคำสั่งซื้อ', 'danger');
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm('ต้องการไม่อนุมัติคำสั่งซื้อนี้หรือไม่?')) {
      return;
    }

    try {
      await axios.put(`/api/orders/reject/${orderId}`);
      showToast(`คำสั่งซื้อ #${orderId} ถูกยกเลิกแล้ว`, 'warning');
      await fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      showToast('ไม่สามารถไม่อนุมัติคำสั่งซื้อได้', 'danger');
    }
  };

  const formatCurrency = (value) => {
    if (value == null || value === '') {
      return '-';
    }
    const number = Number(value);
    if (Number.isNaN(number)) {
      return '-';
    }
    return `฿${number.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatDate = (value) => {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    return `${day}/${month}/${year}`;
  };

  const getPaymentMethodLabel = (order) => {
    if (!order) {
      return '-';
    }
    const method = order.payment_method ? String(order.payment_method).toLowerCase() : '';
    if (method.includes('install')) {
      return 'ผ่อนชำระ';
    }
    if (method.includes('cash')) {
      return 'ชำระเต็มจำนวน';
    }
    if (method.includes('cod') || method.includes('delivery') || method.includes('ปลายทาง')) {
      return 'ชำระปลายทาง';
    }
    return order.installment_periods > 1 ? 'ผ่อนชำระ' : 'ชำระเต็มจำนวน';
  };

  const isInstallmentOrder = (order) => {
    if (!order) return false;
    const method = order.payment_method ? String(order.payment_method).toLowerCase() : '';
    if (method.includes('install')) {
      return true;
    }
    return Number(order.installment_periods) > 1;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'รออนุมัติ', color: '#ffd84d', textColor: '#222' },
      awaiting_payment: { variant: 'info', text: 'รอชำระเงิน', color: '#00BFFF', textColor: '#fff' },
      approved: { variant: 'success', text: 'อนุมัติแล้ว', color: '#32CD32', textColor: '#fff' },
      waiting_for_delivery: { variant: 'primary', text: 'รอจัดส่ง', color: '#9370DB', textColor: '#fff' },
      completed: { variant: 'success', text: 'ส่งมอบสำเร็จ', color: '#1DB954', textColor: '#fff' },
      cancelled: { variant: 'danger', text: 'ยกเลิกโดยผู้ดูแล', color: '#000000', textColor: '#fff' },
      cancelled_by_customer: { variant: 'danger', text: 'ลูกค้ายกเลิก', color: '#FF6B6B', textColor: '#fff' }
    };
    const config = statusConfig[status] || { variant: 'secondary', text: status, color: '#666', textColor: '#fff' };
    return (
      <span 
        className="order-status-badge" 
        style={{ 
          backgroundColor: config.color,
          color: config.textColor
        }}
      >
        {config.text}
      </span>
    );
  };

  const statusFilterOptions = useMemo(
    () => ({
      all: { label: 'ทั้งหมด', predicate: () => true },
      pending: { label: 'รออนุมัติ', predicate: (order) => order.order_status === 'pending' },
      awaiting_payment: {
        label: 'รอชำระเงิน',
        predicate: (order) => order.order_status === 'awaiting_payment'
      },
      approved: { label: 'อนุมัติแล้ว', predicate: (order) => order.order_status === 'approved' },
      waiting_for_delivery: {
        label: 'รอจัดส่ง',
        predicate: (order) => order.order_status === 'waiting_for_delivery'
      },
      completed: {
        label: 'ส่งมอบสำเร็จ',
        predicate: (order) => order.order_status === 'completed'
      },
      cancelled: {
        label: 'ยกเลิกโดยผู้ดูแล',
        predicate: (order) => order.order_status === 'cancelled'
      },
      cancelled_by_customer: {
        label: 'ลูกค้ายกเลิก',
        predicate: (order) => order.order_status === 'cancelled_by_customer'
      }
    }),
    []
  );

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    [orders]
  );

  // กรองข้อมูลสำหรับนับจำนวน (ไม่กรองตาม statusFilter)
  const ordersForCount = useMemo(() => {
    let result = orders;

    // Filter by search
    const cleanedSearch = orderSearch.replace(/#/g, '').trim().toLowerCase();
    if (cleanedSearch) {
      result = result.filter((order) => {
        const fields = [
          String(order.order_id),
          order.customer_fname,
          order.customer_lname,
          order.customer_email,
          order.customer_tel
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return fields.includes(cleanedSearch);
      });
    }

    // Filter by date range
    if (filterDateFrom || filterDateTo) {
      result = result.filter((order) => {
        const orderDate = new Date(order.order_date);
        if (filterDateFrom && orderDate < new Date(filterDateFrom)) {
          return false;
        }
        if (filterDateTo) {
          const toDate = new Date(filterDateTo);
          toDate.setHours(23, 59, 59, 999);
          if (orderDate > toDate) {
            return false;
          }
        }
        return true;
      });
    }

    // Filter by price range
    if (filterPriceMin || filterPriceMax) {
      result = result.filter((order) => {
        const amount = Number(order.total_amount) || 0;
        if (filterPriceMin && amount < Number(filterPriceMin)) {
          return false;
        }
        if (filterPriceMax && amount > Number(filterPriceMax)) {
          return false;
        }
        return true;
      });
    }

    // Filter by month and year
    if (selectedMonth && selectedYear) {
      result = result.filter((order) => {
        const orderDate = new Date(order.order_date);
        const orderMonth = orderDate.getMonth() + 1; // 1-12
        const orderYear = orderDate.getFullYear();
        return orderMonth === selectedMonth && orderYear === selectedYear;
      });
    }

    return result;
  }, [orders, orderSearch, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, selectedMonth, selectedYear]);

  // กรองข้อมูลสำหรับแสดงรายการ (กรองตาม statusFilter ด้วย)
  const filteredOrders = useMemo(() => {
    let result = ordersForCount;

    // Filter by status
    const filter = statusFilterOptions[statusFilter];
    if (filter) {
      result = result.filter(filter.predicate);
    }

    return result;
  }, [ordersForCount, statusFilter, statusFilterOptions]);

  // คำนวณ statusCounts จาก ordersForCount (กรองตามเดือนและปีแล้ว แต่ไม่กรองตาม statusFilter)
  const statusCounts = useMemo(() => {
    const baseCounts = Object.fromEntries(Object.keys(statusFilterOptions).map((key) => [key, 0]));
    baseCounts.all = ordersForCount.length;

    ordersForCount.forEach((order) => {
      Object.entries(statusFilterOptions).forEach(([key, option]) => {
        if (key === 'all') {
          return;
        }
        if (option.predicate(order)) {
          baseCounts[key] += 1;
        }
      });
    });

    return baseCounts;
  }, [ordersForCount, statusFilterOptions]);

  // คำนวณยอดขายต่อเดือน (จาก ordersForCount ที่กรองตามเดือนและปีแล้ว)
  const monthlyRevenue = useMemo(
    () => ordersForCount.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    [ordersForCount]
  );

  // คำนวณรายได้ต่องวดรวม (เฉพาะออเดอร์ที่มีการผ่อน)
  const totalInstallmentRevenue = useMemo(
    () =>
      ordersForCount.reduce((sum, order) => {
        const periods = Number(order.installment_periods) || 0;
        const totalAmount = Number(order.total_amount) || 0;
        if (periods > 0) {
          return sum + totalAmount / periods;
        }
        return sum;
      }, 0),
    [ordersForCount]
  );

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const idA = Number(a.order_id) || 0;
      const idB = Number(b.order_id) || 0;
      return idB - idA;
    });
  }, [filteredOrders]);

  const handleClearFilters = () => {
    handleStatusFilterChange('all');
    setOrderSearch('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    const initial = getInitialMonthYear();
    setSelectedMonth(initial.month);
    setSelectedYear(initial.year);
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'ชื่อลูกค้า', 'วันที่สั่งซื้อ', 'จำนวนงวด', 'รายได้ต่องวด', 'รายได้ทั้งหมด'];
    const data = [...ordersForCount].sort((a, b) => {
      const dateDiff = new Date(a.order_date).getTime() - new Date(b.order_date).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return (Number(a.order_id) || 0) - (Number(b.order_id) || 0);
    });
    const rows = data.map((order) => {
      const fullName = `${order.customer_fname || ''} ${order.customer_lname || ''}`.trim() || '-';
      const installmentPeriods = Number(order.installment_periods) || 0;
      const totalAmount = Number(order.total_amount) || 0;
      const monthlyPayment = installmentPeriods > 0 ? totalAmount / installmentPeriods : totalAmount;
      const formatNumber = (value) =>
        Number(value || 0)
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return [
        order.order_id,
        fullName,
        formatDate(order.order_date),
        installmentPeriods || '-',
        installmentPeriods > 0 ? formatNumber(monthlyPayment) : formatNumber(totalAmount),
        formatNumber(totalAmount)
      ];
    });

    const formatSummaryNumber = (value) =>
      Number(value || 0)
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = typeof cell === 'string' ? cell : String(cell);
            const escaped = value.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
    ];

    csvLines.push('');
    csvLines.push(`"รายได้ต่องวดทั้งหมด","${formatSummaryNumber(totalInstallmentRevenue)}"`);
    csvLines.push(`"รายได้ทั้งหมด","${formatSummaryNumber(monthlyRevenue)}"`);

    const csvContent = csvLines.join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
    link.click();
  };

  const statusSummary = useMemo(
    () => [
      { key: 'all', label: 'ทั้งหมด', count: statusCounts.all || 0, color: '#6c757d' },
      { key: 'pending', label: 'รออนุมัติ', count: statusCounts.pending || 0, color: '#FFD700' },
      { key: 'awaiting_payment', label: 'รอชำระเงิน', count: statusCounts.awaiting_payment || 0, color: '#00BFFF' },
      { key: 'waiting_for_delivery', label: 'รอจัดส่ง', count: statusCounts.waiting_for_delivery || 0, color: '#9370DB' },
      { key: 'completed', label: 'ส่งสำเร็จ', count: statusCounts.completed || 0, color: '#1DB954' },
      { key: 'cancelled', label: 'ยกเลิกโดยผู้ดูแล', count: statusCounts.cancelled || 0, color: '#000000' },
      { key: 'cancelled_by_customer', label: 'ลูกค้ายกเลิก', count: statusCounts.cancelled_by_customer || 0, color: '#FF6B6B' }
    ],
    [statusCounts]
  );

  if (isLoading) {
    return (
      <div className="admin-orders-page">
        <AdminHeader
          admin={admin}
          onLogout={logout}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <div className="admin-orders__loading">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted mt-3">กำลังดึงข้อมูลคำสั่งซื้อ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <AdminHeader
        admin={admin}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        adminNotifications={adminNotifications}
        markAdminOrdersSeen={markAdminOrdersSeen}
        markAdminCustomersSeen={markAdminCustomersSeen}
      />
      <NotificationBell
        adminNotifications={adminNotifications}
        markAdminOrdersSeen={markAdminOrdersSeen}
        markAdminCustomersSeen={markAdminCustomersSeen}
      />

      <div className="admin-orders__layout">
        <Container fluid className="admin-orders__container">
          {/* Header Bar */}
          <section className="admin-orders__header-bar">
            <div className="admin-orders__search-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="admin-orders__search-input"
                placeholder="ค้นหาเลขคำสั่งซื้อ ชื่อลูกค้า หรือเบอร์โทร"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>
            <div className="admin-orders__header-actions">
              <div className="admin-orders__month-year-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="admin-orders__month-select"
                  style={{ minWidth: '140px' }}
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="admin-orders__year-select"
                  style={{ minWidth: '100px' }}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <Button
                variant="primary"
                className="admin-orders__refresh-btn"
                onClick={fetchOrders}
              >
                <i className="bi bi-arrow-repeat"></i>
                รีเฟรชข้อมูล
              </Button>
              <Button
                variant="outline-primary"
                className="admin-orders__export-btn"
                onClick={handleExportCSV}
              >
                <i className="bi bi-download"></i>
                ดาวน์โหลดรายงาน
              </Button>
            </div>
          </section>

          {message.show && (
            <Alert
              variant={message.variant}
              dismissible
              onClose={() => setMessage({ show: false })}
              className="admin-orders-alert"
            >
              {message.text}
            </Alert>
          )}

          {/* Status Summary Bar - Filter Tabs */}
          <section className="admin-orders__status-summary">
            {statusSummary.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-orders__status-card ${statusFilter === item.key ? 'is-active' : ''}`}
                onClick={() => handleStatusFilterChange(item.key)}
                style={{ '--status-color': item.color }}
              >
                <span className="admin-orders__status-label">{item.label}</span>
                <strong className="admin-orders__status-count">{item.count}</strong>
              </button>
            ))}
            <div className="admin-orders__status-total">
              <span>ยอดขายรวม</span>
              <strong>{formatCurrency(totalRevenue)}</strong>
            </div>
            <div className="admin-orders__status-total" style={{ marginLeft: '16px' }}>
              <span>ยอดขายต่อเดือน</span>
              <strong style={{ color: '#00BFFF' }}>{formatCurrency(monthlyRevenue)}</strong>
            </div>
          </section>

          {/* Orders List - Card Table Hybrid */}
          <section className="admin-orders__list">
            {sortedOrders.length === 0 ? (
              <div className="admin-orders-empty-state">
                <div className="admin-orders-empty-state__icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <h4>ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข</h4>
                <p className="text-muted">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่นๆ อีกครั้ง</p>
                <Button variant="primary" onClick={handleClearFilters}>
                  ล้างตัวกรองทั้งหมด
                </Button>
              </div>
            ) : (
              <div className="admin-orders__cards">
                {/* Header Row */}
                <div className="admin-order-card__header-row">
                  <div className="admin-order-card__id-col">
                    <span className="admin-order-card__header-label">คำสั่งซื้อ</span>
                  </div>
                  <div className="admin-order-card__customer-col">
                    <span className="admin-order-card__header-label">รายละเอียดลูกค้า</span>
                  </div>
                  <div className="admin-order-card__date-col">
                    <span className="admin-order-card__header-label">วันที่</span>
                  </div>
                  <div className="admin-order-card__amount-col">
                    <span className="admin-order-card__header-label">ราคา</span>
                  </div>
                  <div className="admin-order-card__installment-col">
                    <span className="admin-order-card__header-label">งวด</span>
                  </div>
                  <div className="admin-order-card__status-col">
                    <span className="admin-order-card__header-label">สถานะ</span>
                  </div>
                  <div className="admin-order-card__status-edit-col">
                    <span className="admin-order-card__header-label">แก้ไขสถานะ</span>
                  </div>
                  <div className="admin-order-card__actions-col">
                    <span className="admin-order-card__header-label">จัดการ</span>
                  </div>
                </div>
                {sortedOrders.map((order, index) => {
                  const currentStatusValue = statusDrafts[order.order_id] ?? order.order_status;
                  const statusChanged = currentStatusValue !== order.order_status;
                  const isExpanded = expandedOrders.has(order.order_id);
                  const statusConfig = ORDER_STATUS_OPTIONS.find((opt) => opt.value === order.order_status) || { color: '#666' };
                  
                  return (
                    <div 
                      key={order.order_id} 
                      className="admin-order-card admin-order-card--compact"
                      data-status={order.order_status}
                      style={{ '--status-color': statusConfig.color }}
                    >
                      {/* Compact Row - Main Info */}
                      <div className="admin-order-card__row">
                        <div className="admin-order-card__id-col">
                          <strong
                            className="admin-order-card__id"
                            title={`Order ID: ${order.order_id}`}
                          >
                            #
                            {order.order_id}
                          </strong>
                        </div>
                        <div className="admin-order-card__customer-col">
                          <div className="admin-order-card__customer-name">
                            {order.customer_fname} {order.customer_lname}
                          </div>
                          <span className="admin-order-card__separator">•</span>
                          <div className="admin-order-card__customer-email">
                            {order.customer_email || '-'}
                          </div>
                          <span className="admin-order-card__separator">•</span>
                          <div className="admin-order-card__customer-contact">
                            <span title="เบอร์โทร">
                              <i className="bi bi-telephone"></i>
                              {order.customer_tel || '-'}
                            </span>
                          </div>
                        </div>
                        <div className="admin-order-card__date-col">
                          {formatDate(order.order_date)}
                        </div>
                        <div className="admin-order-card__amount-col">
                          <strong>{formatCurrency(order.total_amount)}</strong>
                        </div>
                        <div className="admin-order-card__installment-col">
                          {Number(order.installment_periods) > 0 ? `${order.installment_periods} งวด` : '-'}
                        </div>
                        <div className="admin-order-card__status-col">
                          {getStatusBadge(order.order_status)}
                        </div>
                        <div className="admin-order-card__status-edit-col">
                          <div className="admin-order-card__status-editor-inline">
                            <Form.Select
                              size="sm"
                              value={currentStatusValue}
                              onChange={(e) =>
                                handleStatusDraftChange(order.order_id, e.target.value)
                              }
                              className="admin-order-card__status-select-inline"
                              style={{ minWidth: '140px', fontSize: '0.85rem' }}
                            >
                              {ORDER_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Form.Select>
                            <Button
                              variant="primary"
                              size="sm"
                              className="admin-order-card__status-save-inline"
                              disabled={!statusChanged || savingStatusId === order.order_id}
                              onClick={() => handleStatusUpdate(order.order_id)}
                              style={{ minWidth: '60px', fontSize: '0.8rem', padding: '4px 8px' }}
                            >
                              {savingStatusId === order.order_id ? (
                                <Spinner animation="border" size="sm" role="status">
                                  <span className="visually-hidden">Saving...</span>
                                </Spinner>
                              ) : (
                                <i className="bi bi-save"></i>
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="admin-order-card__actions-col">
                          <div className="admin-order-card__quick-actions">
                            <div className="admin-order-card__action-item">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="admin-order-card__view-btn"
                                onClick={() => handleViewDetails(order.order_id)}
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                              <span className="admin-order-card__action-label">ดูรายละเอียด</span>
                            </div>
                            <div className="admin-order-card__action-item">
                              <button
                                className="admin-order-card__expand-btn"
                                onClick={() => toggleOrderExpand(order.order_id)}
                              >
                                <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                              </button>
                              <span className="admin-order-card__action-label">
                                {isExpanded ? 'ซ่อนที่อยู่' : 'ดูที่อยู่'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="admin-order-card__expandable">
                          <div className="admin-order-card__expandable-content">
                            <div className="admin-order-card__expandable-section">
                              <div className="admin-order-card__expandable-row">
                                <span className="admin-order-card__expandable-label">ที่อยู่:</span>
                                <span>
                                  {(() => {
                                    try {
                                      const address = order.shipping_address 
                                        ? (typeof order.shipping_address === 'string' 
                                            ? JSON.parse(order.shipping_address) 
                                            : order.shipping_address)
                                        : null;
                                      if (address) {
                                        const parts = [];
                                        if (address.recipientName || address.recipientSurname) {
                                          parts.push(`${address.recipientName || ''} ${address.recipientSurname || ''}`.trim());
                                        }
                                        if (address.phone) {
                                          parts.push(`โทร: ${address.phone}`);
                                        }
                                        if (address.address) {
                                          parts.push(address.address);
                                        }
                                        return parts.length > 0 ? parts.join(' · ') : '-';
                                      }
                                      return order.customer_address || '-';
                                    } catch {
                                      return order.shipping_address || order.customer_address || '-';
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </Container>
      </div>

      {/* Slide Panel */}
      <div className={`admin-orders__slide-panel ${isSlidePanelOpen ? 'is-open' : ''}`}>
        <div className="admin-orders__slide-panel-header">
          <h3>
            <i className="bi bi-receipt"></i>
            รายละเอียดคำสั่งซื้อ {selectedOrder ? `#${selectedOrder.order_id}` : ''}
          </h3>
          <button
            className="admin-orders__slide-panel-close"
            onClick={handleCloseSlidePanel}
            aria-label="ปิด"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        {selectedOrder && (
          <div className="admin-orders__slide-panel-body">
            <div className="admin-order-detail-section">
              <h4>
                <i className="bi bi-person"></i>
                ข้อมูลลูกค้า
              </h4>
              <div className="admin-order-detail-content">
                <div className="admin-order-detail-row">
                  <span>ชื่อ:</span>
                  <strong>
                    {selectedOrder.customer_fname} {selectedOrder.customer_lname}
                  </strong>
                </div>
                <div className="admin-order-detail-row">
                  <span>เบอร์:</span>
                  <strong>{selectedOrder.customer_tel || '-'}</strong>
                </div>
                <div className="admin-order-detail-row">
                  <span>อีเมล:</span>
                  <strong>{selectedOrder.customer_email || '-'}</strong>
                </div>
              </div>
            </div>

            <div className="admin-order-detail-section">
              <h4>
                <i className="bi bi-box-seam"></i>
                รายการสินค้า
              </h4>
              <div className="admin-order-detail-content">
                {selectedOrder.details && selectedOrder.details.length > 0 ? (
                  <div className="admin-order-detail-items">
                    {selectedOrder.details.map((item) => (
                      <div key={item.order_detail_id} className="admin-order-detail-item">
                        <div className="admin-order-detail-item__name">{item.product_name}</div>
                        <div className="admin-order-detail-item__meta">
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

            <div className="admin-order-detail-section">
              <h4>
                <i className="bi bi-currency-dollar"></i>
                สรุปยอด
              </h4>
              <div className="admin-order-detail-content">
                <div className="admin-order-detail-row">
                  <span>ยอดรวม:</span>
                  <strong className="admin-order-detail-total">
                    {formatCurrency(selectedOrder.total_amount)}
                  </strong>
                </div>
                <div className="admin-order-detail-row">
                  <span>วิธีชำระ:</span>
                  <strong>{getPaymentMethodLabel(selectedOrder)}</strong>
                </div>
                {isInstallmentOrder(selectedOrder) && (
                  <div className="admin-order-detail-row">
                    <span>จำนวนงวด:</span>
                    <strong>{selectedOrder.installment_periods} งวด</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-order-detail-section">
              <h4>
                <i className="bi bi-info-circle"></i>
                สถานะปัจจุบัน
              </h4>
              <div className="admin-order-detail-content">
                <div className="admin-order-detail-status">
                  {getStatusBadge(selectedOrder.order_status)}
                </div>
                {selectedOrder.order_status === 'cancelled' && selectedOrder.cancel_reason && (
                  <div className="mt-3">
                    <Alert variant="warning" className="mb-0">
                      <strong>สาเหตุการยกเลิก:</strong>
                      <div className="mt-1">{selectedOrder.cancel_reason}</div>
                    </Alert>
                  </div>
                )}
                <div className="admin-order-detail-status-change">
                  <span className="admin-order-detail-status-label">เปลี่ยนเป็น</span>
                  <div className="admin-order-detail-status-select-wrapper">
                    <i className="bi bi-arrow-repeat"></i>
                    <Form.Select
                      value={statusDrafts[selectedOrder.order_id] ?? selectedOrder.order_status}
                      onChange={(e) =>
                        handleStatusDraftChange(selectedOrder.order_id, e.target.value)
                      }
                      className="admin-order-detail-status-select"
                    >
                      {ORDER_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="admin-order-detail-status-save"
                    disabled={
                      !statusDrafts[selectedOrder.order_id] ||
                      statusDrafts[selectedOrder.order_id] === selectedOrder.order_status ||
                      savingStatusId === selectedOrder.order_id
                    }
                    onClick={() => handleStatusUpdate(selectedOrder.order_id)}
                  >
                    {savingStatusId === selectedOrder.order_id ? (
                      <Spinner animation="border" size="sm" role="status">
                        <span className="visually-hidden">Saving...</span>
                      </Spinner>
                    ) : (
                      <>
                        <i className="bi bi-save me-1"></i>
                        บันทึก
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {isInstallmentOrder(selectedOrder) && selectedOrder.installments && (
              <div className="admin-order-detail-section">
                <h4>
                  <i className="bi bi-calendar-check"></i>
                  ตารางผ่อนชำระ
                </h4>
                <div className="admin-order-detail-content">
                  {selectedOrder.installments.length > 0 ? (
                    <div className="admin-order-detail-installments">
                      {selectedOrder.installments.map((installment) => (
                        <div key={installment.installment_id} className="admin-order-detail-installment">
                          <div className="admin-order-detail-installment__number">
                            งวด {installment.installment_number}
                          </div>
                          <div className="admin-order-detail-installment__amount">
                            {formatCurrency(installment.installment_amount)}
                          </div>
                          <div className="admin-order-detail-installment__date">
                            กำหนดชำระ: {formatDate(installment.payment_due_date)}
                          </div>
                          <div className="admin-order-detail-installment__status">
                            <Badge
                              bg={installment.payment_status === 'paid' ? 'success' : 'secondary'}
                            >
                              {installment.payment_status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">ยังไม่มีข้อมูลตารางผ่อนชำระ</p>
                  )}
                </div>
              </div>
            )}

            <div className="admin-order-detail-actions">
              <Button variant="outline-primary" size="sm">
                <i className="bi bi-receipt me-1"></i>
                ส่งใบเสร็จ
              </Button>
              <Button variant="outline-primary" size="sm">
                <i className="bi bi-truck me-1"></i>
                บันทึกการจัดส่ง
              </Button>
              {selectedOrder.order_status !== 'cancelled' &&
                selectedOrder.order_status !== 'cancelled_by_customer' && (
                  <Button variant="outline-danger" size="sm" onClick={() => handleReject(selectedOrder.order_id)}>
                    <i className="bi bi-x-circle me-1"></i>
                    ยกเลิก
                  </Button>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Slide Panel Overlay */}
      {isSlidePanelOpen && (
        <div
          className="admin-orders__slide-panel-overlay"
          onClick={handleCloseSlidePanel}
        ></div>
      )}

      {/* Cancel Reason Modal */}
      <Modal show={showCancelModal} onHide={() => {
        setShowCancelModal(false);
        setCancelReason('');
        setCancelOrderId(null);
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>กรอกสาเหตุการยกเลิก</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>สาเหตุการยกเลิกคำสั่งซื้อ</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="กรุณากรอกสาเหตุที่ยกเลิกคำสั่งซื้อนี้..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <Form.Text className="text-muted">
              สาเหตุนี้จะแสดงให้ลูกค้าดู
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowCancelModal(false);
            setCancelReason('');
            setCancelOrderId(null);
          }}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel} disabled={!cancelReason.trim()}>
            ยืนยันการยกเลิก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <div className="admin-orders__toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`admin-orders__toast admin-orders__toast--${toast.variant}`}
          >
            <div className="admin-orders__toast-icon">
              {toast.variant === 'success' && <i className="bi bi-check-circle-fill"></i>}
              {toast.variant === 'danger' && <i className="bi bi-x-circle-fill"></i>}
              {toast.variant === 'warning' && <i className="bi bi-exclamation-triangle-fill"></i>}
              {toast.variant === 'info' && <i className="bi bi-info-circle-fill"></i>}
            </div>
            <div className="admin-orders__toast-message">{toast.message}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
