import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validatePassword = () => {
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password
      };
      
      console.log('Sending forgot password request:', { ...payload, password: '***' });
      
      const response = await axios.post('/api/customer/forgot-password', payload);
      
      console.log('Forgot password response:', response.data);
      
      setSuccess(response.data.message || 'รีเซ็ตรหัสผ่านสำเร็จ');
      setTimeout(() => {
        navigate('/login', { state: { passwordReset: true } });
      }, 2000);
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.error || error.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-showcase" aria-hidden="true">
        <div className="login-showcase-overlay" />
        <div className="login-showcase-content">
          <span className="login-badge">แสงสว่างเฟอร์นิเจอร์</span>
          <h1 className="login-headline">
            <span className="login-headline-line">ลืมรหัสผ่าน?</span>
            <span className="login-headline-line">ไม่ต้องกังวล</span>
          </h1>
          <p>
            กรอกอีเมลและชื่อผู้ใช้ของคุณ
            <br />
            แล้วตั้งรหัสผ่านใหม่ได้เลย
          </p>
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
              <h2>รีเซ็ตรหัสผ่าน</h2>
              <p>กรอกอีเมล ชื่อผู้ใช้ และรหัสผ่านใหม่</p>
            </header>

            {success && (
              <div className="login-alert login-alert--info" role="status">
                <span>{success}</span>
                <button
                  type="button"
                  onClick={() => setSuccess('')}
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
                <span>อีเมล</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="login-input"
                  autoComplete="email"
                />
              </label>

              <label className="login-field">
                <span>ชื่อผู้ใช้</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="กรอกชื่อผู้ใช้ของคุณ"
                  required
                  className="login-input"
                  autoComplete="username"
                />
              </label>

              <label className="login-field">
                <span>รหัสผ่านใหม่</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="กรอกรหัสผ่านใหม่"
                  required
                  className="login-input"
                  autoComplete="new-password"
                  minLength={6}
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

              <label className="login-field">
                <span>ยืนยันรหัสผ่าน</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  required
                  className="login-input"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="login-input-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </label>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'รีเซ็ตรหัสผ่าน'}
              </button>
            </form>

            <div className="login-secondary-actions">
              <button
                type="button"
                className="login-secondary-btn"
                onClick={() => navigate('/login')}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

