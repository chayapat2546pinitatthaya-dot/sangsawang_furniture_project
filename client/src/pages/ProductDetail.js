import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import { upsertCartItem, notifyCartUpdate } from '../utils/cartApi';
import './ProductDetail.css';

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

const ALLOWED_TAGS = CATEGORY_ITEMS;

const INSTALLMENT_MIN_PERIODS = 2;
const INSTALLMENT_MAX_PERIODS = 12;
const DEFAULT_INSTALLMENT_PERIODS = 12;

const clampInstallmentPeriods = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return INSTALLMENT_MIN_PERIODS;
  }
  return Math.min(Math.max(numeric, INSTALLMENT_MIN_PERIODS), INSTALLMENT_MAX_PERIODS);
};

const getInstallmentRateByMonths = (months = DEFAULT_INSTALLMENT_PERIODS) => {
  const normalized = clampInstallmentPeriods(months);
  if (normalized === INSTALLMENT_MIN_PERIODS) {
    return 0.1;
  }
  const rate = 0.1 + (normalized - INSTALLMENT_MIN_PERIODS) * 0.01;
  return Math.min(rate, 0.21);
};

const calculateInstallmentTotalFromCash = (cashPrice, months = DEFAULT_INSTALLMENT_PERIODS) => {
  const price = Number(cashPrice);
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }
  const rate = getInstallmentRateByMonths(months);
  return price * (1 + rate);
};

const toNumber = (value) => (value != null ? parseFloat(value) : null);
const resolveEffectiveCashPrice = (productData) => {
  if (!productData) {
    return null;
  }
  const cash = toNumber(productData.price_cash);
  const cashPromo = toNumber(productData.price_cash_promo);
  if (cashPromo != null && (cash == null || cashPromo < cash)) {
    return cashPromo;
  }
  return cash ?? cashPromo ?? null;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
  const [isAdding, setIsAdding] = useState(false);
  const addStateTimeout = useRef(null);
  const wiggleTimeout = useRef(null);
  const [isButtonWiggling, setIsButtonWiggling] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedInstallmentPreview, setSelectedInstallmentPreview] = useState(
    DEFAULT_INSTALLMENT_PERIODS
  );

  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === '') {
      return 'https://via.placeholder.com/800x600?text=ไม่มีรูปภาพ';
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
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    return () => {
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginOverlay(false);
    }
  }, [isAuthenticated]);


  const galleryImages = useMemo(() => {
    if (!product) {
      return [];
    }
    const images = Array.isArray(product.product_images)
      ? product.product_images
          .map((img) => (img == null ? '' : String(img).trim()))
          .filter(Boolean)
      : [];
    if (images.length > 0) {
      return images.slice(0, 4);
    }
    return product.product_image ? [product.product_image] : [];
  }, [product]);

  useEffect(() => {
    if (!galleryImages || galleryImages.length === 0) {
      setActiveImageIndex(0);
      return;
    }
    if (activeImageIndex >= galleryImages.length) {
      setActiveImageIndex(0);
    }
  }, [galleryImages, activeImageIndex]);

  const activeImageSource = galleryImages[activeImageIndex] || galleryImages[0] || '';

  const normalizeProductImages = (productData) => {
    if (!productData) {
      return [];
    }
    const source = Array.isArray(productData.product_images)
      ? productData.product_images
      : productData.product_image
      ? [productData.product_image]
      : [];
    return source
      .map((item) => (item == null ? '' : String(item).trim()))
      .filter(Boolean)
      .slice(0, 4);
  };

  const prepareProductData = (raw) => {
    if (!raw) {
      return null;
    }
    const images = normalizeProductImages(raw);
    return {
      ...raw,
      product_images: images,
      product_image: images[0] || raw.product_image || ''
    };
  };

  const applyFallbackProduct = () => {
    // ไม่มี fallback data แล้ว - ใช้ข้อมูลจาก database เท่านั้น
    setProduct(null);
    setIsLoading(false);
  };

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/products/${id}`);
      if (response.data) {
        console.log('Product data received:', {
          product_id: response.data.product_id,
          product_name: response.data.product_name,
          product_image: response.data.product_image,
          product_images: response.data.product_images
        });
        const base = {
          ...response.data,
          tags: (Array.isArray(response.data.tags) ? response.data.tags : [])
            .filter((tag) => ALLOWED_TAGS.includes(tag))
            .filter((tag, index, self) => self.indexOf(tag) === index),
          highlights: Array.isArray(response.data.highlights)
            ? response.data.highlights
            : []
        };
        const normalizedProduct = prepareProductData(base);
        if (normalizedProduct) {
          console.log('Normalized product:', {
            product_image: normalizedProduct.product_image,
            product_images: normalizedProduct.product_images
          });
          setProduct(normalizedProduct);
          setActiveImageIndex(0);
          initializePricing(normalizedProduct);
        } else {
          console.warn('Failed to normalize product');
          setProduct(null);
        }
      } else {
        console.warn('No product data received');
        setProduct(null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      if (error.response && error.response.status === 404) {
        setProduct(null);
      } else {
        setProduct(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toNumber = (value) => (value != null ? parseFloat(value) : null);

  const hasRealPromo = (base, promo) => {
    const baseNum = toNumber(base);
    const promoNum = toNumber(promo);
    return baseNum != null && promoNum != null && promoNum < baseNum;
  };

  const initializePricing = (productData) => {
    // ไม่ต้องตั้งค่า selectedPricing แล้ว เพราะแค่แสดงราคา
  };

  const getPricingOptions = (productData) => {
    if (!productData) {
      return [];
    }
 
    const options = [];
 
    const hasCashPromo = hasRealPromo(productData.price_cash, productData.price_cash_promo);
    const hasInstallmentPromo = hasRealPromo(
      productData.price_installment,
      productData.price_installment_promo
    );

    if (hasCashPromo) {
      options.push({
        key: 'cashPromo',
        label: 'ราคาเต็ม',
        note: 'โปรโมชัน',
        amount: productData.price_cash_promo,
        originalAmount: productData.price_cash,
        tone: 'promo'
      });
    } else if (productData.price_cash != null) {
      options.push({
        key: 'cash',
        label: 'ราคาเต็ม',
        note: null,
        amount: productData.price_cash,
        tone: null
      });
    }
 
    if (productData.price_installment != null) {
      if (hasInstallmentPromo) {
        options.push({
          key: 'installmentPromo',
        label: 'ราคาผ่อน',
          note: 'โปรโมชัน',
          amount: productData.price_installment_promo,
          originalAmount: productData.price_installment,
          tone: 'promo'
        });
      } else {
        options.push({
          key: 'installment',
        label: 'ราคาผ่อน',
          note: null,
          amount: productData.price_installment,
          tone: null
        });
      }
    }
 
    return options;
  };

  const formatPrice = (value) => {
    if (value == null) return '-';
    return `฿${parseFloat(value).toLocaleString()}`;
  };

  const formatRoundedInstallment = (value) => {
    if (value == null) {
      return '-';
    }
    return `฿${Number(value).toLocaleString('th-TH', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    })}`;
  };

  const addProductToCart = async ({ withFeedback = true } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (withFeedback) {
        setAlert({ show: false, message: '', variant: '' });
      }
      setShowLoginOverlay(true);
      if (wiggleTimeout.current) {
        clearTimeout(wiggleTimeout.current);
      }
      setIsButtonWiggling(true);
      wiggleTimeout.current = setTimeout(() => {
        setIsButtonWiggling(false);
      }, 800);
      return false;
    }

    const productId = product.product_id;
    const pricingOptions = getPricingOptions(product);
    const activePricing = pricingOptions[0]; // ใช้ราคาแรก (ซื้อสด) เป็นค่าเริ่มต้น

    if (!activePricing) {
      if (withFeedback) {
        setAlert({
          show: true,
          message: 'ไม่พบข้อมูลราคา กรุณาติดต่อผู้ดูแลระบบ',
          variant: 'danger'
        });
      }
      return false;
    }

    const { key, amount, label } = activePricing;
    const result = await upsertCartItem({
      productId,
      pricingType: key,
      quantity: 1,
      unitPrice: amount,
      pricingLabel: label,
      mode: 'increment'
    });

    if (result.unauthorized) {
      if (withFeedback) {
        setAlert({ show: false, message: '', variant: '' });
      }
      setShowLoginOverlay(true);
      return false;
    }

    if (result.error) {
      if (withFeedback) {
        setAlert({
          show: true,
          message: 'ไม่สามารถเพิ่มสินค้าในตะกร้าได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'danger'
        });
      }
      return false;
    }

    notifyCartUpdate(result.items);
    if (withFeedback) {
      setAlert({
        show: true,
        message: 'เพิ่มสินค้าในลิสต์เรียบร้อยแล้ว',
        variant: 'success'
      });
      if (addStateTimeout.current) {
        clearTimeout(addStateTimeout.current);
      }
      setIsAdding(true);
      addStateTimeout.current = setTimeout(() => {
        setIsAdding(false);
      }, 1200);
    }
    return true;
  };

  const handleAddToCart = async () => {
    await addProductToCart({ withFeedback: true });
  };

  const handleBuyNow = async () => {
    const success = await addProductToCart({ withFeedback: false });
    if (success) {
      navigate('/cart');
    }
  };

  const handleCloseLoginOverlay = () => {
    setShowLoginOverlay(false);
  };

  useEffect(() => {
    return () => {
      if (addStateTimeout.current) {
        clearTimeout(addStateTimeout.current);
      }
      if (wiggleTimeout.current) {
        clearTimeout(wiggleTimeout.current);
      }
    };
  }, []);

  // Calculate installment pricing - must be before any early returns
  const effectiveCashPrice = useMemo(
    () => (product ? resolveEffectiveCashPrice(product) : null),
    [product]
  );
  const installmentPreviewTotal = useMemo(() => {
    if (!effectiveCashPrice) {
      return null;
    }
    return calculateInstallmentTotalFromCash(effectiveCashPrice, selectedInstallmentPreview);
  }, [effectiveCashPrice, selectedInstallmentPreview]);
  const installmentPreviewPerMonth = useMemo(() => {
    if (!installmentPreviewTotal) {
      return null;
    }
    return installmentPreviewTotal / selectedInstallmentPreview;
  }, [installmentPreviewTotal, selectedInstallmentPreview]);
  const roundedInstallmentPerMonth = useMemo(() => {
    if (!installmentPreviewPerMonth) {
      return null;
    }
    const floored = Math.floor(installmentPreviewPerMonth / 10) * 10;
    return floored;
  }, [installmentPreviewPerMonth]);

  if (isLoading) {
    return (
      <div className="product-detail-page loading">
        <Container>
          <div className="loading-state">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const descriptionLines = product
    ? (product.product_description || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const detailItems =
    product && Array.isArray(product.highlights) && product.highlights.length > 0
      ? product.highlights
      : descriptionLines;
  const displayTags =
    product && Array.isArray(product.tags)
      ? Array.from(new Set(product.tags.filter((tag) => ALLOWED_TAGS.includes(tag))))
      : [];
  const pricingOptions = product ? getPricingOptions(product) : [];

  return (
    <div className="product-detail-page">
      <Container>
        {alert.show && (
          <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
            {alert.message}
          </Alert>
        )}

        {showLoginOverlay && (
          <div className={`login-overlay${showLoginOverlay ? ' visible' : ''}`} role="dialog" aria-modal="true">
            <div className="overlay-backdrop" onClick={handleCloseLoginOverlay}></div>
            <div className="overlay-card">
              <button type="button" className="overlay-close" onClick={handleCloseLoginOverlay} aria-label="ปิด">
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="overlay-icon">
                <i className="bi bi-shield-lock"></i>
              </div>
              <h3>เข้าสู่ระบบเพื่อบันทึกลิสต์สินค้า</h3>
              <p>
                บัญชีสมาชิกช่วยให้คุณบันทึกรายการที่ชอบ บริหารคำสั่งซื้อได้สะดวก และติดตามโปรโมชั่นที่เหมาะกับคุณ
              </p>
              <div className="overlay-actions">
                <Button className="btn-primary-custom" size="lg" onClick={() => navigate('/login')}>
                  เข้าสู่ระบบ
                </Button>
                <Button variant="light" size="lg" onClick={() => navigate('/register')}>
                  สมัครสมาชิกใหม่
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="detail-wrapper">
          <div className="detail-gallery">
            <div className="gallery-main">
              <img 
                src={getImageUrl(activeImageSource)} 
                alt={product.product_name}
                onError={(e) => {
                  console.error('Image load error:', getImageUrl(activeImageSource));
                  e.target.src = 'https://via.placeholder.com/800x600?text=ไม่พบรูปภาพ';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', getImageUrl(activeImageSource));
                }}
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="gallery-thumbs">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`gallery-thumb${index === activeImageIndex ? ' active' : ''}`}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`ดูภาพสินค้า ${index + 1}`}
                  >
                    <img src={getImageUrl(image)} alt={`${product.product_name} - ภาพที่ ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
            <div className="gallery-note">ภาพสินค้าใช้เพื่อการโฆษณา สีอาจแตกต่างจากสินค้าจริงเล็กน้อย</div>
          </div>

          <div className="detail-content">
            <h1>{product.product_name}</h1>
            <p className="detail-description">
              {descriptionLines.length > 0 ? descriptionLines[0] : 'สินค้าเฟอร์นิเจอร์คุณภาพจากแสงสว่างเฟอร์นิเจอร์'}
            </p>

            <div className="detail-price-box">
                <span className="price-label">ราคาสินค้า</span>
                <div className="pricing-cards">
                  <div className="pricing-card">
                    <div className="pricing-card__header">
                      <span className="pricing-label">ราคาเต็ม</span>
                      {hasRealPromo(product?.price_cash, product?.price_cash_promo) && (
                        <span className="pricing-note">โปรโมชัน</span>
                      )}
                    </div>
                    <div className="pricing-card__value">
                      {formatPrice(
                        hasRealPromo(product?.price_cash, product?.price_cash_promo)
                          ? product?.price_cash_promo
                          : product?.price_cash
                      )}
                    </div>
                    {hasRealPromo(product?.price_cash, product?.price_cash_promo) && (
                      <div className="pricing-card__original">{formatPrice(product?.price_cash)}</div>
                    )}
                  </div>
                  <div className="pricing-card pricing-card--installment">
                    <div className="pricing-card__header">
                      <span className="pricing-label">ราคาผ่อน</span>
                      {hasRealPromo(product?.price_installment, product?.price_installment_promo) && (
                        <span className="pricing-note">โปรโมชัน</span>
                      )}
                    </div>
                    <div className="pricing-card__value">
                    {formatRoundedInstallment(roundedInstallmentPerMonth)}
                      <span className="pricing-card__per-month">/ เดือน</span>
                    </div>
                    <div className="installment-selector">
                      <label htmlFor="previewInstallment">จำนวนงวด</label>
                      <Form.Select
                        id="previewInstallment"
                        value={selectedInstallmentPreview}
                        onChange={(event) =>
                          setSelectedInstallmentPreview(clampInstallmentPeriods(event.target.value))
                        }
                      >
                        {Array.from(
                          { length: INSTALLMENT_MAX_PERIODS - INSTALLMENT_MIN_PERIODS + 1 },
                          (_, idx) => INSTALLMENT_MIN_PERIODS + idx
                        ).map((period) => (
                          <option key={period} value={period}>
                            {period} งวด
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </div>
                </div>
              </div>

              {displayTags.length > 0 && (
                <div className="detail-tags">
                  {displayTags.map((tag) => (
                    <span key={tag} className="tag-badge">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

            {detailItems && detailItems.length > 0 && (
              <div className="detail-list">
                <h3>รายละเอียดสินค้า</h3>
                <ul>
                  {detailItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="detail-actions">
              <Button
                variant="light"
                className="btn-outline buy-now-btn"
                size="lg"
                onClick={handleBuyNow}
              >
                <i className="bi bi-bag-check me-2"></i>
                ซื้อสินค้า
              </Button>
              <Button
                className={`btn-primary-custom add-to-cart-btn${isAdding ? ' added' : ''}${!isAuthenticated ? ' needs-login' : ''}${isButtonWiggling ? ' wiggle' : ''}`}
                size="lg"
                onClick={handleAddToCart}
                disabled={isAdding}
              >
                <i className={`bi ${isAdding ? 'bi-check-circle' : 'bi-cart-plus'} me-2`}></i>
                {isAuthenticated ? (isAdding ? 'เพิ่มแล้ว!' : 'เพิ่มลงตะกร้า') : 'เข้าสู่ระบบก่อนเพิ่ม'}
              </Button>
            </div>

            <div className="detail-meta">
              <Card>
                <Card.Body>
                  <div>
                    <span>บริการจัดส่ง</span>
                    <strong>ฟรีในเขตกรุงเทพฯ และปริมณฑล</strong>
                  </div>
                  <div>
                    <span>การรับประกัน</span>
                    <strong>โครงสร้าง 3 ปี / กลไก 1 ปี</strong>
                  </div>
                  <div>
                    <span>ระยะเวลาการผ่อน</span>
                    <strong>ผ่อนได้ตั้งแต่ 2 เดือนจนถึง 12 เดือน</strong>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

