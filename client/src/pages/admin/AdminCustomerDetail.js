import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import './AdminCustomerDetail.css';

const formatCurrency = (value) => {
  const number = Number(value) || 0;
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
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('th-TH');
};

const STATUS_LABELS = {
  pending: 'รออนุมัติ',
  awaiting_payment: 'รอชำระเงิน',
  paid: 'ชำระแล้ว',
  completed: 'สำเร็จ',
  cancelled: 'ยกเลิก',
  cancelled_by_customer: 'ยกเลิกโดยลูกค้า',
  shipping: 'กำลังจัดส่ง',
  delivered: 'จัดส่งแล้ว'
};

const PAYMENT_LABELS = {
  cash: 'ชำระเต็มจำนวน',
  installment: 'ผ่อนชำระ'
};

const formatStatus = (status) => STATUS_LABELS[status] || status || '-';

const formatPaymentMethod = (method) => PAYMENT_LABELS[method] || 'ไม่ระบุ';

const toNumeric = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const hasOrderPromotion = (order = {}) => {
  const cash = toNumeric(order.price_cash ?? order.total_amount);
  const cashPromo = toNumeric(order.price_cash_promo ?? order.promo_price ?? order.discounted_amount);
  if (cashPromo != null && (cash == null || cashPromo < cash)) {
    return true;
  }

  const installment = toNumeric(order.price_installment);
  const installmentPromo = toNumeric(order.price_installment_promo);
  if (installmentPromo != null && (installment == null || installmentPromo < installment)) {
    return true;
  }

  return false;
};

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'awaiting_payment', label: 'รอชำระเงิน' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'waiting_for_delivery', label: 'รอจัดส่ง' },
  { key: 'completed', label: 'ส่งมอบสำเร็จ' },
  { key: 'cancelled', label: 'ยกเลิกโดยผู้ดูแล' },
  { key: 'cancelled_by_customer', label: 'ลูกค้ายกเลิก' }
];

const PROMOTION_FILTER_OPTIONS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'promo', label: 'มีโปรฯ' },
  { key: 'regular', label: 'ไม่มีโปรฯ' }
];

export default function AdminCustomerDetail({ admin, logout, isSidebarCollapsed, toggleSidebar }) {
  const { customerId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [promotionFilter, setPromotionFilter] = useState('all');
  const [showAllProducts, setShowAllProducts] = useState(false);

  const getPaymentMethodLabel = (order) => {
    if (!order) return '-';
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

  const renderAddress = (address) => {
    if (!address) {
      return <span className="text-muted">-</span>;
    }
    const lines = [];
    const fullName = `${address.recipientName || ''} ${address.recipientSurname || ''}`.trim();
    if (fullName) {
      lines.push(fullName);
    }
    if (address.phone) {
      lines.push(`โทร: ${address.phone}`);
    }
    if (address.address) {
      lines.push(address.address);
    }
    if (lines.length === 0) {
      return <span className="text-muted">-</span>;
    }
    return lines.join(' · ');
  };

  const isInstallmentOrder = (order) => {
    if (!order) return false;
    const method = order.payment_method ? String(order.payment_method).toLowerCase() : '';
    if (method.includes('install')) {
      return true;
    }
    return Number(order.installment_periods) > 1;
  };

  useEffect(() => {
    let active = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/admin/customers/${customerId}`);
        if (active) {
          setData(response.data);
        }
      } catch (fetchError) {
        console.error('Error fetching customer detail:', fetchError);
        if (active) {
          setError('ไม่สามารถโหลดรายละเอียดลูกค้าได้');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      active = false;
    };
  }, [customerId]);

  const orders = data?.orders || [];

  const statusFilterOptions = useMemo(() => STATUS_FILTER_OPTIONS, []);
  const promotionFilterOptions = useMemo(() => PROMOTION_FILTER_OPTIONS, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = (order.order_status || '').toLowerCase();
      if (statusFilter !== 'all' && status !== statusFilter.toLowerCase()) {
        return false;
      }

      if (promotionFilter === 'all') {
        return true;
      }
      const hasPromo = hasOrderPromotion(order);
      return promotionFilter === 'promo' ? hasPromo : !hasPromo;
    });
  }, [orders, statusFilter, promotionFilter]);

  const purchasedProducts = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (!item || !item.product_id) {
          return;
        }
        const key = item.product_id;
        const existing = map.get(key) || {
          product_id: item.product_id,
          product_name: item.product_name,
          totalQuantity: 0, 
          totalSpent: 0,
          image: item.product_image,
          orderIds: new Set()
        };
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        existing.totalQuantity += quantity;
        existing.totalSpent += price * quantity;
        existing.orderIds.add(order.order_id);
        map.set(key, existing);
      });
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      orderCount: entry.orderIds.size
    }));
  }, [orders]);

  const productHistory = useMemo(() => {
    if (data && Array.isArray(data.products) && data.products.length > 0) {
      const sorted = data.products
        .map((product) => ({
          id: product.product_id ?? `${product.product_name}-${product.total_spent}-${product.order_count}`,
          name: product.product_name || 'ไม่ระบุ',
          totalQuantity: Number(product.total_quantity) || 0,
          totalSpent: Number(product.total_spent) || 0,
          orderCount: Number(product.order_count) || 0
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity);
      return sorted.map((product, index) => ({
        ...product,
        rank: index + 1,
        averagePerOrder:
          product.orderCount > 0 ? product.totalSpent / product.orderCount : 0,
        isTop: index === 0
      }));
    }

    const sortedFallback = purchasedProducts
      .map((product) => ({
        id: product.product_id,
        name: product.product_name,
        totalQuantity: product.totalQuantity,
        totalSpent: Number(product.totalSpent) || 0,
        orderCount: product.orderCount
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return sortedFallback.map((product, index) => ({
      ...product,
      rank: index + 1,
      averagePerOrder:
        product.orderCount > 0 ? product.totalSpent / product.orderCount : 0,
      isTop: index === 0
    }));
  }, [data, purchasedProducts]);

  useEffect(() => {
    if (productHistory.length <= 5 && showAllProducts) {
      setShowAllProducts(false);
    }
  }, [productHistory, showAllProducts]);

  const installmentOrders = useMemo(
    () =>
      orders.filter(
        (order) => (order.payment_method || '').toString().toLowerCase() === 'installment'
      ),
    [orders]
  );

  const customerSummary = data?.summary || {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0),
    awaitingCount: orders.filter((order) => (order.order_status || '').toLowerCase() === 'awaiting_payment').length,
    pendingCount: orders.filter((order) => (order.order_status || '').toLowerCase() === 'pending').length,
    installmentOrders: installmentOrders.length
  };

  const countsByFilter = useMemo(() => {
    const statusCounts = { all: orders.length };
    STATUS_FILTER_OPTIONS.forEach((option) => {
      if (option.key === 'all') {
        return;
      }
      statusCounts[option.key] = 0;
    });

    const promoCounts = { all: orders.length, promo: 0, regular: 0 };

    orders.forEach((order) => {
      const statusKey = (order.order_status || '').toLowerCase();
      STATUS_FILTER_OPTIONS.forEach((option) => {
        if (option.key === 'all') {
          return;
        }
        if (statusKey === option.key) {
          statusCounts[option.key] = (statusCounts[option.key] || 0) + 1;
        }
      });
      const hasPromo = hasOrderPromotion(order);
      if (hasPromo) {
        promoCounts.promo += 1;
      } else {
        promoCounts.regular += 1;
      }
    });

    return { status: statusCounts, promo: promoCounts };
  }, [orders]);

  return (
    <div className="admin-customer-detail-page">
      <AdminHeader
        admin={admin}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />
      <Container className="py-5">
        <div className="detail-topbar mb-4">
          <div className="detail-topbar__title">
            <h2 className="mb-1">ข้อมูลลูกค้า</h2>
            <p className="text-muted small mb-0">ดูประวัติการสั่งซื้อและสถานะล่าสุดของลูกค้า</p>
          </div>
          <Link to="/admin/customers">
            <Button variant="outline-secondary" className="detail-back-btn">
              <i className="bi bi-arrow-left me-2" /> กลับสู่รายชื่อลูกค้า
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="detail-loading-state">
            <Spinner animation="border" role="status" />
            <span>กำลังโหลดข้อมูลลูกค้า...</span>
          </div>
        ) : error ? (
          <Alert variant="danger" className="detail-error">
            {error}
          </Alert>
        ) : !data ? (
          <Alert variant="warning" className="detail-error">
            ไม่พบข้อมูลลูกค้า กรุณาลองใหม่อีกครั้ง
          </Alert>
        ) : (
          <>
            <section className="detail-hero mb-4">
              <Card className="detail-hero-card">
                <Card.Body>
                  <div className="detail-hero-header">
                    <div className="avatar">
                      <span>{(data.customer.firstName || '?').charAt(0)}</span>
                    </div>
                    <div>
                      <h1>{data.customer.firstName} {data.customer.lastName}</h1>
                      <p className="detail-hero-subtitle">รหัสลูกค้า #{data.customer.id} · {data.customer.username || 'ไม่ระบุ username'}</p>
                    </div>
                  </div>
                  <Row className="g-4 mt-1">
                    <Col md={4}>
                      <div className="detail-hero-block">
                        <span className="label">ยอดใช้จ่ายรวม</span>
                        <strong>{formatCurrency(customerSummary.totalSpent)}</strong>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="detail-hero-block">
                        <span className="label">สร้างบัญชีเมื่อ</span>
                        <strong>{formatDate(data.customer.createdAt)}</strong>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="detail-hero-block">
                        <span className="label">ออเดอร์แบบผ่อน</span>
                        <strong>{customerSummary.installmentOrders}</strong>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </section>

            <Row className="gy-4 detail-info-row">
              <Col lg={4}>
                <Card className="detail-info-card">
                  <Card.Body>
                    <h5>ข้อมูลติดต่อ</h5>
                    <dl>
                      <dt>อีเมล</dt>
                      <dd>
                        {data.customer.email ? (
                          <a href={`mailto:${data.customer.email}`}>{data.customer.email}</a>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </dd>
                      <dt>เบอร์โทร</dt>
                      <dd>
                        {data.customer.phone ? (
                          <a href={`tel:${data.customer.phone.replace(/[^0-9+]/g, '')}`}>
                            {data.customer.phone}
                          </a>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </dd>
                      <dt>ที่อยู่จัดส่งล่าสุด</dt>
                      <dd>{renderAddress(data.customer.address)}</dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={8}>
                <Card className="detail-info-card">
                  <Card.Body>
                    <h5>สินค้าที่เคยซื้อ</h5>
                    {productHistory.length === 0 ? (
                      <p className="text-muted mb-0">ยังไม่มีประวัติการซื้อสินค้า</p>
                    ) : (
                      <div className="detail-products-table-wrapper">
                        {productHistory.length > 5 && (
                          <div className="detail-products-table__actions">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="detail-products-toggle"
                              onClick={() => setShowAllProducts((prev) => !prev)}
                            >
                              {showAllProducts ? 'แสดงน้อยลง' : `ดูทั้งหมด ${productHistory.length} รายการ`}
                            </Button>
                          </div>
                        )}
                        <Table responsive hover size="sm" className="detail-products-table">
                          <thead>
                            <tr>
                              <th className="text-center">#</th>
                              <th>สินค้า</th>
                              <th className="text-center">จำนวนรวม</th>
                              <th className="text-center">จำนวนออเดอร์</th>
                              <th className="text-end">ยอดใช้จ่ายรวม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(showAllProducts ? productHistory : productHistory.slice(0, 5)).map((product) => (
                              <tr key={product.id} className={product.isTop ? 'is-top-product' : ''}>
                                <td className="detail-products-rank text-center">
                                  <span>{String(product.rank).padStart(2, '0')}</span>
                                </td>
                                <td>
                                  <div className="detail-products-name">
                                    <strong>{product.name}</strong>
                                    <div className="detail-products-meta">
                                      <span>
                                        {product.totalSpent > 0
                                          ? `เฉลี่ยต่อออเดอร์ ${formatCurrency(product.averagePerOrder)}`
                                          : 'ไม่มีข้อมูลราคา'}
                                      </span>
                                      {product.isTop && <span className="detail-products-badge">Top Seller</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">{product.totalQuantity.toLocaleString('th-TH')} ชิ้น</td>
                                <td className="text-center">{product.orderCount.toLocaleString('th-TH')} ออเดอร์</td>
                                <td className="text-end">{formatCurrency(product.totalSpent)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <section className="detail-section">
              <div className="detail-section__header">
                <div>
                  <h3>คำสั่งซื้อของลูกค้า</h3>
                  <span className="text-muted">ทั้งหมด {filteredOrders.length} รายการ</span>
                </div>
                <div className="detail-orders-controls">
                  <div className="detail-filter">
                    <i className="bi bi-funnel" />
                    <Form.Select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      {statusFilterOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label} ({countsByFilter.status[option.key] ?? 0})
                        </option>
                      ))}
                    </Form.Select>
                    <i className="bi bi-chevron-down detail-filter__chevron" />
                  </div>
                  <div className="detail-filter">
                    <i className="bi bi-lightning-charge" />
                    <Form.Select
                      value={promotionFilter}
                      onChange={(event) => setPromotionFilter(event.target.value)}
                    >
                      {promotionFilterOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label} ({countsByFilter.promo[option.key] ?? 0})
                        </option>
                      ))}
                    </Form.Select>
                    <i className="bi bi-chevron-down detail-filter__chevron" />
                  </div>
                </div>
              </div>
              <Card className="detail-orders-card">
                <Card.Body>
                  {filteredOrders.length === 0 ? (
                    <div className="detail-empty">ยังไม่มีคำสั่งซื้อ</div>
                  ) : (
                    <Table responsive hover className="detail-orders-table">
                      <thead>
                        <tr>
                          <th>รหัสสั่งซื้อ</th>
                          <th>วันที่</th>
                          <th>สถานะ</th>
                          <th>การชำระเงิน</th>
                          <th>ยอดรวม</th>
                          <th>สินค้า</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.order_id}>
                            <td>#{order.order_id}</td>
                            <td>{formatDate(order.order_date)}</td>
                            <td>
                              <Badge bg="light" text="dark">
                                {formatStatus((order.order_status || '').toLowerCase())}
                              </Badge>
                            </td>
                            <td>{getPaymentMethodLabel(order)}</td>
                            <td>{formatCurrency(order.total_amount)}</td>
                            <td>
                              <ul className="detail-order-items">
                                {order.items?.map((item) => (
                                  <li key={item.order_detail_id}>
                                    <span className="item-name">{item.product_name}</span>
                                    <span className="item-qty">× {item.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="text-end">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <i className="bi bi-eye me-1" />
                                ดูรายละเอียด
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </section>

            <section className="detail-section">
              <div className="detail-section__header">
                <h3>รายการผ่อนชำระ</h3>
                <span className="text-muted">ติดตามความคืบหน้าการผ่อนของลูกค้า</span>
              </div>
              {installmentOrders.length === 0 ? (
                <Card className="detail-info-card">
                  <Card.Body>
                    <p className="text-muted mb-0">ลูกค้ายังไม่มีการสั่งซื้อแบบผ่อนชำระ</p>
                  </Card.Body>
                </Card>
              ) : (
                <div className="detail-installments-grid">
                  {installmentOrders.map((order) => {
                    const summary = order.installmentSummary || {
                      totalPeriods: order.installment_periods || 0,
                      paidCount: 0,
                      remainingPeriods: order.installment_periods || 0,
                      nextDue: null
                    };
                    const progress = summary.totalPeriods > 0 ? Math.round((summary.paidCount / summary.totalPeriods) * 100) : 0;
                    return (
                      <Card key={order.order_id} className="detail-installment-card">
                        <Card.Body>
                          <div className="installment-header">
                            <div>
                              <h5>คำสั่งซื้อ #{order.order_id}</h5>
                              <span className="text-muted">{formatDate(order.order_date)}</span>
                            </div>
                            <Badge bg={progress === 100 ? 'success' : 'warning'}>
                              {summary.paidCount}/{summary.totalPeriods} งวด
                            </Badge>
                          </div>
                          <div className="installment-progress">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                          </div>
                          <ul className="installment-info">
                            <li><strong>ยอดต่อเดือน:</strong> {formatCurrency(order.monthly_payment)}</li>
                            <li><strong>ยอดรวม:</strong> {formatCurrency(order.total_amount)}</li>
                            <li><strong>งวดที่จ่ายแล้ว:</strong> {summary.paidCount} งวด</li>
                            <li><strong>งวดคงเหลือ:</strong> {summary.remainingPeriods} งวด</li>
                            <li><strong>กำหนดชำระถัดไป:</strong> {formatDate(summary.nextDue)}</li>
                          </ul>
                          <div className="installment-items">
                            <span className="label">สินค้าในคำสั่งซื้อ</span>
                            <ul>
                              {order.items?.map((item) => (
                                <li key={item.order_detail_id}>{item.product_name} × {item.quantity}</li>
                              ))}
                            </ul>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </Container>

      <Modal
        show={!!selectedOrder}
        onHide={() => setSelectedOrder(null)}
        centered
        size="lg"
        dialogClassName="customer-order-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            ข้อมูลคำสั่งซื้อ {selectedOrder ? `#${selectedOrder.order_id}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <div className="order-detail-section">
                <div>
                  <span className="label">วันที่สั่ง</span>
                  <strong>{formatDateTime(selectedOrder.order_date)}</strong>
                </div>
                <div>
                  <span className="label">สถานะ</span>
                  <span className="badge bg-light text-dark">
                    {formatStatus((selectedOrder.order_status || '').toLowerCase())}
                  </span>
                </div>
                <div>
                  <span className="label">วิธีชำระ</span>
                  <strong>{getPaymentMethodLabel(selectedOrder)}</strong>
                </div>
                <div>
                  <span className="label">ยอดรวม</span>
                  <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
                </div>
                {isInstallmentOrder(selectedOrder) && (
                  <div>
                    <span className="label">ยอดผ่อนต่อเดือน</span>
                    <strong>{formatCurrency(selectedOrder.monthly_payment)}</strong>
                  </div>
                )}
              </div>

              <div className="order-detail-section">
                <h5>ข้อมูลจัดส่ง</h5>
                {renderAddress(selectedOrder.shipping_address || data?.customer?.address)}
              </div>

              <div className="order-detail-section">
                <h5>รายการสินค้า</h5>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>สินค้า</th>
                      <th>จำนวน</th>
                      <th>ราคา</th>
                      <th>รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item) => (
                      <tr key={item.order_detail_id}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {isInstallmentOrder(selectedOrder) && (
                <div className="order-detail-section">
                  <h5>ตารางผ่อนชำระ</h5>
                  {selectedOrder.installments && selectedOrder.installments.length > 0 ? (
                    <Table bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>งวด</th>
                          <th>ยอดชำระ</th>
                          <th>กำหนดชำระ</th>
                          <th>วันที่ชำระ</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.installments.map((installment) => (
                          <tr key={installment.installment_id}>
                            <td>{installment.installment_number}</td>
                            <td>{formatCurrency(installment.installment_amount)}</td>
                            <td>{formatDate(installment.payment_due_date)}</td>
                            <td>{formatDate(installment.payment_date)}</td>
                            <td>
                              <Badge
                                bg={installment.payment_status === 'paid' ? 'success' : 'secondary'}
                              >
                                {installment.payment_status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-muted">ยังไม่มีข้อมูลงวดผ่อน</div>
                  )}
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
