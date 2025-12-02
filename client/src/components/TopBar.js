import React, { useState, useRef, useEffect } from 'react';
import './TopBar.css';

export default function TopBar() {
  const [isQROpen, setIsQROpen] = useState(false);
  const qrDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (qrDropdownRef.current && !qrDropdownRef.current.contains(event.target)) {
        setIsQROpen(false);
      }
    };

    if (isQROpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQROpen]);

  return (
    <div className="top-bar">
      <div className="top-bar-container">
        <div className="top-bar-left">
          <div className="top-bar-item">
            <i className="bi bi-telephone-fill"></i>
            <a href="tel:0818200706">081-820-0706</a>
          </div>
          <div className="top-bar-separator"></div>
          <div className="top-bar-item">
            <i className="bi bi-envelope-fill"></i>
            <a href="mailto:sangsawang_furniture@gmail.com">sangsawang_furniture@gmail.com</a>
          </div>
        </div>
        <div className="top-bar-right">
          <span className="top-bar-follow">ติดตามเราบน</span>
          <div className="top-bar-social">
            <a href="https://line.me/ti/p/PDC87Vuqes" target="_blank" rel="noreferrer" className="top-bar-social-link" title="Line">
              <i className="bi bi-line"></i>
            </a>
            <a href="https://www.facebook.com/groups/904837558214006" target="_blank" rel="noreferrer" className="top-bar-social-link" title="Facebook">
              <i className="bi bi-facebook"></i>
            </a>
            <div className="top-bar-qr-dropdown" ref={qrDropdownRef}>
              <button 
                className="top-bar-qr-toggle" 
                type="button"
                onClick={() => setIsQROpen(!isQROpen)}
                aria-label="QR Code"
              >
                <i className="bi bi-qr-code-scan"></i>
              </button>
              {isQROpen && (
                <div className="top-bar-qr-menu">
                  <div className="top-bar-qr-item">
                    <img src="/images/line-qr.png" alt="Line QR Code" onError={(e) => { e.target.style.display = 'none'; }} />
                    <p>Line QR Code</p>
                  </div>
                  <div className="top-bar-qr-item">
                    <img src="/images/facebook-qr.png" alt="Facebook QR Code" onError={(e) => { e.target.style.display = 'none'; }} />
                    <p>Facebook QR Code</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

