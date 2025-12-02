import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import NotificationBell from '../../components/NotificationBell';
import './AdminProducts.css';

const formatPrice = (value) => {
  if (value == null || value === '') {
    return '-';
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return '-';
  }
  return `฿${numericValue.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

const parseNumeric = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const hasPromotionPrices = (product = {}) => {
  const cash = parseNumeric(product.price_cash);
  const cashPromo = parseNumeric(product.price_cash_promo);
  if (cashPromo != null && (cash == null || cashPromo < cash)) {
    return true;
  }
  const installment = parseNumeric(product.price_installment);
  const installmentPromo = parseNumeric(product.price_installment_promo);
  if (installmentPromo != null && (installment == null || installmentPromo < installment)) {
    return true;
  }
  return false;
};

const DISPLAY_CATEGORY_OPTIONS = [
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

const PROMOTION_FILTER_OPTIONS = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'มีโปรฯ', value: 'promo' },
  { label: 'ไม่มีโปรฯ', value: 'regular' }
];

const MAX_PRODUCT_IMAGES = 4;

const normalizeImageArray = (value) => {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  const cleaned = source
    .map((item) => (item == null ? '' : String(item).trim()))
    .filter(Boolean);
  const padded = cleaned.slice(0, MAX_PRODUCT_IMAGES);
  while (padded.length < MAX_PRODUCT_IMAGES) {
    padded.push('');
  }
  return padded;
};

const compactImages = (images = []) =>
  images
    .map((item) => (item == null ? '' : String(item).trim()))
    .filter(Boolean)
    .slice(0, MAX_PRODUCT_IMAGES);

const INSTALLMENT_MIN_PERIODS = 2;
const INSTALLMENT_MAX_PERIODS = 12;
const DEFAULT_INSTALLMENT_PERIODS = 12;

const getInstallmentRateByMonths = (months = DEFAULT_INSTALLMENT_PERIODS) => {
  const normalized = Number(months);
  if (!Number.isFinite(normalized) || normalized < INSTALLMENT_MIN_PERIODS) {
    return 0;
  }
  if (normalized >= INSTALLMENT_MAX_PERIODS) {
    return 0.21;
  }
  return 0.1 + (normalized - INSTALLMENT_MIN_PERIODS) * 0.01;
};

const calculateInstallmentPrice = (basePrice, months = DEFAULT_INSTALLMENT_PERIODS) => {
  const price = Number(basePrice);
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }
  const rate = getInstallmentRateByMonths(months);
  return Math.round(price * (1 + rate));
};

const DEFAULT_INSTALLMENT_RATE_PERCENT = Math.round(
  getInstallmentRateByMonths(DEFAULT_INSTALLMENT_PERIODS) * 100
);

const resolveImagePreview = (value) => {
  if (!value) {
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }
  // ถ้าเป็น data URI, blob URI, หรือ full URL ให้ใช้ตามนั้น
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // ดึงรูปภาพจากโฟลเดอร์ images โดยตรงผ่าน static file serving (ไม่ผ่าน API)
  // ใช้ relative path เพื่อให้ React proxy ทำงาน
  // สำหรับ path ที่มีอักขระภาษาไทย ต้อง encode แต่ละส่วนของ path
  
  // ถ้า path เริ่มต้นด้วย / แล้ว ให้ encode แต่ละส่วนของ path
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

export default function AdminProducts({
  admin,
  logout,
  isSidebarCollapsed,
  toggleSidebar,
  adminNotifications,
  markAdminOrdersSeen,
  markAdminCustomersSeen
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryMap, setCategoryMap] = useState(new Map());
  const [activeCategory, setActiveCategory] = useState('all');
  const [promotionFilter, setPromotionFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceCash: '',
    priceCashPromo: '',
    highlights: '',
    displayCategory: DISPLAY_CATEGORY_OPTIONS[0] || '',
    images: Array(MAX_PRODUCT_IMAGES).fill('')
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ show: false, text: '', variant: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [previousProductsCount, setPreviousProductsCount] = useState(0);
  const [alerts, setAlerts] = useState([]);

  const playNotificationSound = () => {
    try {
      // สร้างเสียงเตือนแบบ beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // ความถี่เสียง
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('ไม่สามารถเล่นเสียงเตือนได้:', error);
    }
  };
  const autoInstallmentPrice = useMemo(
    () => calculateInstallmentPrice(formData.priceCash),
    [formData.priceCash]
  );
  const autoInstallmentPromoPrice = useMemo(
    () => calculateInstallmentPrice(formData.priceCashPromo),
    [formData.priceCashPromo]
  );

  const getCategoryLabel = (product) => {
    if (!product) {
      return '-';
    }

    if (Array.isArray(product.tags) && product.tags.length > 0) {
      const categoryTag = product.tags
        .map((tag) => (tag == null ? '' : String(tag).trim()))
        .find((tag) => DISPLAY_CATEGORY_OPTIONS.includes(tag));
      if (categoryTag) {
        return categoryTag;
      }
    }

    if (product.category_name && String(product.category_name).trim()) {
      const label = String(product.category_name).trim();
      if (DISPLAY_CATEGORY_OPTIONS.includes(label)) {
        return label;
      }
    }

    if (product.category_id != null) {
      const categoryIdString = String(product.category_id);
      for (const [label, id] of categoryMap.entries()) {
        if (String(id) === categoryIdString) {
          return label;
        }
      }
    }

    return '-';
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ไม่แสดง popup alerts แล้ว ใช้ notification bell แทน

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add') {
      handleAdd();
      params.delete('action');
      const nextSearch = params.toString();
      navigate(
        { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      const data = Array.isArray(response.data) ? response.data : [];
      const map = new Map(
        data.map((item) => [(item.category_name || '').trim(), item.category_id])
      );
      setCategoryMap(map);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoryMap(new Map());
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const newProducts = response.data || [];
      
      // ตรวจสอบว่ามีสินค้าใหม่หรือไม่
      if (previousProductsCount > 0 && !isLoading && newProducts.length > previousProductsCount) {
        const newCount = newProducts.length - previousProductsCount;
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'info',
          message: `มีสินค้าใหม่ ${newCount} รายการ`,
          timestamp: new Date()
        }]);
      }
      
      const normalized = newProducts.map((item) => {
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
          category_id: item.category_id != null ? String(item.category_id) : '',
          category_name: (item.category_name || '').trim(),
          tags: Array.isArray(item.tags)
            ? item.tags
                .map((tag) => (tag == null ? '' : String(tag).trim()))
                .filter(Boolean)
            : [],
          product_image: heroImage,
          product_images: images,
          highlights: Array.isArray(item.highlights) ? item.highlights : []
        };
      });
      
      // ตรวจสอบว่ามีสินค้าใหม่หรือไม่
      if (previousProductsCount > 0 && !isLoading && normalized.length > previousProductsCount) {
        const newCount = normalized.length - previousProductsCount;
        playNotificationSound();
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'info',
          message: `มีสินค้าใหม่ ${newCount} รายการ`,
          timestamp: new Date()
        }]);
      }
      
      setProducts(normalized);
      setPreviousProductsCount(normalized.length);
      // setActiveCategory((prev) => { // This line is removed as per the edit hint
      //   if (prev === 'all') {
      //     return prev;
      //   }
      //   const hasCategory = normalized.some((item) => {
      //     const categoryId = item.category_id != null ? String(item.category_id) : '';
      //     return categoryId === prev;
      //   });
      //   return hasCategory ? prev : 'all';
      // });
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('FileReader loaded, result length:', reader.result?.length);
        setImagePreview(reader.result);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
      // อัปเดต formData.images[0] เป็นชื่อไฟล์ (แต่ preview จะใช้ data URL จาก FileReader)
      setFormData((prev) => {
        const nextImages = [...prev.images];
        nextImages[0] = file.name;
        return { ...prev, images: nextImages };
      });
    } else {
      console.log('No file selected');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleImageFieldChange = (index, value) => {
    setFormData((prev) => {
      const nextImages = [...prev.images];
      nextImages[index] = value;
      return { ...prev, images: nextImages };
    });
    if (index === 0 && !imageFile) {
      setImagePreview(resolveImagePreview(value));
    } else if (index === 0 && imageFile) {
      setImageFile(null);
      setImagePreview(resolveImagePreview(value));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    const imagesForState = normalizeImageArray(
      Array.isArray(product.product_images) && product.product_images.length > 0
        ? product.product_images
        : product.product_image
        ? [product.product_image]
        : []
    );
    const existingDisplayCategory = Array.isArray(product.tags)
      ? product.tags
          .map((tag) => (tag == null ? '' : String(tag).trim()))
          .find((tag) => DISPLAY_CATEGORY_OPTIONS.includes(tag))
      : '';
    const fallbackCategory = getCategoryLabel(product);
    const resolvedDisplayCategory = DISPLAY_CATEGORY_OPTIONS.includes(existingDisplayCategory)
      ? existingDisplayCategory
      : DISPLAY_CATEGORY_OPTIONS.includes(fallbackCategory)
      ? fallbackCategory
      : DISPLAY_CATEGORY_OPTIONS[0] || '';

    setFormData({
      name: product.product_name,
      description: product.product_description || '',
      priceCash: product.price_cash ?? '',
      priceCashPromo: product.price_cash_promo ?? '',
      highlights: (product.highlights || []).join('\n'),
      displayCategory: resolvedDisplayCategory,
      images: imagesForState
    });
    setImageFile(null);
    setImagePreview(resolveImagePreview(imagesForState[0]));
    setIsDrawerOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      priceCash: '',
      priceCashPromo: '',
      highlights: '',
      displayCategory: DISPLAY_CATEGORY_OPTIONS[0] || '',
      images: Array(MAX_PRODUCT_IMAGES).fill('')
    });
    setImageFile(null);
    setImagePreview(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageList = compactImages(formData.images);
      const displayCategoryTag = formData.displayCategory
        ? String(formData.displayCategory).trim()
        : '';
      const tagsToSend = displayCategoryTag ? [displayCategoryTag] : [];
      const categoryIdFromLabel = displayCategoryTag
        ? categoryMap.get(displayCategoryTag) ?? null
        : null;

      // ถ้ามีไฟล์ที่เลือก ให้อัปโหลดไฟล์ก่อน
      if (imageFile) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('image', imageFile);
          if (displayCategoryTag) {
            formDataUpload.append('category', displayCategoryTag);
          }

          const uploadResponse = await axios.post('/api/upload', formDataUpload, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // ใช้ path จาก server
          const uploadedImagePath = uploadResponse.data.path;
          if (uploadedImagePath) {
            imageList[0] = uploadedImagePath;
            // อัปเดต formData.images[0] ด้วย path ที่อัปโหลด
            setFormData((prev) => {
              const nextImages = [...prev.images];
              nextImages[0] = uploadedImagePath;
              return { ...prev, images: nextImages };
            });
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setMessage({ 
            show: true, 
            text: uploadError.response?.data?.error || 'อัปโหลดไฟล์ไม่สำเร็จ', 
            variant: 'danger' 
          });
          setIsLoading(false);
          return;
        }
      }

      const parsedPriceCash = formData.priceCash !== '' ? parseFloat(formData.priceCash) : null;
      const parsedPriceCashPromo =
        formData.priceCashPromo !== '' ? parseFloat(formData.priceCashPromo) : null;
      const computedInstallment = calculateInstallmentPrice(parsedPriceCash);
      const computedInstallmentPromo =
        parsedPriceCashPromo != null
          ? calculateInstallmentPrice(parsedPriceCashPromo)
          : null;

      const dataToSend = {
        name: formData.name,
        description: formData.description,
        categoryId: categoryIdFromLabel,
        tags: tagsToSend,
        highlights: formData.highlights
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        priceCash: parsedPriceCash,
        priceCashPromo: parsedPriceCashPromo,
        priceInstallment: computedInstallment,
        priceInstallmentPromo: computedInstallmentPromo,
        image: imageList[0] || '',
        images: imageList
      };
      
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct.product_id}`, dataToSend);
        setMessage({ show: true, text: 'แก้ไขสินค้าสำเร็จ', variant: 'success' });
      } else {
        await axios.post('/api/products', dataToSend);
        setMessage({ show: true, text: 'เพิ่มสินค้าสำเร็จ', variant: 'success' });
      }
      
      fetchProducts();
      setIsDrawerOpen(false);
      setImageFile(null);
      setImagePreview(null);
      setMessage({ show: true, text: editingProduct ? 'แก้ไขสินค้าสำเร็จ ✅' : 'เพิ่มสินค้าสำเร็จ ✅', variant: 'success' });
      setTimeout(() => setMessage({ show: false }), 3000);
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage({ show: true, text: error.response?.data?.error || 'เกิดข้อผิดพลาด', variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('ยืนยันการลบสินค้านี้?')) {
      return;
    }

    try {
      await axios.delete(`/api/products/${productId}`);
      setMessage({ show: true, text: 'ลบสินค้าสำเร็จ ✅', variant: 'success' });
      fetchProducts();
      setTimeout(() => setMessage({ show: false }), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({ show: true, text: 'เกิดข้อผิดพลาด', variant: 'danger' });
    }
  };

  const handleViewDetails = (product) => {
    if (!product || !product.product_id) {
      return;
    }
    // เปิดหน้ารายละเอียดสินค้าแบบเดียวกับที่ลูกค้าเห็น ในแท็บใหม่
    const url = `/products/${product.product_id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const columns = [
    {
      key: 'product_id',
      header: 'ID',
      className: 'text-center product-id-col',
      render: (product) => product.product_id
    },
    {
      key: 'product_image',
      header: 'รูปภาพ',
      className: 'product-image-col',
      render: (product) => {
        const imageUrl = resolveImagePreview(product.product_image);
        return (
          <div className="product-image-cell">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.product_name || 'Product'}
                className="product-image-thumbnail"
                onError={(e) => {
                  console.error('Image load error:', imageUrl);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <div className="product-image-placeholder" style={{ display: imageUrl ? 'none' : 'block' }}>
              <i className="bi bi-image"></i>
            </div>
          </div>
        );
      }
    },
    {
      key: 'product_name',
      header: 'สินค้า',
      className: 'product-name-col',
      render: (product) => {
        const showPromotion = hasPromotionPrices(product);
        return (
          <div className="product-name-cell">
            <div className="product-name-cell__main">
              <span className="product-name-cell__name">{product.product_name}</span>
              {showPromotion && <span className="product-promo-badge">มีโปรฯ</span>}
            </div>
            <div className="product-name-cell__meta">
              <span className="product-name-cell__category">{getCategoryLabel(product)}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'category',
      header: 'หมวดหมู่',
      className: 'category-col text-muted',
      render: (product) => getCategoryLabel(product)
    },
    {
      key: 'price_summary',
      header: 'ราคาขาย(สด/ผ่อน)',
      className: 'price-summary-col',
      render: (product) => {
        // ราคาขายปัจจุบัน = ราคาโปรโมชัน (ถ้ามี) หรือ ราคาปกติ
        const cashPromo = parseNumeric(product.price_cash_promo);
        const cash = parseNumeric(product.price_cash);
        const installmentPromo = parseNumeric(product.price_installment_promo);
        const installment = parseNumeric(product.price_installment);
        
        // หาราคาขายปัจจุบัน (โปรโมชันก่อน ถ้าไม่มีใช้ราคาปกติ)
        const currentCashPrice = cashPromo || cash;
        const currentInstallmentPrice = installmentPromo || installment;
        const originalCashPrice = cash;
        const originalInstallmentPrice = installment;
        const hasCashPromo = cashPromo && cashPromo < cash;
        const hasInstallmentPromo = installmentPromo && installmentPromo < installment;
        
        if (!currentCashPrice && !currentInstallmentPrice) {
          return <span className="text-muted">ยังไม่ระบุ</span>;
        }

        // Format price without currency symbol for compact display
        const formatPriceCompact = (value) => {
          if (value == null || value === '') {
            return '-';
          }
          const numericValue = Number(value);
          if (Number.isNaN(numericValue)) {
            return '-';
          }
          return numericValue.toLocaleString('th-TH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
        };

        const cashDisplay = currentCashPrice ? formatPriceCompact(currentCashPrice) : '-';
        const installmentDisplay = currentInstallmentPrice ? formatPriceCompact(currentInstallmentPrice) : '-';

        return (
          <div className="product-price-cell">
            <div className="product-price-cell__compact">
              <span className="product-price-cell__compact-price">
                {cashDisplay}/{installmentDisplay}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'highlights',
      header: 'รายละเอียด',
      className: 'highlights-col',
      render: (product) =>
        product.highlights && product.highlights.length > 0 ? (
          <div className="product-highlights">
            {product.highlights.slice(0, 2).map((highlight, idx) => (
              <div key={idx} className="product-highlight-item">
                {highlight}
              </div>
            ))}
            {product.highlights.length > 2 && (
              <div className="product-highlight-item text-muted">...</div>
            )}
          </div>
        ) : (
          <span className="text-muted">-</span>
        )
    },
    {
      key: 'actions',
      header: 'จัดการ',
      className: 'text-nowrap text-end actions-col',
      render: (product) => (
        <div className="admin-product-actions">
          <button
            className="admin-product-action-btn admin-product-action-btn--view"
            onClick={() => handleViewDetails(product)}
            title="ดูรายละเอียด"
          >
            <i className="bi bi-eye"></i>
          </button>
          <button
            className="admin-product-action-btn admin-product-action-btn--edit"
            onClick={() => handleEdit(product)}
            title="แก้ไข"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="admin-product-action-btn admin-product-action-btn--delete"
            onClick={() => handleDelete(product.product_id)}
            title="ลบ"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      )
    }
  ];

  const categoryFilters = useMemo(() => {
    return [
      { label: 'ทั้งหมด', value: 'all' },
      ...DISPLAY_CATEGORY_OPTIONS.map((label) => ({
        label,
        value: label
      }))
    ];
  }, []);

  useEffect(() => {
    const allowedValues = new Set(['all', ...DISPLAY_CATEGORY_OPTIONS]);
    if (!allowedValues.has(activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory]);

  const categoryProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return products;
    }
    return products.filter((product) => getCategoryLabel(product) === activeCategory);
  }, [products, activeCategory]);

  const searchedProducts = useMemo(() => {
    const trimmed = productSearch.replace(/#/g, '').trim();
    if (!trimmed) {
      return categoryProducts;
    }
    const keyword = trimmed.toLowerCase();
    return categoryProducts.filter((product) => {
      const idMatch = String(product.product_id).toLowerCase().includes(keyword);
      const nameMatch = (product.product_name || '').toLowerCase().includes(keyword);
      return idMatch || nameMatch;
    });
  }, [categoryProducts, productSearch]);

  const filteredProducts = useMemo(() => {
    let result = searchedProducts;
    
    // Apply promotion filter
    if (promotionFilter !== 'all') {
      const shouldHavePromo = promotionFilter === 'promo';
      result = result.filter((product) => {
        const hasPromo = hasPromotionPrices(product);
        return shouldHavePromo ? hasPromo : !hasPromo;
      });
    }
    
    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.product_id - a.product_id;
        case 'oldest':
          return a.product_id - b.product_id;
        case 'price_asc':
          const priceA = parseNumeric(a.price_cash) || parseNumeric(a.price_installment) || 0;
          const priceB = parseNumeric(b.price_cash) || parseNumeric(b.price_installment) || 0;
          return priceA - priceB;
        case 'price_desc':
          const priceA2 = parseNumeric(a.price_cash) || parseNumeric(a.price_installment) || 0;
          const priceB2 = parseNumeric(b.price_cash) || parseNumeric(b.price_installment) || 0;
          return priceB2 - priceA2;
        case 'name_asc':
          return (a.product_name || '').localeCompare(b.product_name || '', 'th');
        case 'name_desc':
          return (b.product_name || '').localeCompare(a.product_name || '', 'th');
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [searchedProducts, promotionFilter, sortBy]);

  const activeCategoryLabel = activeCategory === 'all' ? '' : activeCategory;
  const categoryCount = categoryProducts.length;
  const filteredCount = filteredProducts.length;

  // Auto-remove alerts after 5 seconds
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        setAlerts(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  return (
    <div className="admin-products-page">
      <AdminHeader
        admin={admin}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        adminNotifications={adminNotifications}
        markAdminOrdersSeen={markAdminOrdersSeen}
        markAdminCustomersSeen={markAdminCustomersSeen}
      />
      <NotificationBell
        adminNotifications={adminNotifications}
        markAdminOrdersSeen={markAdminOrdersSeen}
        markAdminCustomersSeen={markAdminCustomersSeen}
      />
      <Container className="py-5">
        <div className="admin-products-topbar mb-4">
          <div className="admin-products-topbar__title">
            <h2 className="mb-1">จัดการสินค้า</h2>
            <p className="text-muted small mb-0">
              ดูและจัดระเบียบสินค้าพร้อมค้นหาด้วยชื่อหรือรหัสได้ทันที
            </p>
          </div>
          <Link to="/admin/dashboard">
            <Button variant="outline-secondary" className="admin-products-back">
              <i className="bi bi-arrow-left me-2"></i>
              ย้อนกลับ
            </Button>
          </Link>
        </div>

        {message.show && (
          <Alert variant={message.variant} dismissible onClose={() => setMessage({ show: false })}>
            {message.text}
          </Alert>
        )}

        {/* Toolbar */}
        <div className="admin-products-toolbar">
          <div className="admin-products-toolbar__search">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อสินค้า, หมวดหมู่ หรือรหัสสินค้า"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === '/' && e.target !== document.activeElement) {
                  e.preventDefault();
                  e.target.focus();
                }
              }}
            />
            {productSearch && (
              <button
                type="button"
                className="admin-products-toolbar__search-clear"
                onClick={() => setProductSearch('')}
                aria-label="ล้างการค้นหา"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            )}
          </div>
          <div className="admin-products-toolbar__filters">
            <div className="admin-products-toolbar__filter">
              <i className="bi bi-funnel"></i>
              <Form.Select
                value={promotionFilter}
                onChange={(event) => setPromotionFilter(event.target.value)}
              >
                {PROMOTION_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="admin-products-toolbar__filter">
              <i className="bi bi-sort-down"></i>
              <Form.Select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">ใหม่ล่าสุด</option>
                <option value="oldest">เก่าที่สุด</option>
                <option value="price_asc">ราคา: ต่ำ → สูง</option>
                <option value="price_desc">ราคา: สูง → ต่ำ</option>
                <option value="name_asc">ชื่อ: ก → ฮ</option>
                <option value="name_desc">ชื่อ: ฮ → ก</option>
              </Form.Select>
            </div>
          </div>
          <Button variant="primary" onClick={handleAdd} className="admin-products-toolbar__add">
            <i className="bi bi-plus-lg me-2"></i>
            เพิ่มสินค้า
          </Button>
        </div>

        {/* Product Summary */}
        <div className="admin-products-summary">
          <span className="admin-products-summary__label">สินค้าทั้งหมด</span>
          <strong className="admin-products-summary__count">ทั้งหมด {filteredCount} รายการ</strong>
        </div>

        <Card className="admin-products-card">
          <Card.Body>

            <div className="mb-4">
              <div className="category-filter-label mb-2">หมวดหมู่</div>
              <div className="admin-category-filter">
                {categoryFilters.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    className={`category-chip ${activeCategory === category.value ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.value)}
                    aria-label={`กรองหมวดหมู่ ${category.label}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="admin-products-empty">
                <div className="admin-products-empty__icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <h4>ยังไม่มีสินค้าในระบบ</h4>
                <p className="text-muted">เริ่มต้นด้วยการเพิ่มสินค้าใหม่</p>
                <Button variant="primary" onClick={handleAdd}>
                  <i className="bi bi-plus-lg me-2"></i>
                  เพิ่มสินค้าใหม่
                </Button>
              </div>
            ) : (
              <Table responsive hover className="admin-products-table align-middle">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className={column.header === 'จัดการ' ? 'text-end' : ''}>
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.product_id}>
                      {columns.map((column) => (
                        <td key={`${product.product_id}-${column.key}`} className={column.className}>
                          {column.render(product)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Drawer for Add/Edit Product */}
        <div className={`admin-products-drawer ${isDrawerOpen ? 'admin-products-drawer--open' : ''}`}>
          <div className="admin-products-drawer__overlay" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="admin-products-drawer__content">
            <div className="admin-products-drawer__header">
              <h3>{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
              <button
                className="admin-products-drawer__close"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="ปิด"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-products-drawer__body">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>ชื่อสินค้า</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>คำอธิบาย</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>หมวดหมู่</Form.Label>
                  <Form.Select
                    name="displayCategory"
                    value={formData.displayCategory}
                    onChange={handleInputChange}
                  >
                    {DISPLAY_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>รายละเอียดสินค้า (หนึ่งรายการต่อบรรทัด)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="highlights"
                    value={formData.highlights}
                    onChange={handleInputChange}
                    placeholder="เช่น&#10;- หนังแท้เกรดพรีเมียม&#10;- โครงสร้างรับประกัน 5 ปี"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>ราคา (ซื้อสด)</Form.Label>
                      <Form.Control
                        type="number"
                        name="priceCash"
                        value={formData.priceCash}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>ราคา (ซื้อสดโปรโมชัน)</Form.Label>
                      <Form.Control
                        type="number"
                        name="priceCashPromo"
                        value={formData.priceCashPromo}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>ราคา (ซื้อผ่อน) — คำนวณอัตโนมัติ</Form.Label>
                      <Form.Control
                        type="text"
                        readOnly
                        value={formatPrice(autoInstallmentPrice)}
                        className="bg-light fw-semibold"
                      />
                      <Form.Text className="text-muted">
                        ระบบคิดจากราคาเงินสด +10% ที่ 2 งวด และเพิ่มขึ้น 1% ต่อเดือนจนถึง {DEFAULT_INSTALLMENT_PERIODS} งวด (+{DEFAULT_INSTALLMENT_RATE_PERCENT}%)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>ราคา (ซื้อผ่อนโปรโมชัน)</Form.Label>
                      <Form.Control
                        type="text"
                        readOnly
                        value={
                          formData.priceCashPromo
                            ? formatPrice(autoInstallmentPromoPrice)
                            : '—'
                        }
                        className="bg-light fw-semibold"
                      />
                      <Form.Text className="text-muted">
                        หากมีราคาโปรโมชัน ระบบจะคำนวณราคาเงินผ่อนจากราคาโปรโมชันให้อัตโนมัติ
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>รูปภาพ</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <small className="text-muted d-block mb-1">Preview:</small>
                      <div className="border rounded p-2" style={{ backgroundColor: '#f8f9fa' }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto'
                          }}
                          onError={(e) => {
                            console.error('Preview image load error:', imagePreview?.substring(0, 50));
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Preview image loaded successfully');
                          }}
                        />
                      </div>
                      {imageFile && (
                        <small className="text-muted d-block mt-1">
                          ไฟล์: {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
                        </small>
                      )}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>URL รูปภาพหลัก (หรือกรอกชื่อไฟล์หลังจากอัปโหลด)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.images?.[0] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleImageFieldChange(0, value);
                      // อัปเดต preview ทันทีเมื่อไม่มีไฟล์ที่อัปโหลด
                      // ถ้ามีไฟล์ที่อัปโหลดอยู่แล้ว อย่าเปลี่ยน preview (ใช้ preview จาก FileReader)
                      if (!imageFile) {
                        if (value.trim()) {
                          const previewUrl = resolveImagePreview(value);
                          setImagePreview(previewUrl);
                        } else {
                          setImagePreview(null);
                        }
                      }
                    }}
                    placeholder="เช่น /images/โซฟา/product1.jpg หรือ https://example.com/product1.jpg หรือชื่อไฟล์หลังจากอัปโหลด"
                  />
                  {formData.images?.[0] && !imageFile && (
                    <div className="mt-2">
                      <small className="text-muted d-block mb-1">Preview:</small>
                      <div className="border rounded p-2" style={{ backgroundColor: '#f8f9fa' }}>
                        <img
                          src={resolveImagePreview(formData.images[0])}
                          alt="Image Preview"
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '150px', 
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto'
                          }}
                          onError={(e) => {
                            console.error('Image preview load error:', resolveImagePreview(formData.images[0]));
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Image preview loaded:', resolveImagePreview(formData.images[0]));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Form.Group>

                <Row>
                  {[1, 2, 3].map((idx) => (
                    <Col md={4} key={`extra-image-${idx}`}>
                      <Form.Group className="mb-3">
                        <Form.Label>รูปภาพเพิ่มเติม {idx}</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.images?.[idx] || ''}
                          onChange={(e) => handleImageFieldChange(idx, e.target.value)}
                          placeholder="เช่น product1-alt.png"
                        />
                      </Form.Group>
                    </Col>
                  ))}
                </Row>

                <div className="admin-products-drawer__footer">
                  <Button
                    variant="secondary"
                    onClick={() => setIsDrawerOpen(false)}
                    className="me-2"
                  >
                    ยกเลิก
                  </Button>
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>

      </Container>
    </div>
  );
}

