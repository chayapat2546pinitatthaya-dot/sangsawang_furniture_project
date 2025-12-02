import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('qr');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/customer/orders');
      setOrders(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
    }
  };

  const getPaymentMethodInfo = (order) => {
    if (!order) {
      return { type: 'cash', label: '-', note: '' };
    }
    const method = order.payment_method ? String(order.payment_method).toLowerCase() : '';
    if (method.includes('cod') || method.includes('delivery') || method.includes('ปลายทาง')) {
      return {
        type: 'cod',
        label: 'เก็บเงินปลายทาง',
        note: 'ชำระเมื่อรับสินค้า'
      };
    }
    if (method.includes('install')) {
      return { type: 'installment', label: 'ผ่อนชำระ', note: '' };
    }
    return { type: 'cash', label: 'ชำระเต็มจำนวน', note: '' };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'รออนุมัติ' },
      awaiting_payment: { variant: 'info', text: 'รอชำระเงิน' },
      approved: { variant: 'success', text: 'อนุมัติแล้ว' },
      waiting_for_delivery: { variant: 'primary', text: 'รอส่ง' },
      completed: { variant: 'success', text: 'ส่งมอบสำเร็จ' },
      cancelled: { variant: 'danger', text: 'ยกเลิกโดยผู้ดูแล' },
      cancelled_by_customer: { variant: 'danger', text: 'ยกเลิก' }
    };
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    const classes = ['orders-status-badge'];
    if (status === 'pending') {
      classes.push('orders-status-badge--pending');
    }
    if (status === 'awaiting_payment') {
      classes.push('orders-status-badge--awaiting');
    }
    if (status === 'waiting_for_delivery') {
      classes.push('orders-status-badge--shipping');
    }
    if (status === 'completed') {
      classes.push('orders-status-badge--completed');
    }
    if (status === 'cancelled' || status === 'cancelled_by_customer') {
      classes.push('orders-status-badge--cancelled');
    }
    return (
      <Badge
        bg={config.variant}
        className={`px-3 py-2 rounded-pill fw-semibold ${classes.join(' ')}`}
      >
        {config.text}
      </Badge>
    );
  };

  const isInstallmentOrder = (order) => getPaymentMethodInfo(order).type === 'installment';

  const filterConfigs = useMemo(
    () => ({
      all: {
        label: 'รายการทั้งหมด',
        predicate: () => true
      },
      active: {
        label: 'กำลังดำเนินการ',
        predicate: (order) =>
          ['pending', 'awaiting_payment', 'approved', 'waiting_for_delivery'].includes(order.order_status)
      },
      cancelled: {
        label: 'ยกเลิกแล้ว',
        predicate: (order) =>
          ['cancelled', 'cancelled_by_customer'].includes(order.order_status)
      }
    }),
    []
  );

  const filteredOrders = useMemo(() => {
    const filter = filterConfigs[activeFilter];
    if (!filter) {
      return orders;
    }
    return orders.filter(filter.predicate);
  }, [orders, activeFilter, filterConfigs]);

  const filterCounts = useMemo(() => {
    const counts = Object.fromEntries(Object.keys(filterConfigs).map((key) => [key, 0]));
    orders.forEach((order) => {
      Object.entries(filterConfigs).forEach(([key, config]) => {
        if (config.predicate(order)) {
          counts[key] += 1;
        }
      });
    });
    return counts;
  }, [orders, filterConfigs]);

  const renderFilterSelect = () => (
    <div className="orders-filters">
      <div className="orders-filter-select-wrapper">
        <Form.Select
          value={activeFilter}
          className="orders-filter-select"
          onChange={(event) => setActiveFilter(event.target.value)}
        >
          {Object.entries(filterConfigs).map(([key, config]) => {
            const count = filterCounts[key] || 0;
            return (
              <option key={key} value={key}>
                {config.label} ({count})
              </option>
            );
          })}
        </Form.Select>
        <i className="bi bi-chevron-down orders-filter-icon"></i>
      </div>
    </div>
  );

  const handleOpenPaymentModal = (order) => {
    setPaymentModalOrder(order);
    const methodType = getPaymentMethodInfo(order).type;
    setSelectedPaymentOption(methodType === 'cod' ? 'cod' : 'qr');
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOrder(null);
  };

  const formatCurrency = (value) => {
    if (value == null || Number.isNaN(Number(value))) {
      return '-';
    }
    return `฿${Number(value).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const renderInstallmentInfo = (order) => {
    if (isInstallmentOrder(order)) {
      return `${order.installment_periods} งวด`;
    }
    return 'ชำระเต็มจำนวน';
  };

  const renderMonthlyPayment = (order) => {
    if (isInstallmentOrder(order)) {
      return formatCurrency(order.monthly_payment);
    }
    return '-';
  };

  const getPaymentAmountDetails = (order) => {
    if (!order) {
      return {
        label: 'ยอดที่ต้องชำระ',
        amount: 0,
        note: ''
      };
    }

    if (isInstallmentOrder(order)) {
      const monthlyAmount = Number(order.monthly_payment);
      const fallbackAmount = Number(order.total_amount);
      const amount = Number.isFinite(monthlyAmount) && monthlyAmount > 0 ? monthlyAmount : fallbackAmount;
      const totalPeriods = Number(order.installment_periods);
      const note =
        Number.isFinite(totalPeriods) && totalPeriods > 0
          ? `งวดที่ 1 จากทั้งหมด ${totalPeriods} งวด`
          : 'งวดแรกของการผ่อนชำระ';
      return {
        label: 'ยอดชำระงวดแรก',
        amount,
        note
      };
    }

    const totalAmount = Number(order.total_amount);
    return {
      label: 'ยอดที่ต้องชำระ',
      amount: Number.isFinite(totalAmount) ? totalAmount : 0,
      note: ''
    };
  };

  const paymentDetails = paymentModalOrder ? getPaymentAmountDetails(paymentModalOrder) : null;

  const renderPaymentMethod = (order) => getPaymentMethodInfo(order).label;
  const selectedPaymentLabel = selectedPaymentOption === 'cod' ? 'เก็บเงินปลายทาง' : 'สแกน QR Code';

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

  if (orders.length === 0) {
    return (
      <Container className="my-5">
        <Alert variant="info">
          <h4>ยังไม่มีคำสั่งซื้อ</h4>
          <p>เริ่มซื้อสินค้าเลย!</p>
        </Alert>
      </Container>
    );
  }

  return (
    <section className="orders-page">
      <Container className="orders-container my-5">
      <h2 className="orders-title">คำสั่งซื้อของฉัน</h2>
      {orders.length > 0 && renderFilterSelect()}

      <Card>
        <Card.Body>
          <Table responsive hover className="orders-table">
            <thead>
              <tr>
                <th>เลขที่คำสั่งซื้อ</th>
                <th>วันที่</th>
                <th>ยอดรวม</th>
                <th>วิธีชำระ</th>
                <th>จำนวนงวด</th>
                <th>ยอดผ่อน/เดือน</th>
                <th>สถานะ</th>
                <th className="text-end">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{new Date(order.order_date).toLocaleDateString('th-TH')}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td>{renderPaymentMethod(order)}</td>
                    <td>{renderInstallmentInfo(order)}</td>
                    <td>{renderMonthlyPayment(order)}</td>
                    <td>
                      <div>
                        {getStatusBadge(order.order_status)}
                        {order.order_status === 'cancelled' && order.cancel_reason && (
                          <div className="mt-2">
                            <small className="text-muted d-block">สาเหตุ:</small>
                            <small className="text-danger">{order.cancel_reason}</small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="orders-actions">
                        {order.order_status === 'awaiting_payment' && (
                          <Button
                            variant="primary"
                            className="orders-pay-btn"
                            size="sm"
                            onClick={() => handleOpenPaymentModal(order)}
                          >
                            <i className="bi bi-qr-code me-2" />
                            ชำระเงิน
                          </Button>
                        )}
                        <Link to={`/orders/${order.order_id}`} className="btn btn-sm btn-outline-primary">
                          ดูรายละเอียด
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="orders-empty-state">
                    ยังไม่มีคำสั่งซื้อในหมวดนี้
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      </Container>

      <Modal
        show={!!paymentModalOrder}
        onHide={handleClosePaymentModal}
        centered
        size="lg"
        contentClassName="orders-payment-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>ชำระเงินคำสั่งซื้อ #{paymentModalOrder?.order_id ?? '-'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {paymentModalOrder && (
            <>
              {paymentDetails && (
                <div className="payment-summary">
                  <div>
                    <span className="label">{paymentDetails.label}</span>
                    <strong>{formatCurrency(paymentDetails.amount)}</strong>
                    {paymentDetails.note && (
                      <span className="payment-summary__note">{paymentDetails.note}</span>
                    )}
                  </div>
                  <div>
                    <span className="label">วิธีชำระ</span>
                    <strong>{selectedPaymentLabel}</strong>
                  </div>
                  <div>
                    <span className="label">สถานะปัจจุบัน</span>
                    {getStatusBadge(paymentModalOrder.order_status)}
                  </div>
                </div>
              )}

              <div className="payment-options-table">
                <Table responsive bordered hover className="payment-options-table__table align-middle">
                  <tbody>
                    <tr
                      className={`payment-options-table__row ${
                        selectedPaymentOption === 'qr' ? 'payment-options-table__row--selected' : ''
                      }`}
                      onClick={() => setSelectedPaymentOption('qr')}
                    >
                      <td className="payment-options-table__selector-col">
                        <Form.Check
                          type="radio"
                          name="payment-option"
                          id="payment-option-qr"
                          checked={selectedPaymentOption === 'qr'}
                          onChange={() => setSelectedPaymentOption('qr')}
                          label=""
                        />
                      </td>
                      <td className="payment-options-table__content">
                        <div className="payment-options-table__heading">
                          <span className="eyebrow">ตัวเลือกที่แนะนำ</span>
                          <h3>สแกน QR Code</h3>
                        </div>
                        <p className="payment-options-table__caption">
                          เหมาะสำหรับการชำระทันทีผ่านมือถือหรือแอปธนาคาร
                        </p>
                      </td>
                    </tr>
                    <tr
                      className={`payment-options-table__row ${
                        selectedPaymentOption === 'cod' ? 'payment-options-table__row--selected' : ''
                      }`}
                      onClick={() => setSelectedPaymentOption('cod')}
                    >
                      <td className="payment-options-table__selector-col">
                        <Form.Check
                          type="radio"
                          name="payment-option"
                          id="payment-option-cod"
                          checked={selectedPaymentOption === 'cod'}
                          onChange={() => setSelectedPaymentOption('cod')}
                          label=""
                        />
                      </td>
                      <td className="payment-options-table__content">
                        <div className="payment-options-table__heading">
                          <span className="eyebrow">ชำระตอนรับสินค้า</span>
                          <h3>เก็บเงินปลายทาง</h3>
                        </div>
                        <p className="payment-options-table__caption">
                          กรอกที่อยู่จัดส่งให้ครบถ้วนและเตรียมยอดเงินให้พร้อมก่อนวันนัดหมาย
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              <div className="payment-option-detail">
                {selectedPaymentOption === 'qr' && (
                  <div className="payment-option-detail__panel">
                    <div className="payment-option-detail__header">
                      <h4>สแกน QR Code</h4>
                      <Badge bg="light" text="dark">
                        พร้อมเพย์
                      </Badge>
                    </div>
                    <div className="payment-option-detail__body">
                      <div className="qr-shell">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=ORDER-${paymentModalOrder.order_id}-${paymentModalOrder.total_amount}`}
                          alt="QR สำหรับชำระเงิน"
                        />
                      </div>
                      {paymentDetails && (
                        <p className="payment-instructions__summary">
                          ยอดที่ต้องชำระ {formatCurrency(paymentDetails.amount)} ({paymentDetails.label})
                        </p>
                      )}
                      <div className="payment-option-detail__actions">
                        <Button variant="primary">ดาวน์โหลด QR</Button>
                        <Button variant="outline-primary">คัดลอกยอดชำระ</Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentOption === 'cod' && (
                  <div className="payment-option-detail__panel">
                    <div className="payment-option-detail__header">
                      <h4>เก็บเงินปลายทาง</h4>
                      <Badge bg="light" text="dark">
                        ชำระตอนรับสินค้า
                      </Badge>
                    </div>
                    <div className="payment-option-detail__body payment-option-detail__body--cod">
                      <div className="payment-option-detail__icon">
                        <i className="bi bi-truck" />
                      </div>
                      <div className="payment-option-detail__content">
                        <p>
                          เจ้าหน้าที่จะโทรยืนยันภายใน 24 ชั่วโมงเพื่อยืนยันกำหนดส่ง กรุณาเตรียมยอดชำระให้ครบถ้วนก่อนวันจัดส่ง
                        </p>
                        <ul className="payment-option-detail__list">
                          <li>จัดส่งภายใน 3-5 วันทำการหลังการยืนยัน</li>
                          <li>รับชำระด้วยเงินสดเท่านั้น</li>
                          <li>สามารถเปลี่ยนกลับมาใช้การชำระออนไลน์ได้ตลอด</li>
                        </ul>
                        <div className="payment-option-detail__actions">
                          <Button variant="outline-secondary">ขอเปลี่ยนเป็นเก็บเงินปลายทาง</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="payment-modal-footer">
          <div>
            หากชำระเงินเรียบร้อยแล้ว ทีมงานจะอัปเดตสถานะเป็น <strong>รอส่ง</strong> ภายใน 1 ชั่วโมง
          </div>
          <Button variant="secondary" onClick={handleClosePaymentModal}>
            ปิดหน้าต่าง
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

