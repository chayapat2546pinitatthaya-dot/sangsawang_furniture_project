import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

export default function Login({ login }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const state = location.state;
    if (state?.verifiedEmail) {
      setInfoMessage(`บัญชี ${state.verifiedEmail} ยืนยันอีเมลเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที`);
      setFormData((prev) => ({
        ...prev,
        username: state.verifiedEmail
      }));
      return;
    }
    if (state?.fromRegister && state?.email) {
      setFormData((prev) => ({
        ...prev,
        username: state.email
      }));
    }
    if (state?.passwordReset) {
      setInfoMessage('รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setPendingVerificationEmail('');
    setResendMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setResendMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/customer/login', formData);
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ';
      setError(message);
      if (error.response?.data?.requiresVerification) {
        const emailForResend = error.response?.data?.pendingEmail || formData.username;
        setPendingVerificationEmail(emailForResend);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) {
      return;
    }
    setIsResending(true);
    setResendMessage('');
    try {
      const response = await axios.post('/api/customer/resend-verification', {
        email: pendingVerificationEmail
      });
      setResendMessage(response.data?.message || 'ส่งรหัส OTP ใหม่แล้ว');
    } catch (error) {
      console.error('Resend verification error:', error);
      setResendMessage(error.response?.data?.error || 'ไม่สามารถส่งรหัส OTP ใหม่ได้');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-showcase" aria-hidden="true">
        <div className="login-showcase-overlay" />
        <div className="login-showcase-content">
          <span className="login-badge">แสงสว่างเฟอร์นิเจอร์</span>
          <h1 className="login-headline">
            <span className="login-headline-line">กลับมาสู่ประสบการณ์...</span>
            <span className="login-headline-line">ผ่อนง่าย จ่ายสะดวก</span>
          </h1>
          <p>
            เข้าสู่ระบบเพื่อติดตามสถานะคำสั่งซื้อ,
            <br />
            จัดการยอดผ่อนชำระ และเริ่มต้นการสั่งซื้อครั้งใหม่ได้ทันที
          </p>
          <div className="login-showcase-meta">
            <div>
              <i className="bi bi-credit-card" />
              <span>ผ่อนต่อได้เลย ไม่ต้องกรอกข้อมูลซ้ำ</span>
            </div>
            <div>
              <i className="bi bi-wallet2" />
              <span>จัดการยอดผ่อนชำระทุกงวดในที่เดียว</span>
            </div>
            <div>
              <i className="bi bi-box-seam" />
              <span>อัปเดตสถานะคำสั่งซื้อ</span>
            </div>
            <div>
              <i className="bi bi-stars" />
              <span>รับสิทธิพิเศษและโปรโมชั่นใหม่ก่อนใคร</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-area">
        <div className="login-form-shell">
          <div className="login-brand-icons">
            <i className="bi bi-box" />
            <i className="bi bi-house-door" />
          </div>

          <div className="login-card">
            <header className="login-card-header">
              <h2>แสงสว่าง ยินดีต้อนรับ</h2>
              <p>ครบจบเรื่องเฟอร์นิเจอร์ ในบรรยากาศโปรเฟสชันแนล</p>
            </header>

            {infoMessage && (
              <div className="login-alert login-alert--info" role="status">
                <span>{infoMessage}</span>
                <button
                  type="button"
                  onClick={() => setInfoMessage('')}
                  className="login-alert-dismiss"
                  aria-label="ปิดข้อความแจ้งเตือน"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            )}

            {error && (
              <div className="login-alert" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="login-alert-dismiss"
                  aria-label="ปิดข้อความแจ้งเตือน"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-field">
                <span>ชื่อผู้ใช้หรืออีเมล</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="login-input"
                  autoComplete="username"
                />
              </label>

              <label className="login-field">
                <span>รหัสผ่าน</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  required
                  className="login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-input-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </label>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            {pendingVerificationEmail && (
              <div className="login-resend-block">
                <p>ยังไม่ได้รับรหัส OTP? สามารถขอส่งใหม่หรือกรอกรหัสได้ที่นี่</p>
                <button
                  type="button"
                  className="login-resend-btn"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? 'กำลังส่งรหัส...' : 'ส่งรหัส OTP ใหม่'}
                </button>
                <button
                  type="button"
                  className="login-resend-link"
                  onClick={() =>
                    navigate('/verify-email', { state: { email: pendingVerificationEmail, fromLogin: true } })
                  }
                >
                  ไปหน้ากรอกรหัส OTP
                </button>
                {resendMessage && <p className="login-resend-message">{resendMessage}</p>}
              </div>
            )}

            <div className="login-secondary-actions">
              <button
                type="button"
                className="login-secondary-btn"
                onClick={() => navigate('/register')}
              >
                สมัครสมาชิก
              </button>
              <button
                type="button"
                className="login-secondary-btn"
                onClick={() => navigate('/forgot-password')}
              >
                ลืมรหัสผ่าน
              </button>
            </div>
          </div>

          <div className="login-meta-links">
            <div>
              <i className="bi bi-bag-check" />
              <span>รับประกันสินค้า 30 วัน</span>
            </div>
            <div>
              <i className="bi bi-truck" />
              <span>บริการจัดส่งและติดตั้ง</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
