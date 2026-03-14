const API = '/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchApi(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...getHeaders(), ...options.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText || 'Request failed');
  return data;
}

export const authApi = {
  signup: (body) => fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email) => fetchApi('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body) => fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  me: () => fetchApi('/auth/me'),
  logout: () => fetchApi('/auth/logout', { method: 'POST' }),
};

export const dashboardApi = {
  kpis: (params) => fetchApi('/dashboard/kpis?' + new URLSearchParams(params || {})),
};

export const warehouseApi = {
  list: () => fetchApi('/warehouses'),
  create: (body) => fetchApi('/warehouses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => fetchApi(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchApi(`/warehouses/${id}`, { method: 'DELETE' }),
};

export const productApi = {
  list: (params) => fetchApi('/products?' + new URLSearchParams(params || {})),
  categories: () => fetchApi('/products/categories'),
  get: (id) => fetchApi(`/products/${id}`),
  create: (body) => fetchApi('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
};

export const receiptApi = {
  list: (params) => fetchApi('/receipts?' + new URLSearchParams(params || {})),
  get: (id) => fetchApi(`/receipts/${id}`),
  create: (body) => fetchApi('/receipts', { method: 'POST', body: JSON.stringify(body) }),
  validate: (id) => fetchApi(`/receipts/${id}/validate`, { method: 'POST' }),
};

export const deliveryApi = {
  list: (params) => fetchApi('/deliveries?' + new URLSearchParams(params || {})),
  get: (id) => fetchApi(`/deliveries/${id}`),
  create: (body) => fetchApi('/deliveries', { method: 'POST', body: JSON.stringify(body) }),
  validate: (id) => fetchApi(`/deliveries/${id}/validate`, { method: 'POST' }),
};

export const transferApi = {
  list: (params) => fetchApi('/transfers?' + new URLSearchParams(params || {})),
  get: (id) => fetchApi(`/transfers/${id}`),
  create: (body) => fetchApi('/transfers', { method: 'POST', body: JSON.stringify(body) }),
  validate: (id) => fetchApi(`/transfers/${id}/validate`, { method: 'POST' }),
};

export const adjustmentApi = {
  list: (params) => fetchApi('/adjustments?' + new URLSearchParams(params || {})),
  get: (id) => fetchApi(`/adjustments/${id}`),
  create: (body) => fetchApi('/adjustments', { method: 'POST', body: JSON.stringify(body) }),
  apply: (id) => fetchApi(`/adjustments/${id}/apply`, { method: 'POST' }),
};

export const movementApi = {
  list: (params) => fetchApi('/movements?' + new URLSearchParams(params || {})),
};
