import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import './Profile.css';

const TABS = [
  { key: 'info', label: 'ข้อมูลของฉัน', icon: 'bi-person' },
  { key: 'addresses', label: 'ที่อยู่จัดส่ง', icon: 'bi-geo-alt' }
];

export default function Profile({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toCleanString = (value) => (value === undefined || value === null ? '' : String(value).trim());
  const sanitizePhone = (value) => toCleanString(value).replace(/\D+/g, '');
  const splitFullName = (fullName) => {
    if (!fullName) {
      return { first: '', last: '' };
    }
    const parts = String(fullName)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) {
      return { first: '', last: '' };
    }
    if (parts.length === 1) {
      return { first: parts[0], last: '' };
    }
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };
  const hasShippingValues = (entry) =>
    entry &&
    Object.values(entry).some((value) => toCleanString(value).length > 0);
  const emptyShipping = {
    recipientName: '',
    recipientSurname: '',
    phone: '',
    address: ''
  };

  const normalizeShippingEntry = (entry) => {
    if (!entry) {
      return { ...emptyShipping };
    }

    if (typeof entry === 'string') {
      return { ...emptyShipping, address: entry };
    }

    return {
      recipientName: entry.recipientName || '',
      recipientSurname: entry.recipientSurname || '',
      phone: sanitizePhone(entry.phone),
      address: entry.address || ''
    };
  };

  const cleanShippingEntry = (entry) => ({
    recipientName: (entry?.recipientName || '').trim(),
    recipientSurname: (entry?.recipientSurname || '').trim(),
    phone: sanitizePhone(entry?.phone),
    address: (entry?.address || '').trim()
  });

  const [formData, setFormData] = useState({
    username: '',
    fname: '',
    lname: '',
    email: '',
    tel: '',
    primaryShipping: { ...emptyShipping },
    alternativeAddresses: [],
    emailVerified: false
  });

  const buildProfilePayload = () => ({
    fname: formData.fname,
    lname: formData.lname,
    email: formData.email,
    tel: formData.tel,
    primaryShipping: cleanShippingEntry(formData.primaryShipping),
    alternativeAddresses: formData.alternativeAddresses
      .map((entry) => cleanShippingEntry(entry))
      .filter((entry) => entry.address)
  });
  const [message, setMessage] = useState({ show: false, text: '', variant: '' });
  const [addressMessage, setAddressMessage] = useState({ show: false, text: '', variant: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ show: false, text: '', variant: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (!user) {
      return;
    }
    const { first: nameFromFull, last: surnameFromFull } = splitFullName(user.name);
    const userSeed = {
      fname: toCleanString(user.firstName) || nameFromFull,
      lname: toCleanString(user.lastName) || surnameFromFull,
      tel: sanitizePhone(user.phone),
      primaryShipping: {
        recipientName: toCleanString(user.firstName) || nameFromFull,
        recipientSurname: toCleanString(user.lastName) || surnameFromFull,
        phone: sanitizePhone(user.phone),
        address: toCleanString(user.address)
      }
    };

    setFormData((prev) => {
      const nextPrimary = hasShippingValues(prev.primaryShipping)
        ? prev.primaryShipping
        : { ...prev.primaryShipping, ...userSeed.primaryShipping };

      return {
        ...prev,
        fname: toCleanString(prev.fname) || userSeed.fname,
        lname: toCleanString(prev.lname) || userSeed.lname,
        tel: sanitizePhone(prev.tel) || userSeed.tel,
        primaryShipping: nextPrimary
      };
    });
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const isValidTab = tabParam && TABS.some((tab) => tab.key === tabParam);

    if (isValidTab && tabParam !== activeTab) {
      setActiveTab(tabParam);
    } else if (!isValidTab && activeTab !== 'info') {
      setActiveTab('info');
    }
  }, [location.search, activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(location.search);
    if (tabKey === 'info') {
      params.delete('tab');
    } else {
      params.set('tab', tabKey);
    }
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/customer/profile');
      const shippingProfile = response.data.shipping_profile || {};
      const accountFname = toCleanString(response.data.customer_fname);
      const accountLname = toCleanString(response.data.customer_lname);
      const accountTel = sanitizePhone(response.data.customer_tel);
      const accountEmail = toCleanString(response.data.customer_email);
      const primaryShippingRaw = normalizeShippingEntry(
        shippingProfile.primary || response.data.customer_address
      );
      const { first: userNameFirst, last: userNameLast } = splitFullName(user?.name);
      const fallbackFirstName =
        accountFname || toCleanString(user?.firstName) || userNameFirst;
      const fallbackLastName =
        accountLname || toCleanString(user?.lastName) || userNameLast;
      const fallbackPhone =
        accountTel || sanitizePhone(user?.phone) || sanitizePhone(primaryShippingRaw.phone);
      const fallbackAddress =
        primaryShippingRaw.address || toCleanString(user?.address);

      const resolvedPrimary = {
        recipientName: primaryShippingRaw.recipientName || fallbackFirstName,
        recipientSurname: primaryShippingRaw.recipientSurname || fallbackLastName,
        phone: sanitizePhone(primaryShippingRaw.phone) || fallbackPhone,
        address: primaryShippingRaw.address || fallbackAddress
      };

      const rawAlternatives = Array.isArray(shippingProfile.alternatives)
        ? shippingProfile.alternatives
        : Array.isArray(response.data.alternativeAddresses)
        ? response.data.alternativeAddresses
        : [];

      const alternativeAddresses = rawAlternatives
        .map((entry) => normalizeShippingEntry(entry))
        .filter((entry) => entry.address);

      setFormData({
        username: response.data.customer_username,
        fname: fallbackFirstName,
        lname: fallbackLastName,
        email: accountEmail || user?.email || '',
        tel: fallbackPhone,
        primaryShipping: resolvedPrimary,
        alternativeAddresses,
        emailVerified: Boolean(response.data.email_verified)
      });

      const mergedUser = {
        ...(user || {}),
        id: response.data.customer_id ?? user?.id,
        username: response.data.customer_username || user?.username,
        email: accountEmail || user?.email || '',
        firstName: fallbackFirstName,
        lastName: fallbackLastName,
        phone: fallbackPhone,
        address: resolvedPrimary.address,
        emailVerified: Boolean(response.data.email_verified),
        role: user?.role || 'customer'
      };
      try {
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } catch (storageError) {
        console.warn('Unable to persist user profile to storage:', storageError);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userChanged', { detail: { user: mergedUser } }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'tel' ? sanitizePhone(value) : value,
      ...(name === 'email' ? { emailVerified: false } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ show: false });

    try {
      await axios.put('/api/customer/profile', buildProfilePayload());
      setMessage({ show: true, text: 'บันทึกข้อมูลสำเร็จ', variant: 'success' });
    } catch (error) {
      const errorText = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      console.error('Update profile error:', error);
      setMessage({
        show: true,
        text: errorText,
        variant: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAlternativeAddress = () => {
    setFormData((prev) => ({
      ...prev,
      alternativeAddresses: [...prev.alternativeAddresses, { ...emptyShipping }]
    }));
  };

  const updateAlternativeAddress = (index, field, value) => {
    setFormData((prev) => {
      const next = prev.alternativeAddresses.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: field === 'phone' ? sanitizePhone(value) : value }
          : item
      );
      return {
        ...prev,
        alternativeAddresses: next
      };
    });
  };

  const removeAlternativeAddress = (index) => {
    setFormData((prev) => {
      const next = prev.alternativeAddresses.filter((_, i) => i !== index);
      return {
        ...prev,
        alternativeAddresses: next
      };
    });
  };

  const handlePrimaryShippingChange = (field, value) => {
    setFormData((prev) => {
      const nextValue = field === 'phone' ? sanitizePhone(value) : value;
      const updated = {
        ...prev,
        primaryShipping: {
          ...prev.primaryShipping,
          [field]: nextValue
        }
      };

      if (field === 'recipientName') {
        updated.fname = nextValue;
      } else if (field === 'recipientSurname') {
        updated.lname = nextValue;
      } else if (field === 'phone') {
        updated.tel = nextValue;
      }

      return updated;
    });
  };

  const handleAddressSave = async () => {
    setIsAddressSaving(true);
    setAddressMessage({ show: false });
    try {
      await axios.put('/api/customer/profile', buildProfilePayload());
      setAddressMessage({ show: true, text: 'บันทึกที่อยู่เรียบร้อยแล้ว', variant: 'success' });
    } catch (error) {
      const errorText = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการบันทึกที่อยู่';
      console.error('Update address error:', error);
      setAddressMessage({
        show: true,
        text: errorText,
        variant: 'danger'
      });
    } finally {
      setIsAddressSaving(false);
    }
  };

  const goToVerifyEmail = () => {
    const emailForVerify = formData.email || user?.email || '';
    navigate('/verify-email', {
      state: {
        email: emailForVerify,
        fromProfile: true
      }
    });
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage({ show: false });

    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ show: true, text: 'กรุณากรอกรหัสผ่านให้ครบทุกช่อง', variant: 'danger' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ show: true, text: 'รหัสผ่านใหม่ควรมีอย่างน้อย 6 ตัวอักษร', variant: 'danger' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ show: true, text: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', variant: 'danger' });
      return;
    }

    setIsPasswordLoading(true);
    try {
      await axios.put('/api/customer/password', { currentPassword, newPassword });
      setPasswordMessage({ show: true, text: 'เปลี่ยนรหัสผ่านสำเร็จ', variant: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      const errorText = error.response?.data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      setPasswordMessage({ show: true, text: errorText, variant: 'danger' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const renderInfoTab = () => (
    <Card className="profile-content-card">
      <Card.Header className="profile-content-card__header">
        <div>
          <h2>ข้อมูลส่วนตัว</h2>
          <p>จัดการข้อมูลพื้นฐานสำหรับการติดต่อและความปลอดภัยของบัญชี</p>
        </div>
      </Card.Header>
      <Card.Body>
        {message.show && (
          <Alert variant={message.variant} dismissible onClose={() => setMessage({ show: false })}>
            {message.text}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-form__header-grid">
            <Form.Group>
              <Form.Label>ชื่อผู้ใช้ (แก้ไขไม่ได้)</Form.Label>
              <Form.Control
                type="text"
                value={formData.username || user?.username || ''}
                disabled
                readOnly
                className="profile-username-field"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>อีเมล</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email || user?.email || ''}
                onChange={handleChange}
                required
              />
              <div className="profile-email-status">
                <span className={`profile-email-badge ${formData.emailVerified ? 'is-verified' : 'is-pending'}`}>
                  <i className={`bi ${formData.emailVerified ? 'bi-patch-check-fill' : 'bi-exclamation-circle'}`} />
                  {formData.emailVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยันอีเมล'}
                </span>
                {!formData.emailVerified ? (
                  <>
                    <button
                      type="button"
                      className="profile-email-resend"
                      onClick={goToVerifyEmail}
                      disabled={!formData.email && !user?.email}
                    >
                      ยืนยันอีเมล
                    </button>
                    <span className="profile-email-note profile-email-note--danger">
                      กดปุ่มเพื่อกรอกรหัส OTP และเปิดใช้งานอีเมลสำหรับส่งคำสั่งซื้อ
                    </span>
                  </>
                ) : (
                  <span className="profile-email-note">อีเมลนี้ถูกยืนยันแล้ว สามารถใช้ส่งคำสั่งซื้อได้ทันที</span>
                )}
              </div>
            </Form.Group>
          </div>

          <div className="profile-form__actions">
            <span className="profile-form__hint">
              <i className="bi bi-info-circle me-1" /> ข้อมูลของคุณถูกเข้ารหัสและใช้เพื่อการบริการลูกค้าเท่านั้น
            </span>
            <Button variant="primary" type="submit" className="btn-primary-custom" disabled={isLoading}>
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </Form>

        <div className="profile-password-block">
          <div className="profile-password-head">
            <div>
              <h3>รหัสผ่าน</h3>
              <p>เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี</p>
            </div>
            <Button type="button" variant="light" onClick={() => setShowPasswordForm((prev) => !prev)}>
              <i className="bi bi-lock"></i> {showPasswordForm ? 'ยกเลิก' : 'แก้ไขรหัสผ่าน'}
            </Button>
          </div>

          {passwordMessage.show && (
            <Alert
              variant={passwordMessage.variant}
              dismissible
              onClose={() => setPasswordMessage({ show: false })}
              className="profile-password-alert"
            >
              {passwordMessage.text}
            </Alert>
          )}

          {showPasswordForm && (
            <Form onSubmit={handlePasswordSubmit} className="profile-password-form">
              <Form.Group>
                <Form.Label>รหัสผ่านปัจจุบัน</Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>รหัสผ่านใหม่</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>ยืนยันรหัสผ่านใหม่</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  required
                />
              </Form.Group>
              <div className="profile-form__actions">
                <span className="profile-form__hint">
                  <i className="bi bi-info-circle me-1" /> รหัสผ่านใหม่ควรมีตัวอักษรและตัวเลขผสมกันอย่างน้อย 6 ตัว
                </span>
                <Button variant="primary" type="submit" className="btn-primary-custom" disabled={isPasswordLoading}>
                  {isPasswordLoading ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่าน'}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  const renderAddressesTab = () => (
    <Card className="profile-content-card">
      <Card.Header className="profile-content-card__header">
        <div>
          <h2>ผู้รับและที่อยู่จัดส่ง</h2>
          <p>กำหนดชื่อผู้รับ และที่อยู่สำหรับการจัดส่งสินค้า</p>
        </div>
        <Button type="button" className="btn-outline" onClick={addAlternativeAddress}>
          <i className="bi bi-plus-circle me-1" /> เพิ่มที่อยู่ใหม่
        </Button>
      </Card.Header>
      <Card.Body>
        {addressMessage.show && (
          <Alert
            variant={addressMessage.variant}
            dismissible
            onClose={() => setAddressMessage({ show: false })}
          >
            {addressMessage.text}
          </Alert>
        )}
        <div className="profile-address-section">
          <div className="profile-recipient-grid">
            <Form.Group>
              <Form.Label>ชื่อผู้รับ</Form.Label>
              <Form.Control
                type="text"
                value={formData.primaryShipping.recipientName}
                onChange={(event) => handlePrimaryShippingChange('recipientName', event.target.value)}
                placeholder="ชื่อจริงของผู้รับ"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>นามสกุล</Form.Label>
              <Form.Control
                type="text"
                value={formData.primaryShipping.recipientSurname}
                onChange={(event) => handlePrimaryShippingChange('recipientSurname', event.target.value)}
                placeholder="นามสกุลผู้รับ"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>เบอร์โทรสำหรับติดต่อ</Form.Label>
              <Form.Control
                type="tel"
                value={formData.primaryShipping.phone}
                onChange={(event) => handlePrimaryShippingChange('phone', event.target.value)}
                placeholder="เบอร์โทร"
              />
            </Form.Group>
          </div>
          <Form.Group className="mt-3">
            <Form.Label>รายละเอียดที่อยู่</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.primaryShipping.address}
              onChange={(event) => handlePrimaryShippingChange('address', event.target.value)}
              placeholder="ตัวอย่าง: บ้านคุณพ่อ 42/7 ถนนสุขใจ เขตดุสิต กรุงเทพฯ 10200"
            />
          </Form.Group>

          <div className="profile-alt-wrapper">
            {formData.alternativeAddresses.map((address, index) => (
              <div key={index} className="profile-alt-card">
                <div className="profile-alt-card__header">
                  <strong>ที่อยู่ #{index + 1}</strong>
                  <button
                    type="button"
                    className="profile-alt-remove"
                    onClick={() => removeAlternativeAddress(index)}
                    aria-label="ลบที่อยู่นี้"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
                <div className="profile-alt-card__body">
                  <div className="profile-recipient-grid">
                    <Form.Group>
                      <Form.Label>ชื่อผู้รับ</Form.Label>
                      <Form.Control
                        type="text"
                        value={address.recipientName}
                        onChange={(event) => updateAlternativeAddress(index, 'recipientName', event.target.value)}
                        placeholder="ชื่อจริงของผู้รับ"
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={address.recipientSurname}
                        onChange={(event) => updateAlternativeAddress(index, 'recipientSurname', event.target.value)}
                        placeholder="นามสกุลผู้รับ"
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>เบอร์โทรสำหรับติดต่อ</Form.Label>
                      <Form.Control
                        type="tel"
                        value={address.phone}
                        onChange={(event) => updateAlternativeAddress(index, 'phone', event.target.value)}
                        placeholder="เบอร์โทร"
                      />
                    </Form.Group>
                  </div>
                  <Form.Group className="mt-3">
                    <Form.Label>รายละเอียดที่อยู่</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={address.address}
                      onChange={(event) => updateAlternativeAddress(index, 'address', event.target.value)}
                      placeholder="ตัวอย่าง: บ้านคุณพ่อ 42/7 ถนนสุขใจ เขตดุสิต กรุงเทพฯ 10200"
                    />
                  </Form.Group>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-form__actions">
          <span className="profile-form__hint">
            <i className="bi bi-info-circle me-1" /> สามารถเพิ่มที่อยู่ใหม่ได้หลายรายการ
          </span>
          <Button
            variant="primary"
            type="button"
            className="btn-primary-custom"
            disabled={isAddressSaving}
            onClick={handleAddressSave}
          >
            {isAddressSaving ? 'กำลังบันทึก...' : 'บันทึกที่อยู่ทั้งหมด'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="profile-shell my-5">
      <div className="profile-sidebar">
        <div className="profile-sidebar__head">
          <div className="profile-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          <div>
            <strong>{formData.username || user?.username || 'สมาชิก'}</strong>
            <span>{formData.email || user?.email || 'ไม่ระบุอีเมล'}</span>
          </div>
        </div>
        <nav className="profile-sidebar__nav">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`profile-nav-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="profile-content">
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'addresses' && renderAddressesTab()}
      </div>
    </Container>
  );
}