import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import { fetchCartItems, upsertCartItem, deleteCartItem, notifyCartUpdate } from '../utils/cartApi';
import './Cart.css';

const getItemKey = (item) => `${item.product_id}-${item.pricingType || 'cash'}`;

const createEmptyShipping = () => ({
  recipientName: '',
  recipientSurname: '',
  phone: '',
  address: ''
});

const splitFullName = (fullName) => {
  if (!fullName) {
    return { first: '', last: '' };
  }
  const parts = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return { first: '', last: '' };
  }
  if (parts.length === 1) {
    return { first: parts[0], last: '' };
  }
  return { first: parts[0], last: parts.slice(1).join(' ') };
};

const toCleanString = (value) => (value === undefined || value === null ? '' : String(value).trim());

const hasShippingValues = (entry) => {
  if (!entry) {
    return false;
  }
  return Object.values(entry).some((value) => toCleanString(value).length > 0);
};

const sanitizePhone = (value) => {
  const cleaned = toCleanString(value).replace(/\D+/g, '');
  return cleaned;
};

const normalizeShippingEntry = (entry) => {
  const base = createEmptyShipping();
  if (!entry) {
    return base;
  }
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) {
      return base;
    }
    if (trimmed.startsWith('{')) {
      try {
        return normalizeShippingEntry(JSON.parse(trimmed));
      } catch (error) {
        console.warn('Failed to parse shipping entry JSON:', trimmed, error);
        return { ...base, address: trimmed };
      }
    }
    return { ...base, address: trimmed };
  }
  return {
    recipientName: toCleanString(entry.recipientName),
    recipientSurname: toCleanString(entry.recipientSurname),
    phone: sanitizePhone(entry.phone),
    address: toCleanString(entry.address)
  };
};

const summarizeRecipient = (entry) => {
  const normalized = normalizeShippingEntry(entry);
  const name = [normalized.recipientName, normalized.recipientSurname]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (name && normalized.phone) {
    return `${name} · ${normalized.phone}`;
  }
  if (name) {
    return name;
  }
  if (normalized.phone) {
    return normalized.phone;
  }
  return '';
};

const formatShippingPreview = (entry) => {
  const normalized = normalizeShippingEntry(entry);
  const lines = [];
  const nameLine = [normalized.recipientName, normalized.recipientSurname]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (nameLine) {
    lines.push(nameLine);
  }
    if (normalized.phone) {
      lines.push(`เบอร์โทรสำหรับติดต่อ: ${normalized.phone}`);
    }
  if (normalized.address) {
    lines.push(normalized.address);
  }
  return lines.join('\n');
};

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
    return 0;
  }
  const rate = getInstallmentRateByMonths(months);
  return Math.round(price * (1 + rate));
};

const parseNumeric = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const resolveBestCashPrice = (productData, fallbackPrice = 0) => {
  const fallback = parseNumeric(fallbackPrice) ?? 0;
  if (!productData) {
    return fallback;
  }
  const cashPromo = parseNumeric(productData.price_cash_promo);
  const cash = parseNumeric(productData.price_cash);
  if (cashPromo != null && cash != null && cashPromo < cash) {
    return cashPromo;
  }
  if (cashPromo != null && cash == null) {
    return cashPromo;
  }
  if (cash != null) {
    return cash;
  }
  return fallback;
};

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [productsData, setProductsData] = useState({}); // เก็บข้อมูลสินค้าสำหรับหา price_cash
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [installmentPeriods, setInstallmentPeriods] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAlert, setSubmitAlert] = useState({ show: false, variant: 'info', message: '' });
  const [orderResult, setOrderResult] = useState(null);
  const [addressOptions, setAddressOptions] = useState([]);
  const [selectedAddressKey, setSelectedAddressKey] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(true);
  const [customShipping, setCustomShipping] = useState(createEmptyShipping);
  const [defaultCustomShipping, setDefaultCustomShipping] = useState(createEmptyShipping);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to parse stored user:', error);
      return null;
    }
  });

  const deriveCustomShippingSeed = (profileData, primaryEntry) => {
    const normalizedPrimary = primaryEntry ? normalizeShippingEntry(primaryEntry) : createEmptyShipping();
    const normalizedCustomerAddress = normalizeShippingEntry(profileData?.customer_address);
    const profileFallback = {
      recipientName: toCleanString(profileData?.customer_fname),
      recipientSurname: toCleanString(profileData?.customer_lname),
      phone: sanitizePhone(profileData?.customer_tel),
      address: normalizedCustomerAddress.address
    };
    const { first: userFirstName, last: userLastName } = splitFullName(currentUser?.name);
    const currentUserFirstName =
      toCleanString(currentUser?.firstName) || userFirstName;
    const currentUserLastName =
      toCleanString(currentUser?.lastName) || userLastName;
    const currentUserPhone = sanitizePhone(currentUser?.phone);
    const currentUserAddress = toCleanString(currentUser?.address);

    return {
      recipientName:
        normalizedPrimary.recipientName ||
        profileFallback.recipientName ||
        currentUserFirstName,
      recipientSurname:
        normalizedPrimary.recipientSurname ||
        profileFallback.recipientSurname ||
        currentUserLastName,
      phone: sanitizePhone(
        normalizedPrimary.phone || profileFallback.phone || currentUserPhone
      ),
      address: normalizedPrimary.address || profileFallback.address || currentUserAddress
    };
  };

  const broadcastCartUpdate = (data, options = {}) => {
    notifyCartUpdate(data, options);
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
    loadCart();
    loadAddressOptions();
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'token') {
        loadAddressOptions();
        loadCart({ silent: true });
      }
      if (event.key === 'user') {
        const storedUser = event.newValue;
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (error) {
            console.warn('Failed to parse user from storage event:', error);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        loadAddressOptions();
        loadCart({ silent: true });
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const syncUser = (event) => {
      if (event?.detail?.user !== undefined) {
        setCurrentUser(event.detail.user);
      } else {
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (error) {
            console.warn('Failed to parse stored user on sync:', error);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      loadAddressOptions();
    };

    window.addEventListener('userChanged', syncUser);
    return () => window.removeEventListener('userChanged', syncUser);
  }, []);

  useEffect(() => {
    setSelectedKeys((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const availableKeys = cart.map((item) => getItemKey(item));
      return prev.filter((key) => availableKeys.includes(key));
    });
  }, [cart]);

  // ฟังก์ชันสำหรับแสดง pricing label
  // ถ้าเป็นโปรโมชัน ให้แสดง "โปรโมชัน"
  // ถ้าไม่มีโปรโมชัน ไม่ต้องแสดงอะไร
  const getPricingLabel = (pricingType) => {
    if (!pricingType) return '';
    const type = String(pricingType).toLowerCase();
    if (type.includes('promo')) {
      return 'โปรโมชัน';
    }
    return '';
  };

  const syncCartState = (items, { preserveSelection = true, silent = false } = {}) => {
    const normalized = Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice ?? item.product_price ?? 0,
          pricingType: item.pricingType || 'cash',
          pricingLabel: getPricingLabel(item.pricingType || 'cash')
        }))
      : [];

    setCart(normalized);
    setSelectedKeys((prev) => {
      const availableKeys = normalized.map((item) => getItemKey(item));
      if (!preserveSelection || prev.length === 0) {
        return availableKeys;
      }
      const filtered = prev.filter((key) => availableKeys.includes(key));
      return filtered.length > 0 ? filtered : availableKeys;
    });
    broadcastCartUpdate(normalized, { silent });
    
    // ดึงข้อมูลสินค้าเพื่อหา price_cash เมื่อมีการเปลี่ยนแปลงตะกร้า
    const productIds = normalized.map((item) => item.product_id);
    if (productIds.length > 0) {
      loadProductsData(productIds);
    }
  };

  // ฟังก์ชันสำหรับดึงข้อมูลสินค้าเพื่อหา price_cash
  const loadProductsData = async (productIds) => {
    if (!productIds || productIds.length === 0) return;
    
    try {
      const uniqueIds = [...new Set(productIds)];
      const productsMap = {};
      
      // ดึงข้อมูลสินค้าแต่ละตัว
      await Promise.all(
        uniqueIds.map(async (productId) => {
          try {
            const response = await axios.get(`/api/products/${productId}`);
            if (response.data) {
              productsMap[productId] = {
                price_cash: response.data.price_cash,
                price_cash_promo: response.data.price_cash_promo,
                price_installment: response.data.price_installment,
                price_installment_promo: response.data.price_installment_promo
              };
            }
          } catch (error) {
            console.error(`Failed to fetch product ${productId}:`, error);
          }
        })
      );
      
      setProductsData((prev) => ({ ...prev, ...productsMap }));
    } catch (error) {
      console.error('Failed to load products data:', error);
    }
  };

  // ฟังก์ชันสำหรับหาราคาเงินสด (โปรโมชันก่อน ถ้าไม่มีใช้ราคาปกติ)
  const getCashPrice = (item) => {
    const productId = item.product_id;
    const productData = productsData[productId];
    return resolveBestCashPrice(productData, item.unitPrice);
  };

  // ฟังก์ชันสำหรับหาราคาแบบผ่อน (โปรโมชันก่อน ถ้าไม่มีใช้ราคาปกติ)
  const getInstallmentPrice = (item) => {
    const productId = item.product_id;
    const productData = productsData[productId];
    const baseCashPrice = resolveBestCashPrice(productData, item.unitPrice);
    const periods = clampInstallmentPeriods(installmentPeriods);
    return calculateInstallmentTotalFromCash(baseCashPrice, periods);
  };

  const loadCart = async ({ silent = true } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      syncCartState([], { preserveSelection: false, silent });
      return;
    }
    const result = await fetchCartItems();
    if (result.unauthorized || result.error) {
      syncCartState([], { preserveSelection: false, silent: true });
      if (result.error) {
        console.error('Failed to load cart items from server');
      }
      return;
    }
    syncCartState(result.items, { preserveSelection: false, silent });
    
    // ดึงข้อมูลสินค้าเพื่อหา price_cash
    const productIds = result.items.map((item) => item.product_id);
    if (productIds.length > 0) {
      loadProductsData(productIds);
    }
  };

  const loadAddressOptions = async () => {
     const token = localStorage.getItem('token');
     if (!token) {
       setAddressOptions([]);
       setSelectedAddressKey('custom');
       setUseCustomAddress(true);
      const fallbackSeed = deriveCustomShippingSeed();
      setDefaultCustomShipping(fallbackSeed);
      setCustomShipping((prev) => (hasShippingValues(prev) ? prev : fallbackSeed));
      return;
     }
     try {
       const response = await axios.get('/api/customer/profile');
      const shippingProfile = response.data.shipping_profile || {};
      const alternatives = Array.isArray(shippingProfile.alternatives)
        ? shippingProfile.alternatives
        : Array.isArray(response.data.alternativeAddresses)
        ? response.data.alternativeAddresses
        : [];
      const primaryEntry = normalizeShippingEntry(shippingProfile.primary || response.data.customer_address);
      const defaultSeed = deriveCustomShippingSeed(response.data, shippingProfile.primary || response.data.customer_address);
      const options = [];
      if (primaryEntry.address) {
        options.push({
          key: 'primary',
          label: summarizeRecipient(primaryEntry)
            ? `รายละเอียดที่อยู่ · ${summarizeRecipient(primaryEntry)}`
            : 'รายละเอียดที่อยู่',
          value: primaryEntry
        });
      }
      alternatives.forEach((address, index) => {
        const entry = normalizeShippingEntry(address);
        if (!entry.address) {
          return;
        }
        options.push({
          key: `alt-${index}`,
          label: summarizeRecipient(entry)
            ? `ที่อยู่สำรอง ${index + 1} · ${summarizeRecipient(entry)}`
            : `ที่อยู่สำรอง ${index + 1}`,
          value: entry
        });
      });
      setAddressOptions(options);
      setDefaultCustomShipping(defaultSeed);
      setCustomShipping((prev) => (hasShippingValues(prev) ? prev : defaultSeed));
      if (options.length > 0) {
        setSelectedAddressKey(options[0].key);
        setUseCustomAddress(false);
      } else {
        setSelectedAddressKey('custom');
        setUseCustomAddress(true);
      }
    } catch (error) {
      console.error('Error loading profile addresses:', error);
      setAddressOptions([]);
      setSelectedAddressKey('custom');
      setUseCustomAddress(true);
      const fallbackSeed = deriveCustomShippingSeed();
      setDefaultCustomShipping(fallbackSeed);
      setCustomShipping((prev) => (hasShippingValues(prev) ? prev : fallbackSeed));
    }
  };

  const getSelectedAddressValue = () => {
     if (useCustomAddress || selectedAddressKey === 'custom') {
      return normalizeShippingEntry(customShipping);
    }
    const option = addressOptions.find((item) => item.key === selectedAddressKey);
    return option ? normalizeShippingEntry(option.value) : createEmptyShipping();
  };

  const updateQuantity = async (productId, pricingType, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId, pricingType);
      return;
    }
    const target = cart.find(
      (item) => item.product_id === productId && item.pricingType === pricingType
    );
    if (!target) {
      return;
    }
    const result = await upsertCartItem({
      productId,
      pricingType,
      quantity: newQuantity,
      unitPrice: target.unitPrice,
      pricingLabel: target.pricingLabel,
      mode: 'set'
    });
    if (result.unauthorized) {
      navigate('/login');
      return;
    }
    if (result.error) {
      setSubmitAlert({
        show: true,
        variant: 'danger',
        message: 'ไม่สามารถอัปเดตจำนวนสินค้าได้ กรุณาลองใหม่อีกครั้ง'
      });
      return;
    }
    syncCartState(result.items, { preserveSelection: true });
  };

  const removeFromCart = async (productId, pricingType) => {
    const result = await deleteCartItem({ productId, pricingType });
    if (result.unauthorized) {
      navigate('/login');
      return;
    }
    if (result.error) {
      setSubmitAlert({
        show: true,
        variant: 'danger',
        message: 'ไม่สามารถลบสินค้าออกจากตะกร้าได้ กรุณาลองใหม่อีกครั้ง'
      });
      return;
    }
    syncCartState(result.items, { preserveSelection: true });
  };

const formatPriceValue = (value) => {
  if (value == null) {
    return '0';
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '0';
  }
  return number.toLocaleString();
};

const shouldShowBasePrice = (item) => {
  if (!item) {
    return false;
  }
  const pricingType = String(item.pricingType || '').toLowerCase();
  if (!pricingType.includes('promo')) {
    return false;
  }
  const base = Number(item.basePrice);
  const promo = Number(item.unitPrice);
  return Number.isFinite(base) && Number.isFinite(promo) && base > promo;
};

  const selectedItems = useMemo(
    () => cart.filter((item) => selectedKeys.includes(getItemKey(item))),
    [cart, selectedKeys]
  );

  // คำนวณยอดรวมโดยใช้ราคาตามวิธีการชำระเงิน
  const total = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const price =
          paymentMethod === 'installment'
            ? getInstallmentPrice(item)
            : getCashPrice(item);
        return sum + price * item.quantity;
      }, 0),
    [selectedItems, productsData, paymentMethod, installmentPeriods]
  );

  // ค่าจัดส่ง
  const shippingFee = 0;

  // คำนวณ VAT 7% - ราคาสินค้าที่ได้จากตะกร้าเป็นราคารวม VAT แล้ว
  // ดังนั้นต้องแยกเป็นราคาก่อน VAT และ VAT
  const vatRate = 0.07;
  const subtotalExcludeVat = total / (1 + vatRate); // ราคารวมสินค้าก่อน VAT
  const vatAmount = subtotalExcludeVat * vatRate; // จำนวน VAT 7%
  const netTotal = subtotalExcludeVat + vatAmount + shippingFee; // ยอดรวมสุทธิ (ควรเท่ากับ total + shippingFee)

  const allSelected = cart.length > 0 && selectedKeys.length === cart.length;
  const selectedCount = selectedItems.length;
  const isSubmitDisabled = selectedCount === 0 || isSubmitting;
  const normalizedInstallmentPeriods = useMemo(
    () => clampInstallmentPeriods(installmentPeriods),
    [installmentPeriods]
  );

  const toggleItemSelection = (item) => {
    const key = getItemKey(item);
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(cart.map((item) => getItemKey(item)));
    }
  };

  const roundedInstallmentAmount = useMemo(() => {
    if (normalizedInstallmentPeriods <= 0) {
      return 0;
    }
    const rawAmount = netTotal / normalizedInstallmentPeriods;
    const roundedDownToTens = Math.floor(rawAmount / 10) * 10;
    return Math.max(roundedDownToTens, 0);
  }, [netTotal, normalizedInstallmentPeriods]);

  const highlightLabel =
    paymentMethod === 'installment'
      ? `ค่างวดผ่อนโดยประมาณ (${normalizedInstallmentPeriods} งวด)`
      : 'ยอดที่ต้องชำระ';
  const highlightAmount =
    paymentMethod === 'installment' ? roundedInstallmentAmount : netTotal;

  const handleSubmitOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSubmitAlert({
        show: true,
        variant: 'warning',
        message: 'กรุณาเข้าสู่ระบบก่อนส่งคำสั่งซื้อ'
      });
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    if (selectedItems.length === 0) {
      setSubmitAlert({
        show: true,
        variant: 'warning',
        message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการก่อนส่งคำสั่งซื้อ'
      });
      return;
    }

    const shippingAddress = normalizeShippingEntry(getSelectedAddressValue());
    if (!shippingAddress.address) {
      setSubmitAlert({
        show: true,
        variant: 'danger',
        message: 'กรุณาเลือกหรือกรอกที่อยู่จัดส่งก่อนดำเนินการ'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitAlert({ show: false, variant: 'info', message: '' });

    try {
      const periods = paymentMethod === 'installment' ? normalizedInstallmentPeriods : 1;
      const items = selectedItems.map((item) => {
        const itemPrice = paymentMethod === 'installment' 
          ? getInstallmentPrice(item) 
          : getCashPrice(item);
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          price: itemPrice, // ใช้ราคาตามวิธีการชำระเงิน
          pricingType: paymentMethod === 'installment' ? 'installment' : 'cash'
        };
      });

      const response = await axios.post('/api/orders', {
        items,
        paymentMethod,
        installmentPeriods: periods,
        shippingAddress
      });

      const createdOrderId = response.data?.order_id;
      setOrderResult({
        orderId: createdOrderId,
        total: netTotal,
        paymentMethod,
        periods,
        shippingAddress: response.data?.shipping_address || shippingAddress
      });

      let latestItems = cart;
      for (const item of selectedItems) {
        const result = await deleteCartItem({
          productId: item.product_id,
          pricingType: item.pricingType || 'cash'
        });
        if (result.unauthorized) {
          latestItems = [];
          break;
        }
        if (!result.error) {
          latestItems = result.items;
        }
      }

      syncCartState(latestItems, { preserveSelection: false });
      setCustomShipping(createEmptyShipping());
      setSubmitAlert({
        show: true,
        variant: 'success',
        message: 'ส่งคำสั่งซื้อเรียบร้อยแล้ว ระบบกำลังรอแอดมินอนุมัติ'
      });
    } catch (error) {
      console.error('Submit order error:', error);
      setSubmitAlert({
        show: true,
        variant: 'danger',
        message: error.response?.data?.error || 'ส่งคำสั่งซื้อไม่สำเร็จ โปรดลองอีกครั้ง'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    if (orderResult) {
      return (
        <div className="cart-page empty">
          <Container>
            <div className="empty-cart success">
              <div className="empty-icon success">
                <i className="bi bi-hourglass-split"></i>
              </div>
              <h2>คำสั่งซื้อถูกส่งเรียบร้อย</h2>
              <p>
                คำสั่งซื้อเลขที่ #{orderResult.orderId || '-'} อยู่ในสถานะ <strong>รออนุมัติ</strong>
                <br />
                {orderResult.shippingAddress && (
                   <span>
                    ที่อยู่จัดส่ง:
                    <strong>
                      <br />
                      {formatShippingPreview(normalizeShippingEntry(orderResult.shippingAddress))}
                    </strong>
                    <br />
                  </span>
                )}
                คุณสามารถติดตามความคืบหน้าได้ที่เมนู "คำสั่งซื้อ" และทีมงานจะติดต่อกลับทันทีเมื่อดำเนินการเสร็จสิ้น
              </p>
              <div className="success-actions">
                <Button className="btn-primary-custom" onClick={() => navigate('/orders')}>
                  ดูสถานะคำสั่งซื้อของฉัน
                </Button>
                <Button className="btn-outline" onClick={() => navigate('/') }>
                  กลับไปเลือกสินค้าเพิ่มเติม
                </Button>
              </div>
            </div>
          </Container>
        </div>
      );
    }

    return (
      <div className="cart-page empty">
        <Container>
          <div className="empty-cart">
            <div className="empty-icon">
              <i className="bi bi-bag"></i>
            </div>
            <h2>ยังไม่มีสินค้าในตะกร้า</h2>
            <p>เริ่มต้นเลือกสินค้าที่คุณชอบ แล้วกลับมาที่นี่อีกครั้ง</p>
            <Button className="btn-primary-custom" onClick={() => navigate('/') }>
              ไปเลือกสินค้า
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Container fluid className="cart-container">
        <header className="cart-page__hero">
          <div className="cart-page__hero-text">
            <span className="cart-tagline">
              <i className="bi bi-cart-check"></i>
              ตะกร้าสินค้า
            </span>
            <h1>จัดการสินค้าและสรุปคำสั่งซื้อของคุณ</h1>
            <p>
              เลือกเฉพาะสินค้าที่ต้องการชำระในรอบนี้ แล้วระบุที่อยู่จัดส่งให้เรียบร้อย
              <span style={{ whiteSpace: 'nowrap' }}>ทีมงานจะติดต่อกลับเพื่อสรุปรายละเอียดอย่างรวดเร็ว</span>
            </p>
          </div>
          <Button className="btn-ghost" onClick={() => navigate('/')}> 
            <i className="bi bi-plus-circle me-2"></i>
            เพิ่มสินค้า
          </Button>
        </header>

        <section className="cart-card cart-card--items">
          <header className="cart-card__header">
            <div>
              <h2>รายการสินค้า ({cart.length})</h2>
              <p>เลือกรายการที่ต้องการชำระ แก้ไขจำนวน หรือนำออกได้ทันที</p>
            </div>
            <button type="button" className="cart-select-all" onClick={toggleSelectAll}>
              <Form.Check type="checkbox" checked={allSelected} readOnly />
              <span>{allSelected ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}</span>
            </button>
          </header>

          <div className="cart-items">
            {cart.map((item) => {
              const itemKey = getItemKey(item);
              const isSelected = selectedKeys.includes(itemKey);
              const itemPrice = paymentMethod === 'installment' 
                ? getInstallmentPrice(item) 
                : getCashPrice(item);
              const productData = productsData[item.product_id];
              
              // ตรวจสอบว่ามีโปรโมชันหรือไม่
              let hasPromo = false;
              let basePrice = null;
              
              if (paymentMethod === 'installment') {
                hasPromo = productData && 
                  productData.price_installment_promo != null && 
                  productData.price_installment != null &&
                  parseFloat(productData.price_installment_promo) < parseFloat(productData.price_installment);
                basePrice = hasPromo ? parseFloat(productData.price_installment) : null;
              } else {
                hasPromo = productData && 
                  productData.price_cash_promo != null && 
                  productData.price_cash != null &&
                  parseFloat(productData.price_cash_promo) < parseFloat(productData.price_cash);
                basePrice = hasPromo ? parseFloat(productData.price_cash) : null;
              }
              
              const showBasePrice = hasPromo;
              const pricingLabel = hasPromo ? 'โปรโมชัน' : '';
              const promoLabelClass = showBasePrice ? ' cart-item__label--promo' : '';
              
              return (
                <article key={itemKey} className={`cart-item${isSelected ? ' cart-item--selected' : ''}`}>
                  <div className="cart-item__select">
                    <Form.Check
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item)}
                      aria-label={`เลือก ${item.product_name}`}
                    />
                  </div>
                  <img
                    src={getImageUrl(item.product_image)}
                    alt={item.product_name}
                    className="cart-item__image"
                  />
                  <div className="cart-item__info">
                    <h3>{item.product_name}</h3>
                    <span className="cart-item__sku">รหัสสินค้า #{item.product_id}</span>
                    <div className="cart-item__meta">
                      {showBasePrice && basePrice != null && (
                        <span className="cart-item__price cart-item__price--original">
                          ฿{formatPriceValue(basePrice)}
                        </span>
                      )}
                      <span className="cart-item__price">
                        ฿{formatPriceValue(itemPrice)}
                      </span>
                      {pricingLabel && (
                        <span className={`cart-item__label${promoLabelClass}`}>
                          {pricingLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="cart-item__controls">
                    <Form.Control
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.product_id,
                          item.pricingType,
                          parseInt(e.target.value, 10)
                        )
                      }
                    />
                  </div>
                  <div className="cart-item__total">
                    ฿{(itemPrice * item.quantity).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    className="cart-item__remove"
                    onClick={() => removeFromCart(item.product_id, item.pricingType)}
                    aria-label={`ลบ ${item.product_name}`}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="cart-grid">
          <div className="cart-card">
            <header className="cart-card__header">
              <div>
                <h2>เลือกที่อยู่จัดส่ง</h2>
                <p>เลือกจากที่อยู่ที่บันทึกไว้ หรือระบุใหม่สำหรับคำสั่งซื้อนี้</p>
              </div>
            </header>
            <div className="cart-card__body">
              {addressOptions.length > 0 ? (
                 <>
                   <Form.Select
                     className="shipping-select"
                     value={useCustomAddress ? 'custom' : selectedAddressKey}
                     onChange={(event) => {
                       const value = event.target.value;
                       if (value === 'custom') {
                         setUseCustomAddress(true);
                         setSelectedAddressKey('custom');
                         setCustomShipping((prev) =>
                           hasShippingValues(prev) ? prev : defaultCustomShipping
                         );
                       } else {
                         setUseCustomAddress(false);
                         setSelectedAddressKey(value);
                       }
                     }}
                   >
                     {addressOptions.map((option) => (
                       <option key={option.key} value={option.key}>
                         {option.label}
                       </option>
                     ))}
                     <option value="custom">ระบุที่อยู่ใหม่สำหรับออเดอร์นี้</option>
                   </Form.Select>
                   {!useCustomAddress && selectedAddressKey !== 'custom' && (
                     <div className="shipping-preview">
                       {formatShippingPreview(getSelectedAddressValue())}
                     </div>
                   )}
                 </>
               ) : (
                 <div className="shipping-note">
                   <i className="bi bi-geo"></i>
                   <span>ยังไม่มีที่อยู่ในบัญชี กรุณากรอกที่อยู่จัดส่งด้านล่าง</span>
                 </div>
               )}
 
              {(useCustomAddress || addressOptions.length === 0) && (
                <>
                  <div className="shipping-custom-grid">
                    <Form.Group>
                      <Form.Label>ชื่อผู้รับ</Form.Label>
                      <Form.Control
                        type="text"
                        value={customShipping.recipientName}
                        onChange={(event) =>
                          setCustomShipping((prev) => ({ ...prev, recipientName: event.target.value }))
                        }
                        placeholder="ชื่อจริงของผู้รับ"
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>นามสกุล</Form.Label>
                      <Form.Control
                        type="text"
                        value={customShipping.recipientSurname}
                        onChange={(event) =>
                          setCustomShipping((prev) => ({ ...prev, recipientSurname: event.target.value }))
                        }
                        placeholder="นามสกุลผู้รับ"
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>เบอร์โทรสำหรับติดต่อ</Form.Label>
                      <Form.Control
                        type="tel"
                        value={customShipping.phone}
                        onChange={(event) =>
                          setCustomShipping((prev) => ({
                            ...prev,
                            phone: sanitizePhone(event.target.value)
                          }))
                        }
                        placeholder="เบอร์โทร"
                      />
                    </Form.Group>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={customShipping.address}
                    onChange={(event) =>
                      setCustomShipping((prev) => ({ ...prev, address: event.target.value }))
                    }
                    placeholder="เช่น 90/12 หมู่บ้านแสงสว่าง ซอยสุขสันต์ แขวงตลาด นนทบุรี 11000"
                    className="shipping-textarea"
                  />
                </>
              )}
              <Button
                type="button"
                variant="link"
                className="manage-address-link"
                onClick={() => navigate('/profile?tab=addresses')}
              >
                <i className="bi bi-pencil-square me-1"></i>
                จัดการที่อยู่จัดส่ง
              </Button>
            </div>
          </div>

          <div className="cart-card">
            <header className="cart-card__header">
              <div>
                <h2>วิธีการชำระเงิน</h2>
                <p>เลือกรูปแบบการชำระเงินที่เหมาะกับงบประมาณของคุณ</p>
              </div>
            </header>
            <div className="cart-card__body cart-card__body--payment">
              <div className="payment-options">
                <button
                  type="button"
                  className={`payment-pill${paymentMethod === 'cash' ? ' active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  ชำระเต็มจำนวน
                </button>
                <button
                  type="button"
                  className={`payment-pill${paymentMethod === 'installment' ? ' active' : ''}`}
                  onClick={() => setPaymentMethod('installment')}
                >
                  ผ่อนชำระ
                </button>
              </div>
              {paymentMethod === 'installment' && (
                <div className="installment-picker">
                  <label htmlFor="installmentPeriods">จำนวนงวดที่ต้องการ</label>
                  <Form.Select
                    id="installmentPeriods"
                    value={installmentPeriods}
                    onChange={(event) => setInstallmentPeriods(parseInt(event.target.value, 10))}
                  >
                    <option value={2}>2 งวด </option>
                    <option value={3}>3 งวด </option>
                    <option value={4}>4 งวด </option>
                    <option value={5}>5 งวด </option>
                    <option value={6}>6 งวด </option>
                    <option value={7}>7 งวด </option>
                    <option value={8}>8 งวด </option>
                    <option value={9}>9 งวด </option>
                    <option value={10}>10 งวด </option>
                    <option value={11}>11 งวด </option>
                    <option value={12}>12 งวด </option>
                  </Form.Select>
                </div>
              )}
              <div className="summary-footer">
                <div className="summary-footer__info">
                  <span>
                    เลือกแล้ว <strong>{selectedCount}</strong> รายการ
                  </span>
                  <div className="summary-footer__breakdown">
                    <div className="summary-footer__row">
                      <span>ยอดรวมสินค้า</span>
                      <span>฿{Math.round(subtotalExcludeVat).toLocaleString()}</span>
                    </div>
                    <div className="summary-footer__row">
                      <span>ค่าจัดส่ง</span>
                      <span>฿{shippingFee.toLocaleString()}</span>
                    </div>
                    <div className="summary-footer__row">
                      <span>ภาษีมูลค่าเพิ่ม (7%)</span>
                      <span>฿{Math.round(vatAmount).toLocaleString()}</span>
                    </div>
                    {paymentMethod === 'installment' && (
                      <div className="summary-footer__row">
                        <span>จำนวนงวด</span>
                        <span>{normalizedInstallmentPeriods} เดือน</span>
                      </div>
                    )}
                    {paymentMethod === 'installment' && (
                      <div className="summary-footer__row summary-footer__row--total">
                        <span>ราคาต่องวด</span>
                        <strong>฿{roundedInstallmentAmount.toLocaleString()}</strong>
                      </div>
                    )}
                    <div className="summary-footer__row summary-footer__row--total">
                      <span>ยอดรวมสุทธิ</span>
                      <strong>฿{Math.round(netTotal).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                className="summary-footer__button"
                onClick={handleSubmitOrder}
                disabled={isSubmitDisabled}
              >
                {isSubmitDisabled ? 'เลือกสินค้าเพื่อสั่งซื้อ' : 'ยืนยันคำสั่งซื้อ'}
              </Button>
            </div>
          </div>
        </section>

        {submitAlert.show && (
          <Alert
            variant={submitAlert.variant}
            onClose={() => setSubmitAlert({ show: false, variant: 'info', message: '' })}
            dismissible
            className="summary-alert"
          >
            {submitAlert.message}
          </Alert>
        )}
      </Container>
    </div>
  );
}

