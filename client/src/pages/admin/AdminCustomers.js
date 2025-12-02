import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import NotificationBell from '../../components/NotificationBell';
import './AdminCustomers.css';

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
  return date.toLocaleDateString('th-TH');
};

export default function AdminCustomers({
  admin,
  logout,
  isSidebarCollapsed,
  toggleSidebar,
  adminNotifications,
  markAdminOrdersSeen,
  markAdminCustomersSeen
}) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState(new Map());
  const [previousCustomersCount, setPreviousCustomersCount] = useState(0);
  const [alerts, setAlerts] = useState([]);

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

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/admin/customers');
        const newCustomers = response.data || [];
        
        // ตรวจสอบว่ามีลูกค้าใหม่หรือไม่
        if (previousCustomersCount > 0 && !isLoading && newCustomers.length > previousCustomersCount) {
          const newCount = newCustomers.length - previousCustomersCount;
          playNotificationSound();
          setAlerts(prev => [...prev, {
            id: Date.now(),
            type: 'success',
            message: `มีลูกค้าใหม่ ${newCount} คน`,
            timestamp: new Date()
          }]);
        }
        
        setCustomers(newCustomers);
        setPreviousCustomersCount(newCustomers.length);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
    const interval = setInterval(fetchCustomers, 30000);
    return () => clearInterval(interval);
  }, []);

  // ไม่แสดง popup alerts แล้ว ใช้ notification bell แทน

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalOrders = customers.reduce((sum, customer) => sum + (customer.ordersCount || 0), 0);
    const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);
    const awaiting = customers.reduce((sum, customer) => sum + (customer.awaitingCount || 0), 0);
    return {
      totalCustomers,
      totalOrders,
      totalRevenue,
      awaiting
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    let result = customers;
    if (keyword) {
      const normalizedKeyword = keyword.startsWith('#') ? keyword.slice(1) : keyword;
      result = result.filter((customer) => {
        const idString = String(customer.id || '');
        const usernameString = (customer.username || '').toLowerCase();

        const idMatch =
          idString === normalizedKeyword ||
          idString.startsWith(normalizedKeyword);

        const usernameMatch = usernameString.startsWith(keyword);
        if (idMatch || usernameMatch) {
          return true;
        }

        const haystack = [
          customer.firstName,
          customer.lastName,
          customer.email,
          customer.phone,
          customer.address?.address
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(keyword);
      });
    }

    const sorted = [...result];
    switch (sortKey) {
      case 'orders':
        sorted.sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));
        break;
      case 'revenue':
        sorted.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
        break;
      case 'awaiting':
        sorted.sort((a, b) => (b.awaitingCount || 0) - (a.awaitingCount || 0));
        break;
      default:
        sorted.sort((a, b) => new Date(b.lastOrderDate || b.createdAt || 0) - new Date(a.lastOrderDate || a.createdAt || 0));
    }
    return sorted;
  }, [customers, search, sortKey]);

  const renderAddress = (address) => {
    if (!address || !address.address) {
      return <span className="text-muted">-</span>;
    }
    return <span className="admin-customers__address">{address.address}</span>;
  };

  return (
    <div className="admin-customers-page">
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
      <Container className="py-5">
        <section className="admin-customers__hero">
          <div>
            <span className="eyebrow"><i className="bi bi-people" /> รายชื่อลูกค้าของคุณ</span>
            <h1>ลูกค้าทั้งหมด {stats.totalCustomers.toLocaleString('th-TH')} คน</h1>
            <p>
              ดูข้อมูลลูกค้า ประวัติการสั่งซื้อ และจำนวนออเดอร์ที่ต้องติดตามในที่เดียว
              ใช้ข้อมูลเหล่านี้ในการวางแผนแคมเปญและการบริการหลังการขายให้มีประสิทธิภาพมากขึ้น
            </p>
          </div>
          <Card className="admin-customers__hero-stats">
            <Card.Body>
              <div>
                <span className="label">ยอดสั่งซื้อสะสม</span>
                <strong>{stats.totalOrders.toLocaleString('th-TH')} รายการ</strong>
              </div>
              <div>
                <span className="label">ยอดใช้จ่ายรวม</span>
                <strong>{formatCurrency(stats.totalRevenue)}</strong>
              </div>
              <div>
                <span className="label">ออเดอร์รอชำระ</span>
                <Badge bg={stats.awaiting > 0 ? 'warning' : 'secondary'}>{stats.awaiting}</Badge>
              </div>
            </Card.Body>
          </Card>
        </section>

        <Card className="admin-customers__controls">
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ค้นหาจากชื่อ, อีเมล, เบอร์โทร หรือที่อยู่"
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                  <option value="recent">เรียงตามล่าสุด</option>
                  <option value="orders">จำนวนคำสั่งซื้อสูงสุด</option>
                  <option value="revenue">ยอดใช้จ่ายสูงสุด</option>
                  <option value="awaiting">ออเดอร์รอชำระสูงสุด</option>
                </Form.Select>
              </Col>
              <Col md={3} className="text-end d-flex align-items-center justify-content-end">
                <Button variant="outline-secondary" onClick={() => setSearch('')} disabled={!search}>
                  ล้างการค้นหา
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="admin-customers__table-card">
          <Card.Body>
            {isLoading ? (
              <div className="admin-customers__loading">
                <div className="spinner-border" role="status" />
                <span>กำลังโหลดข้อมูลลูกค้า...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="admin-customers__empty">
                <i className="bi bi-person-x" />
                <strong>ไม่พบลูกค้าที่ตรงกับเงื่อนไข</strong>
                <p>ลองแก้ไขคำค้นหาหรือรีเซ็ตตัวกรองเพื่อดูข้อมูลทั้งหมด</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="admin-customers__table">
                  <thead>
                    <tr>
                      <th>ลูกค้า</th>
                      <th>Username</th>
                      <th>คำสั่งซื้อ</th>
                      <th>รอชำระ</th>
                      <th>รออนุมัติ</th>
                      <th>ยอดใช้จ่ายรวม</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div className="admin-customers__table-name">
                            <div className="admin-customers__table-avatar">
                              <span>{(customer.firstName || '?').charAt(0)}</span>
                            </div>
                            <div>
                              <strong>{customer.firstName} {customer.lastName}</strong>
                              <div className="admin-customers__table-id">ID #{customer.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{customer.username || <span className="text-muted">ไม่ระบุ</span>}</td>
                        <td>{(customer.ordersCount || 0).toLocaleString('th-TH')}</td>
                        <td>{customer.awaitingCount || 0}</td>
                        <td>{customer.pendingCount || 0}</td>
                        <td>{formatCurrency(customer.totalSpent || 0)}</td>
                        <td className="text-end">
                          <Button
                            as={Link}
                            to={`/admin/customers/${customer.id}`}
                            variant="outline-secondary"
                            className="admin-customers__detail-btn"
                          >
                            รายละเอียด
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
