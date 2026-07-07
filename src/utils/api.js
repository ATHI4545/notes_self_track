import { getAuth } from 'firebase/auth';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

async function getIdToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function request(path, options = {}) {
  const token = await getIdToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  } catch (err) {
    throw new Error(err.message || 'Network request failed');
  }
}

export const api = {
  get:    (path, opts = {})      => request(path, { method: 'GET',    ...opts }),
  post:   (path, body, opts = {}) => request(path, { method: 'POST',   body: JSON.stringify(body), ...opts }),
  patch:  (path, body, opts = {}) => request(path, { method: 'PATCH',  body: JSON.stringify(body), ...opts }),
  delete: (path, opts = {})      => request(path, { method: 'DELETE', ...opts }),
};

export const chatApi = {
  send: (messages) => api.post('/chat', { messages }),
};
