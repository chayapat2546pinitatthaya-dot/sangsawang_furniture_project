import axios from 'axios';

const normalizeCartItems = (items) =>
  Array.isArray(items)
    ? items.map((item) => {
        const resolveBasePrice = () => {
          const raw =
            item.basePrice ??
            item.base_price ??
            (item.pricingType === 'cashPromo' || item.pricing_type === 'cashPromo'
              ? item.price_cash
              : item.pricingType === 'installmentPromo' || item.pricing_type === 'installmentPromo'
              ? item.price_installment
              : null);
          if (raw == null) {
            return null;
          }
          const parsed = Number(raw);
          return Number.isFinite(parsed) ? parsed : null;
        };

        return {
          ...item,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0) || 0,
          pricingLabel: item.pricingLabel ?? '',
          pricingType: item.pricingType ?? item.pricing_type ?? 'cash',
          product_id: item.product_id,
          product_name: item.product_name,
        product_image: item.product_image ?? item.productImage ?? '',
        product_images: Array.isArray(item.product_images)
          ? item.product_images
              .map((img) => (img == null ? '' : String(img).trim()))
              .filter(Boolean)
          : item.product_image
          ? [String(item.product_image).trim()]
          : [],
          product_price: Number(item.product_price ?? item.unitPrice ?? 0) || 0,
          basePrice: resolveBasePrice()
        };
      })
    : [];

const handleCartError = (error) => {
  if (error?.response && (error.response.status === 401 || error.response.status === 403)) {
    return { items: [], unauthorized: true };
  }
  console.error('Cart API error:', error);
  return { items: [], error: true };
};

export const calculateCartCount = (items) =>
  Array.isArray(items)
    ? items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    : 0;

export const notifyCartUpdate = (items, { silent = false } = {}) => {
  const count = calculateCartCount(items);
  window.dispatchEvent(
    new CustomEvent('cartUpdated', {
      detail: { count, silent }
    })
  );
};

export const fetchCartItems = async () => {
  try {
    const { data } = await axios.get('/api/cart');
    return { items: normalizeCartItems(data?.items), unauthorized: false };
  } catch (error) {
    return handleCartError(error);
  }
};

export const upsertCartItem = async (payload) => {
  try {
    const { data } = await axios.put('/api/cart/items', payload);
    return { items: normalizeCartItems(data?.items), unauthorized: false };
  } catch (error) {
    return handleCartError(error);
  }
};

export const deleteCartItem = async (payload) => {
  try {
    const { data } = await axios.delete('/api/cart/items', { data: payload });
    return { items: normalizeCartItems(data?.items), unauthorized: false };
  } catch (error) {
    return handleCartError(error);
  }
};

export const clearCart = async () => {
  try {
    const { data } = await axios.delete('/api/cart');
    return { items: normalizeCartItems(data?.items), unauthorized: false };
  } catch (error) {
    return handleCartError(error);
  }
};

