import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import axios from 'axios';
import './OrderDetail.css';

const statusConfig = {
  pending: { variant: 'warning', text: 'รออนุมัติ' },
  awaiting_payment: { variant: 'info', text: 'รอชำระเงิน' },
  approved: { variant: 'success', text: 'อนุมัติแล้ว' },
  waiting_for_delivery: { variant: 'primary', text: 'รอจัดส่ง' },
  completed: { variant: 'success', text: 'ส่งมอบสำเร็จ' },
  cancelled: { variant: 'danger', text: 'ยกเลิกโดยผู้ดูแล' },
  cancelled_by_customer: { variant: 'danger', text: 'ยกเลิก' }
};

const formatCurrency = (value) => {
  if (value == null) return '-';
  return `฿${parseFloat(value).toLocaleString()}`;
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isCancelling, setIsCancelling] = useState(false);

  const paymentInfo = useMemo(() => {
    const method = order?.payment_method ? String(order.payment_method).toLowerCase() : '';
    if (!order) {
      return { type: 'cash', label: '-', note: '' };
    }
    if (method.includes('cod') || method.includes('ปลายทาง') || method.includes('delivery')) {
      return {
        type: 'cod',
        label: 'เก็บเงินปลายทาง',
        note: 'ชำระเมื่อรับสินค้าและกรุณาเตรียมยอดให้ครบถ้วน'
      };
    }
    if (method.includes('install')) {
      return { type: 'installment', label: 'ผ่อนชำระ', note: '' };
    }
    return { type: 'cash', label: 'ชำระเต็มจำนวน', note: '' };
  }, [order]);

  const isInstallmentOrder = useMemo(() => paymentInfo.type === 'installment', [paymentInfo]);

  const summaryColProps = useMemo(() => (isInstallmentOrder ? { md: 12, lg: 4 } : { md: 12, lg: 6 }), [isInstallmentOrder]);
  const shippingColProps = useMemo(() => (isInstallmentOrder ? { md: 12, lg: 4 } : { md: 12, lg: 6 }), [isInstallmentOrder]);
  const installmentColProps = useMemo(() => ({ md: 12, lg: 4 }), []);
  const detailColProps = useMemo(() => (isInstallmentOrder ? { lg: 6 } : { lg: 12 }), [isInstallmentOrder]);

  const shippingInfo = useMemo(() => {
    if (!order) {
      return {
        name: '-',
        phone: '-',
        address: '-',
        telLink: ''
      };
    }

    // ใช้ข้อมูลจาก customer ก่อน (customer_fname, customer_lname, customer_tel)
    const customerName = [order.customer_fname, order.customer_lname].filter(Boolean).join(' ').trim();
    const customerPhone = typeof order.customer_tel === 'string' ? order.customer_tel.trim() : '';

    // ถ้าไม่มีข้อมูลจาก customer ให้ใช้ข้อมูลจาก shipping_address
    const shipping = order?.shipping_address || {};
    const shippingName = [shipping.recipientName, shipping.recipientSurname].filter(Boolean).join(' ').trim();
    const shippingPhone = typeof shipping.phone === 'string' ? shipping.phone.trim() : '';

    const name = customerName || shippingName || '-';
    const phone = customerPhone || shippingPhone || '-';
    const address = typeof shipping.address === 'string' ? shipping.address.trim() : '-';
    const telLink = phone && phone !== '-' ? phone.replace(/[^0-9+]/g, '') : '';

    return {
      name: name || '-',
      phone: phone || '-',
      address: address || '-',
      telLink: telLink || ''
    };
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`/api/orders/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order detail:', err);
        const message = err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order || order.order_status !== 'pending') {
      return;
    }
    const confirmed = window.confirm('ยืนยันการยกเลิกคำสั่งซื้อนี้หรือไม่?');
    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await axios.put(`/api/orders/cancel/${order.order_id}`);
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              order_status: response.data?.status || 'cancelled_by_customer'
            }
          : prev
      );
      setFeedback({ type: 'success', message: response.data?.message || 'ยกเลิกคำสั่งซื้อสำเร็จ' });
    } catch (err) {
      console.error('Cancel order error:', err);
      setFeedback({
        type: 'danger',
        message: err.response?.data?.error || 'ไม่สามารถยกเลิกคำสั่งซื้อได้'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const installmentSummary = useMemo(() => {
    if (
      !order ||
      !isInstallmentOrder ||
      !Array.isArray(order.installments) ||
      order.installments.length === 0
    ) {
      return null;
    }

    const paidCount = order.installments.filter((item) => item.payment_status === 'paid').length;
    return {
      total: order.installments.length,
      paid: paidCount,
      remaining: order.installments.length - paidCount
    };
  }, [order]);

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    const classes = ['order-status-badge'];
    if (status === 'pending') {
      classes.push('order-status-badge--pending');
    }
    if (status === 'awaiting_payment') {
      classes.push('order-status-badge--awaiting');
    }
    if (status === 'waiting_for_delivery') {
      classes.push('order-status-badge--shipping');
    }
    if (status === 'completed') {
      classes.push('order-status-badge--completed');
    }
    if (status === 'cancelled' || status === 'cancelled_by_customer') {
      classes.push('order-status-badge--cancelled');
    }
    return (
      <Badge
        bg={config.variant}
        className={`px-3 py-2 fs-6 fw-semibold rounded-pill ${classes.join(' ')}`}
      >
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <h4 className="mb-3">มีข้อผิดพลาด</h4>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate(-1)}>
              ย้อนกลับ
            </Button>
            <Link to="/orders" className="btn btn-outline-secondary">
              ไปยังรายการคำสั่งซื้อ
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="order-detail-page">
      <Container>
        <Card className="order-detail-card">
          <div className="order-detail-card__header">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h2 className="order-detail-card__title">รายละเอียดคำสั่งซื้อ #{order.order_id}</h2>
                <div className="order-detail-card__meta">
                  <span>{new Date(order.order_date).toLocaleDateString('th-TH')}</span>
                  {getStatusBadge(order.order_status)}
                </div>
              </div>
              <div className="d-flex gap-2">
                <Link to="/orders" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  กลับไปหน้าคำสั่งซื้อ
                </Link>
              </div>
            </div>
          </div>

          <div className="order-detail-card__body">
            {feedback.message && (
              <Alert variant={feedback.type} onClose={() => setFeedback({ type: '', message: '' })} dismissible>
                {feedback.message}
              </Alert>
            )}

            <Row className="g-4 mb-4">
              <Col {...summaryColProps}>
                <Card className="order-detail__summary-card h-100">
                  <Card.Body>
                    <h5 className="mb-3">สรุปคำสั่งซื้อ</h5>
                    <dl className="row mb-0">
                      <dt className="col-sm-5">ยอดรวม</dt>
                      <dd className="col-sm-7">{formatCurrency(order.total_amount)}</dd>
                      <dt className="col-sm-5">วิธีชำระเงิน</dt>
                      <dd className="col-sm-7">{paymentInfo.label}</dd>
                      <dt className="col-sm-5">จำนวนงวด</dt>
                      <dd className="col-sm-7">
                        {isInstallmentOrder
                          ? `${order.installment_periods} งวด`
                          : paymentInfo.type === 'cod'
                          ? 'เก็บเงินเพียงครั้งเดียวตอนรับสินค้า'
                          : 'ชำระเต็มจำนวน'}
                      </dd>
                      <dt className="col-sm-5">ยอดผ่อนต่อเดือน</dt>
                      <dd className="col-sm-7">
                        {isInstallmentOrder ? formatCurrency(order.monthly_payment) : '-'}
                      </dd>
                      {paymentInfo.note && (
                        <>
                          <dt className="col-sm-5">หมายเหตุ</dt>
                          <dd className="col-sm-7">{paymentInfo.note}</dd>
                        </>
                      )}
                      <dt className="col-sm-5">สถานะล่าสุด</dt>
                      <dd className="col-sm-7">
                        {statusConfig[order.order_status]?.text || order.order_status}
                        {order.order_status === 'cancelled' && order.cancel_reason && (
                          <div className="mt-2">
                            <Alert variant="danger" className="mb-0" style={{ fontSize: '0.9rem' }}>
                              <strong>สาเหตุการยกเลิก:</strong>
                              <div className="mt-1">{order.cancel_reason}</div>
                            </Alert>
                          </div>
                        )}
                      </dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>
              <Col {...shippingColProps}>
                <Card className="order-detail__summary-card h-100">
                  <Card.Body>
                    <h5 className="mb-3">ข้อมูลผู้รับและที่อยู่จัดส่ง</h5>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">ชื่อผู้รับ</dt>
                      <dd className="col-sm-8">{shippingInfo.name}</dd>
                      <dt className="col-sm-4">เบอร์ติดต่อ</dt>
                      <dd className="col-sm-8">
                        {shippingInfo.phone !== '-' ? (
                          <a
                            href={shippingInfo.telLink ? `tel:${shippingInfo.telLink}` : undefined}
                            className="order-detail__contact-link"
                          >
                            {shippingInfo.phone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </dd>
                      <dt className="col-sm-4">ที่อยู่จัดส่ง</dt>
                      <dd className="col-sm-8">
                        {shippingInfo.address !== '-' ? (
                          <span className="order-detail__shipping-address">{shippingInfo.address}</span>
                        ) : (
                          <span style={{ color: '#000', fontSize: '1.1rem' }}>ยังไม่ได้ระบุที่อยู่จัดส่ง</span>
                        )}
                      </dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>
              {isInstallmentOrder && (
                <Col {...installmentColProps}>
                  <Card className="order-detail__summary-card h-100">
                    <Card.Body>
                      <h5 className="mb-3">ข้อมูลการผ่อนชำระ</h5>
                      {installmentSummary ? (
                        <dl className="row mb-0">
                          <dt className="col-sm-5">จำนวนงวดทั้งหมด</dt>
                          <dd className="col-sm-7">{installmentSummary.total} งวด</dd>
                          <dt className="col-sm-5">ชำระแล้ว</dt>
                          <dd className="col-sm-7">{installmentSummary.paid} งวด</dd>
                          <dt className="col-sm-5">คงเหลือ</dt>
                          <dd className="col-sm-7">{installmentSummary.remaining} งวด</dd>
                          <dt className="col-sm-5">ยอดรวมผ่อน</dt>
                          <dd className="col-sm-7">{formatCurrency(order.monthly_payment * installmentSummary.total)}</dd>
                        </dl>
                      ) : (
                        <p className="mb-0 text-muted">ไม่มีข้อมูลการผ่อนชำระ</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>

            <Card className="mb-4 order-detail__section-card">
              <Card.Body>
                <Row className="g-4">
                  <Col {...detailColProps}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">รายการสินค้า</h5>
                      <Badge bg="light" text="dark">
                        {order.details.length} รายการ
                      </Badge>
                    </div>
                    <Table responsive hover className="order-detail__products mb-0">
                      <thead>
                        <tr>
                          <th>สินค้า</th>
                          <th>ราคา</th>
                          <th>จำนวน</th>
                          <th className="text-end">รวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.details.map((item) => (
                          <tr key={item.order_detail_id}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <div className="order-detail__thumb">
                                  <img src={item.product_image} alt={item.product_name} />
                                </div>
                                <div>
                                  <strong>{item.product_name}</strong>
                                </div>
                              </div>
                            </td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>{item.quantity}</td>
                            <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                  {isInstallmentOrder && (
                    <Col lg={6}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">ตารางการผ่อนชำระ</h5>
                        {installmentSummary && (
                          <Badge bg={installmentSummary.remaining === 0 ? 'success' : 'warning'}>
                            ชำระแล้ว {installmentSummary.paid}/{installmentSummary.total} งวด
                          </Badge>
                        )}
                      </div>
                      {order.installments?.length ? (
                        <Table responsive hover className="mb-0 order-detail__installments">
                          <thead>
                            <tr>
                              <th>งวดที่</th>
                              <th>ยอดชำระ</th>
                              <th>กำหนดชำระ</th>
                              <th>วันที่ชำระ</th>
                              <th>สถานะ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.installments.map((item) => (
                              <tr key={item.installment_id}>
                                <td>{item.installment_number}</td>
                                <td>{formatCurrency(item.installment_amount)}</td>
                                <td>{new Date(item.payment_due_date).toLocaleDateString('th-TH')}</td>
                                <td>
                                  {item.payment_date
                                    ? new Date(item.payment_date).toLocaleDateString('th-TH')
                                    : '-'}
                                </td>
                                <td>
                                  <Badge bg={item.payment_status === 'paid' ? 'success' : 'secondary'}>
                                    {item.payment_status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="mb-0 text-muted">ไม่มีข้อมูลงวดการผ่อนชำระ</p>
                      )}
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
          </div>

          {order.order_status === 'pending' && (
            <div className="order-detail__footer">
              <Button
                variant="danger"
                size="lg"
                className="order-detail__cancel-btn"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิกคำสั่งซื้อ'}
              </Button>
            </div>
          )}
        </Card>
      </Container>
    </div>
  );
}

