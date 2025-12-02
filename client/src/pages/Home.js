import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const CATEGORY_ITEMS = [
  'เตียงนอน',
  'โซฟา',
  'ชั้นวางทีวี',
  'โต๊ะเครื่องแป้ง',
  'ตู้เสื้อผ้า',
  'ฟูกนอน/ที่นอน',
  'ตู้โชว์',
  'หิ้งพระ',
  'ตู้กับข้าว',
  'ตู้เสื้อผ้า + โต๊ะเครื่องแป้ง (เซ็ต)'
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [priceSort, setPriceSort] = useState(null); // null, 'desc' (มากไปน้อย), 'asc' (น้อยไปมาก)
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const toNumber = (value, fallback = Infinity) => {
    if (value == null || value === '') return fallback;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === '') {
      return 'https://via.placeholder.com/400?text=ไม่มีรูปภาพ';
    }
    const trimmed = String(imagePath).trim();
    
    // ถ้าเป็น URL แบบเต็ม (http:// หรือ https://) ให้ใช้ตามนั้น
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // ดึงรูปภาพจากโฟลเดอร์ images โดยตรงผ่าน static file serving (ไม่ผ่าน API)
    // ใช้ relative path เพื่อให้ React proxy ทำงาน
    // สำหรับ path ที่มีอักขระภาษาไทย ต้อง encode แต่ละส่วนของ path
    
    // ถ้าเป็น path ที่เริ่มต้นด้วย / ให้ encode แต่ละส่วนของ path
    if (trimmed.startsWith('/')) {
      try {
        // แยก path เป็นส่วนๆ และ encode แต่ละส่วน (ยกเว้น / หน้า)
        const parts = trimmed.split('/').filter(p => p);
        const encodedParts = parts.map(part => {
          // Encode แต่ละส่วนของ path เพื่อให้ browser ส่งไปยัง server ถูกต้อง
          try {
            return encodeURIComponent(part);
          } catch (e) {
            return part;
          }
        });
        return '/' + encodedParts.join('/');
      } catch (e) {
        return trimmed;
      }
    }
    
    // ถ้าเป็น path ปกติ ให้แปลงเป็น absolute path
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      // แปลง backslash เป็น forward slash
      const normalized = trimmed.replace(/\\/g, '/');
      // ถ้าไม่มี / หน้า ให้เพิ่ม
      const pathToEncode = normalized.startsWith('/') ? normalized : `/${normalized}`;
      try {
        const parts = pathToEncode.split('/').filter(p => p);
        const encodedParts = parts.map(part => {
          try {
            return encodeURIComponent(part);
          } catch (e) {
            return part;
          }
        });
        return '/' + encodedParts.join('/');
      } catch (e) {
        return pathToEncode;
      }
    }
    
    // ถ้าเป็นแค่ชื่อไฟล์ ให้ encode และใส่ใน /images/
    try {
      return `/images/${encodeURIComponent(trimmed)}`;
    } catch (e) {
      return `/images/${trimmed}`;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        if (response.data && response.data.length > 0) {
          const normalized = response.data.map((item) => {
            const images = Array.isArray(item.product_images)
              ? item.product_images
                  .map((img) => (img == null ? '' : String(img).trim()))
                  .filter(Boolean)
              : item.product_image
              ? [String(item.product_image).trim()]
              : [];
            const heroImage = images[0] || (item.product_image ? String(item.product_image).trim() : '');
            return {
              ...item,
              product_image: heroImage,
              product_images: images,
              tags: Array.isArray(item.tags) ? item.tags : [],
              highlights: Array.isArray(item.highlights) ? item.highlights : []
            };
          });

          setProducts(normalized);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((product) =>
        product.tags?.some((tag) => tag === selectedCategory)
      );
    }

    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      result = result.filter((product) => {
        const name = product.product_name?.toLowerCase() || '';
        const description = product.product_description?.toLowerCase() || '';
        return name.includes(keyword) || description.includes(keyword);
      });
    }

    // เรียงตามราคา (มีลำดับความสำคัญสูงสุด)
    if (priceSort) {
      const sorted = [...result].sort((a, b) => {
        const priceA = toNumber(a.price_installment_promo ?? a.price_installment ?? a.price_cash, 0);
        const priceB = toNumber(b.price_installment_promo ?? b.price_installment ?? b.price_cash, 0);
        return priceSort === 'desc' ? priceB - priceA : priceA - priceB;
      });
      return sorted;
    }

    if (activeFilter === 'promotion') {
      const promotionProducts = result.filter((product) => {
        const baseCash = toNumber(product.price_cash);
        const promoCash = toNumber(product.price_cash_promo);
        const baseInstallment = toNumber(product.price_installment);
        const promoInstallment = toNumber(product.price_installment_promo);

        const hasCashPromo =
          promoCash !== Infinity && baseCash !== Infinity && promoCash < baseCash;
        const hasInstallmentPromo =
          promoInstallment !== Infinity &&
          baseInstallment !== Infinity &&
          promoInstallment < baseInstallment;

        return hasCashPromo || hasInstallmentPromo;
      });

      return promotionProducts.sort((a, b) => {
        const priceA = toNumber(a.price_cash_promo ?? a.price_cash);
        const priceB = toNumber(b.price_cash_promo ?? b.price_cash);
        return priceA - priceB;
      });
    }

    if (activeFilter === 'popular') {
      return [...result].sort((a, b) => {
        const installmentA = toNumber(a.price_installment_promo ?? a.price_installment ?? a.price_cash, 0);
        const installmentB = toNumber(b.price_installment_promo ?? b.price_installment ?? b.price_cash, 0);
        return installmentA - installmentB;
      });
    }

    return result;
  }, [products, searchTerm, activeFilter, selectedCategory, priceSort]);

  const handleFilterToggle = (filterKey) => {
    setActiveFilter((prev) => (prev === filterKey ? 'popular' : filterKey));
    setPriceSort(null); // รีเซ็ตการเรียงตามราคาเมื่อเปลี่ยน filter
  };

  const handlePriceSort = () => {
    if (priceSort === null) {
      setPriceSort('desc'); // ครั้งแรก: จากมากไปน้อย
    } else if (priceSort === 'desc') {
      setPriceSort('asc'); // ครั้งที่สอง: จากน้อยไปมาก
    } else {
      setPriceSort(null); // ครั้งที่สาม: รีเซ็ต
    }
    setActiveFilter(null); // รีเซ็ต filter เมื่อเรียงตามราคา
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  const goToCatalog = (options = {}) => {
    if (Object.prototype.hasOwnProperty.call(options, 'category')) {
      setSelectedCategory(options.category);
    }
    if (options.filter) {
      setActiveFilter(options.filter);
    }
    if (options.resetSearch) {
      setSearchTerm('');
    }

    window.requestAnimationFrame(() => {
      const target = document.getElementById('catalog');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  return (
    <div className="home-page">
      {!currentUser && (
        <section className="home-hero">
          <div className="home-hero-content">
            <div>
              <p className="home-hero-tagline">เฟอร์นิเจอร์คุณภาพดี ราคาสบายใจ</p>
              <h1>แสงสว่าง เฟอร์นิเจอร์</h1>
              <p className="home-hero-subtitle">
                คัดสรรดีไซน์เหนือกาลเวลา สร้างพื้นที่แห่งความสุขให้บ้านคุณ
              </p>
              <button
                type="button"
                className="home-hero-cta"
                onClick={() => goToCatalog({ category: null, resetSearch: true })}
              >
                <i className="bi bi-cart3"></i>
                ดูสินค้าทั้งหมด
              </button>
            </div>
            <div className="home-hero-image" role="presentation" />
          </div>

          {/* ส่วนโปรโมทการผ่อนชำระและพื้นที่จัดส่งฟรี */}
          <div className="home-hero-ads">
            <div className="home-hero-ads-container">
              {/* ส่วนโปรโมทการผ่อนชำระ */}
              <div className="home-hero-promo-card">
                <h2 className="home-promo-title">ไม่ใช้บัตรเครดิต! บัตรประชาชนใบเดียวก็ผ่อนได้</h2>
                <p className="home-promo-description">
                  <strong>ขายออนไลน์เท่านั้น</strong> - ผ่อนง่าย อนุมัติไว เพียงแค่บัตรประชาชนใบเดียว
                  <br />
                  ไม่ต้องมีบัตรเครดิต ไม่ต้องมีหลักทรัพย์ค้ำประกัน
                  <br />
                  เลือกแบ่งจ่ายได้สูงสุด 12 เดือน
                </p>
                <p className="home-promo-note">
                  <strong>หมายเหตุ:</strong> เราไม่รับบัตรเครดิตในการชำระเงิน
                </p>
                <div className="home-promo-features">
                  <div className="home-promo-feature">
                    <span className="home-promo-check">✅</span>
                    <span>อนุมัติไว ไม่ต้องรอนาน</span>
                  </div>
                  <div className="home-promo-feature">
                    <span className="home-promo-check">✅</span>
                    <span>เอกสารน้อย ง่ายต่อการสมัคร</span>
                  </div>
                  <div className="home-promo-feature">
                    <span className="home-promo-check">✅</span>
                    <span>ผ่อนได้สูงสุด <strong className="home-promo-highlight">12 เดือน</strong></span>
                  </div>
                </div>
              </div>

              {/* ส่วนพื้นที่จัดส่งฟรี */}
              <div className="home-hero-delivery-card">
                <h2 className="home-delivery-title">
                  พื้นที่จัดส่งฟรี
                </h2>
                <p className="home-delivery-description">
                  เราจัดส่งฟรีในพื้นที่ดังต่อไปนี้:
                </p>
                <ul className="home-delivery-list">
                  <li className="home-delivery-list-item">
                    <strong>กรุงเทพมหานคร</strong>
                    <span>ทุกเขตในกรุงเทพมหานคร</span>
                  </li>
                  <li className="home-delivery-list-item">
                    <strong>ปริมณฑล</strong>
                    <span>นนทบุรี, ปทุมธานี, สมุทรปราการ, สมุทรสาคร, นครปฐม, ฉะเชิงเทรา</span>
                  </li>
                  <li className="home-delivery-list-item">
                    <strong>จังหวัดใกล้เคียง</strong>
                    <span>อยุธยา, สระบุรี, ลพบุรี, ชลบุรี, ระยอง</span>
                  </li>
                </ul>
                <p className="home-delivery-note">
                  * สำหรับพื้นที่อื่นๆ กรุณาติดต่อสอบถามเพิ่มเติม
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="home-content" id="catalog">
        <div className="home-layout">
          <aside className="category-panel">
            <h2>หมวดหมู่</h2>
            <ul>
              {CATEGORY_ITEMS.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className={selectedCategory === item ? 'active' : ''}
                    onClick={() => handleCategoryToggle(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="product-section">
            <div className="product-toolbar">
              <div className="product-search">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="product-filters">
                <button
                  type="button"
                  className={`toolbar-btn${priceSort ? ' active' : ''}`}
                  onClick={handlePriceSort}
                >
                  ราคา
                  {priceSort === 'desc' && <i className="bi bi-caret-down-fill ms-1"></i>}
                  {priceSort === 'asc' && <i className="bi bi-caret-up-fill ms-1"></i>}
                </button>
                <button
                  type="button"
                  className={`toolbar-btn${activeFilter === 'promotion' ? ' active' : ''}`}
                  onClick={() => handleFilterToggle('promotion')}
                >
                  โปรโมชั่น
                </button>
                <button
                  type="button"
                  className={`toolbar-btn${activeFilter === 'popular' ? ' active' : ''}`}
                  onClick={() => handleFilterToggle('popular')}
                >
                  ยอดนิยม
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="home-loading">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const finalCashPrice = product.price_cash_promo ?? product.price_cash;
                  const baseCashPrice = product.price_cash;
                  // คำนวณผ่อนเริ่มต้นจากราคาเต็ม/12 เดือน
                  const installmentStartingPrice = finalCashPrice
                    ? Math.floor(parseFloat(finalCashPrice) / 12 / 10) * 10
                    : null;
                  const hasCashPromo =
                    baseCashPrice != null &&
                    product.price_cash_promo != null &&
                    parseFloat(product.price_cash_promo) < parseFloat(baseCashPrice);
                  const hasInstallmentPromo =
                    product.price_installment != null &&
                    product.price_installment_promo != null &&
                    parseFloat(product.price_installment_promo) <
                      parseFloat(product.price_installment);
                  const isPromo = hasCashPromo || hasInstallmentPromo;

                  return (
                  <Link
                    to={`/products/${product.product_id}`}
                    key={product.product_id}
                    className={`product-card${isPromo ? ' product-card--promo' : ''}`}
                  >
                    <div className="product-image-wrapper">
                      <img src={getImageUrl(product.product_image)} alt={product.product_name} />
                      {isPromo && <span className="promo-badge">โปรโมชัน</span>}
                    </div>
                    <div className="product-card-body">
                      <h3>{product.product_name}</h3>
                      <div className="product-price">
                        {finalCashPrice && (
                          <span className="price-current">
                            ฿{parseFloat(finalCashPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {installmentStartingPrice && (
                        <p className="price-installment">
                          ผ่อนเริ่มต้น {installmentStartingPrice.toLocaleString()} บาทต่อเดือน
                        </p>
                      )}
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

