import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css';

const OTP_LENGTH = 6;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialEmail =
    location.state?.email || searchParams.get('email') || location.state?.pendingEmail || '';

  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(
    initialEmail ? `เราได้ส่งรหัส OTP ไปที่ ${initialEmail} แล้ว` : ''
  );
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const otpValue = otpDigits.join('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setInfoMessage('');

    if (!email || !otpValue || otpValue.length < OTP_LENGTH) {
      setError('กรุณากรอกอีเมลและรหัส OTP ให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/customer/verify-email', {
        email,
        otp: otpValue
      });
      setSuccessMessage(response.data?.message || 'ยืนยันอีเมลสำเร็จ');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => {
        navigate('/login', { replace: true, state: { verifiedEmail: email } });
      }, 1500);
    } catch (err) {
      console.error('Verify email error:', err);
      const serverMessage = err.response?.data?.error || 'ไม่สามารถยืนยันอีเมลได้';
      setError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('กรุณากรอกอีเมลเพื่อรับรหัส OTP');
      return;
    }
    setError('');
    setSuccessMessage('');
    setInfoMessage('');
    setIsResending(true);

    try {
      const response = await axios.post('/api/customer/resend-verification', { email });
      setInfoMessage(response.data?.message || `ส่งรหัส OTP ใหม่ไปที่ ${email} แล้ว`);
    } catch (err) {
      console.error('Resend OTP error:', err);
      const serverMessage = err.response?.data?.error || 'ไม่สามารถส่งรหัส OTP ได้';
      setError(serverMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      otpInputsRef.current[index - 1]?.focus();
      event.preventDefault();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
      event.preventDefault();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpInputsRef.current[index + 1]?.focus();
      event.preventDefault();
    }
  };

  const handleOtpPaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }
    const digits = pasted.split('');
    setOtpDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = digits[i] || '';
      }
      return next;
    });
    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    setTimeout(() => {
      otpInputsRef.current[focusIndex]?.focus();
    }, 0);
    event.preventDefault();
  };

  return (
    <div className="verify-email-page">
      <div className="verify-shell">
        <div className="verify-illustration" aria-hidden="true">
          <div className="verify-illustration__badge">
            <i className="bi bi-envelope-check" />
            OTP Verification
          </div>
          <h1>ยืนยันอีเมลของคุณ เพื่อความปลอดภัย</h1>
          <p>
            กรอกรหัส OTP {OTP_LENGTH} หลักที่ส่งไปยังอีเมลของคุณ หากยังไม่ได้รับ สามารถกดส่งรหัสใหม่ได้ภายในหน้าจอนี้
          </p>
        </div>

        <div className="verify-card">
          <header>
            <h2>กรุณากรอกรหัส OTP</h2>
            <p>ระบบได้ส่งรหัสไปที่อีเมลของคุณ</p>
          </header>

          {infoMessage && (
            <div className="verify-alert verify-alert--info" role="status">
              {infoMessage}
            </div>
          )}

          {error && (
            <div className="verify-alert verify-alert--error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} aria-label="ปิดข้อความ">
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="verify-alert verify-alert--success" role="status">
              {successMessage}
            </div>
          )}

          <form className="verify-form" onSubmit={handleSubmit}>
            <label>
              <span>อีเมล</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <div className="verify-otp-field">
              <div className="verify-otp-field__label">
                <span>รหัส OTP</span>
                <small>กรอกตัวเลข {OTP_LENGTH} หลัก</small>
              </div>
              <div className="verify-otp-inputs" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpInputsRef.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    aria-label={`รหัส OTP หลักที่ ${index + 1}`}
                    required
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="verify-submit" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังยืนยัน...' : 'ยืนยันอีเมล'}
            </button>
          </form>

          <div className="verify-extra">
            <span>ยังไม่ได้รับรหัส?</span>
            <button type="button" onClick={handleResendOtp} disabled={isResending}>
              {isResending ? 'กำลังส่ง...' : 'ส่งรหัสใหม่'}
            </button>
          </div>

          <footer className="verify-footer">
            <button
              type="button"
              className="verify-footer__button"
              onClick={() => navigate('/profile')}
            >
              กลับไปหน้าบัญชีผู้ใช้
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}


