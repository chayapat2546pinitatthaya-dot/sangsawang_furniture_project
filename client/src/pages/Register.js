import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fname: '',
    lname: '',
    email: '',
    tel: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await axios.post('/api/customer/register', formData);
      setSuccess('สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Register error:', error);
      setError(error.response?.data?.error || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <section className="register-showcase" aria-hidden="true">
        <div className="register-showcase-overlay" />
        <div className="register-showcase-content">
          <span className="register-badge">แผนสมาชิก</span>
          <h1>สิทธิพิเศษสำหรับสมาชิก</h1>
          <p>
            เพิ่มประสบการณ์การสั่งซื้อ <br />
            เพียงอยู่ที่บ้านและรอรับสินค้าได้เลย
          </p>
          <div className="register-benefits">
            <div className="register-benefit-item">
              <i className="bi bi-check-circle-fill"></i>
              <span>ผ่อนง่าย อนุมัติไว เพียงแค่บัตรประชาชนใบเดียว</span>
            </div>
            <div className="register-benefit-item">
              <i className="bi bi-calendar-check"></i>
              <span>เลือกแบ่งจ่ายได้สูงสุด 12 เดือน</span>
            </div>
            <div className="register-benefit-item">
              <i className="bi bi-gift-fill"></i>
              <span>รับส่วนลดและโปรโมชั่นพิเศษเฉพาะสมาชิก</span>
            </div>
            <div className="register-benefit-item">
              <i className="bi bi-clock-history"></i>
              <span>ติดตามสถานะคำสั่งซื้อและยอดผ่อนชำระได้ตลอด 24 ชั่วโมง</span>
            </div>
          </div>
        </div>
      </section>

      <section className="register-form-area">
        <div className="register-form-shell">
          <div className="register-card">
            <header className="register-card-header">
              <h2>สมัครสมาชิกใหม่</h2>
              <p>ปลดล็อกสิทธิพิเศษและบริการเหนือระดับสำหรับคุณ</p>
            </header>

            {error && (
              <div className="register-alert register-alert-error" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  className="register-alert-dismiss"
                  onClick={() => setError('')}
                  aria-label="ปิดข้อความข้อผิดพลาด"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            )}

            {success && (
              <div className="register-alert register-alert-success" role="status">
                <span>{success}</span>
              </div>
            )}

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="register-field">
                <label htmlFor="username">ชื่อผู้ใช้</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="สร้างชื่อผู้ใช้"
                  required
                  className="register-input"
                  autoComplete="username"
                />
              </div>

              <div className="register-field">
                <label htmlFor="password">รหัสผ่าน</label>
                <div className="register-password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="ตั้งรหัสผ่าน"
                    required
                    className="register-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-input-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="register-field-grid">
                <div className="register-field">
                  <label htmlFor="fname">ชื่อจริง</label>
                  <input
                    id="fname"
                    type="text"
                    name="fname"
                    value={formData.fname}
                    onChange={handleChange}
                    placeholder="ชื่อ"
                    required
                    className="register-input"
                    autoComplete="given-name"
                  />
                </div>
                <div className="register-field">
                  <label htmlFor="lname">นามสกุล</label>
                  <input
                    id="lname"
                    type="text"
                    name="lname"
                    value={formData.lname}
                    onChange={handleChange}
                    placeholder="นามสกุล"
                    required
                    className="register-input"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="tel">หมายเลขโทรศัพท์</label>
                <input
                  id="tel"
                  type="tel"
                  name="tel"
                  value={formData.tel}
                  onChange={handleChange}
                  placeholder="0812345678"
                  required
                  className="register-input"
                  autoComplete="tel"
                />
              </div>

              <div className="register-field">
                <label htmlFor="email">อีเมล</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="register-input"
                  autoComplete="email"
                />
              </div>

              <div className="register-field">
                <label htmlFor="address">ที่อยู่จัดส่ง</label>
                <textarea
                  id="address"
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="กรอกที่อยู่สำหรับจัดส่งสินค้า"
                  required
                  className="register-input register-textarea"
                  autoComplete="street-address"
                />
              </div>
              <div className="register-secondary-actions">
                <button
                  type="button"
                  className="register-secondary-btn register-secondary-btn--outline"
                  onClick={() => navigate('/login')}
                >
                  มีบัญชีอยู่แล้ว?
                </button>
                <button
                  type="submit"
                  className="register-secondary-btn register-secondary-btn--primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
