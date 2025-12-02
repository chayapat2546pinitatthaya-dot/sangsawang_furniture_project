import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import axios from 'axios';
import { upsertCartItem, notifyCartUpdate } from '../utils/cartApi';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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
    fetchProducts();
  }, []);

  useEffect(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const name = product.product_name?.toLowerCase() || '';
      const description = product.product_description?.toLowerCase() || '';
      const tags = Array.isArray(product.tags) ? product.tags : [];
      const category = product.category_name?.toLowerCase() || '';
      const highlights = Array.isArray(product.highlights) ? product.highlights : [];

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        category.includes(keyword) ||
        tags.some((tag) => tag.toLowerCase().includes(keyword)) ||
        highlights.some((item) => item.toLowerCase().includes(keyword))
      );
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
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
      setFilteredProducts(normalized);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resolvePricing = (product) => {
    const toNumber = (value) => (value != null ? parseFloat(value) : null);
    const hasPromo = (base, promo) => {
      const baseNum = toNumber(base);
      const promoNum = toNumber(promo);
      return baseNum != null && promoNum != null && promoNum < baseNum;
    };

    if (hasPromo(product.price_cash, product.price_cash_promo)) {
      return {
        unitPrice: parseFloat(product.price_cash_promo),
        pricingType: 'cashPromo',
        pricingLabel: 'ซื้อสดโปรโมชัน'
      };
    }
    if (product.price_cash != null) {
      return {
        unitPrice: parseFloat(product.price_cash),
        pricingType: 'cash',
        pricingLabel: 'ซื้อสด'
      };
    }
    if (hasPromo(product.price_installment, product.price_installment_promo)) {
      return {
        unitPrice: parseFloat(product.price_installment_promo),
        pricingType: 'installmentPromo',
        pricingLabel: 'ซื้อผ่อนโปรโมชัน'
      };
    }
    if (product.price_installment != null) {
      return {
        unitPrice: parseFloat(product.price_installment),
        pricingType: 'installment',
        pricingLabel: 'ซื้อผ่อน'
      };
    }
    return { unitPrice: 0, pricingType: 'cash', pricingLabel: 'ซื้อสด' };
  };

  const addToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const { unitPrice, pricingType, pricingLabel } = resolvePricing(product);
    const result = await upsertCartItem({
      productId: product.product_id,
      pricingType,
      quantity: 1,
      unitPrice,
      pricingLabel,
      mode: 'increment'
    });

    if (result.unauthorized) {
      navigate('/login');
      return;
    }

    if (result.error) {
      console.error('Failed to add product to cart');
      return;
    }

    notifyCartUpdate(result.items);
  };

  return (
    <div className="products-page">
      <Container>
        <div className="products-toolbar">
          <h2>สินค้าทั้งหมด</h2>
          <div className="products-search">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5 text-muted">
            ไม่พบสินค้า
          </div>
        ) : (
          <Row className="products-grid">
            {filteredProducts.map((product) => {
              const { unitPrice } = resolvePricing(product);
              const baseCash = product.price_cash;
              const promoCash = product.price_cash_promo;
              // คำนวณผ่อนเริ่มต้นจากราคาเต็ม/12 เดือน
              const finalCashPrice = promoCash ?? baseCash;
              const installmentStartingPrice = finalCashPrice
                ? Math.floor(parseFloat(finalCashPrice) / 12 / 10) * 10
                : null;
              const hasCashPromo =
                baseCash != null &&
                promoCash != null &&
                parseFloat(promoCash) < parseFloat(baseCash);
              const hasInstallmentPromo =
                product.price_installment != null &&
                product.price_installment_promo != null &&
                parseFloat(product.price_installment_promo) <
                  parseFloat(product.price_installment);
              const isPromo = hasCashPromo || hasInstallmentPromo;

              return (
              <Col key={product.product_id}>
                <Card className={`product-card${isPromo ? ' product-card--promo' : ''}`}>
                  {isPromo && <span className="promo-badge">โปรโมชัน</span>}
                  <Card.Img variant="top" src={getImageUrl(product.product_image)} />
                  <Card.Body>
                    <h5>{product.product_name}</h5>
                    <p>{product.product_description?.substring(0, 100)}...</p>
                    <div className="price">
                      <strong>฿{unitPrice.toLocaleString()}</strong>
                    </div>
                    {installmentStartingPrice && (
                      <div className="installment-hint">
                        ผ่อนเริ่มต้น {installmentStartingPrice.toLocaleString()} บาทต่อเดือน
                      </div>
                    )}
                    <div className="d-flex gap-2 mt-3">
                      <Button as={Link} to={`/products/${product.product_id}`} variant="light">
                        ดูรายละเอียด
                      </Button>
                      <Button className="btn-primary-custom" onClick={() => addToCart(product)}>
                        เพิ่มในตะกร้า
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
}

