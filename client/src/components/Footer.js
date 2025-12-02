import React from 'react';
import { useLocation } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const location = useLocation();
  const pathname = location.pathname;
  const footerClassNames = [
    'site-footer',
    pathname === '/login' ? 'site-footer--compact' : '',
    pathname === '/register' ? 'site-footer--tight' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <footer className={footerClassNames}>
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img src="/images/sangsawanglogo.png" alt="Sangsawang Furniture" />
          <div>
            <h3>แสงสว่างเฟอร์นิเจอร์</h3>
            <p>ผ่อนง่าย จ่ายสะดวก ต้องที่แสงสว่างเฟอร์นิเจอร์</p>
          </div>
        </div>
        <div className="site-footer-links">
          <div>
            <h4>ติดตามเรา</h4>
            <ul>
              <li>
                <i className="bi bi-facebook"></i>
                <a href="https://www.facebook.com/groups/904837558214006" target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
              <li>
                <i className="bi bi-line"></i>
                <a href="https://line.me/ti/p/PDC87Vuqes" target="_blank" rel="noreferrer">
                  Line
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>ติดต่อเรา</h4>
            <ul>
              <li>
                <i className="bi bi-envelope"></i>
                <a href="mailto:sangsawang_furniture@gmail.com">
                  sangsawang_furniture@gmail.com
                </a>
              </li>
              <li>
                <i className="bi bi-telephone"></i>
                <a href="tel:0818200706">081-820-0706</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
