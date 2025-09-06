import axios, { AxiosInstance } from 'axios';

if (!process.env.REACT_APP_API_BASE_URL) {
  throw new Error('REACT_APP_API_BASE_URL is not set!');
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for httpOnly cookies
});

// Track if we're currently refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add a response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.status === 200) {
          // Store the new token in localStorage
          if (response.data.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
          }
          processQueue(null, response.data.accessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Don't redirect automatically - let components handle auth failures
        // This prevents infinite loops
        console.log('Token refresh failed, authentication required');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Add a request interceptor to include the JWT token in headers
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      // Add Authorization header with Bearer token
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Sending token for request:', config.url);
      console.log('[API] Token value:', token);
      console.log('[API] Token type:', typeof token);
      console.log('[API] Token length:', token ? token.length : 0);
    } else {
      console.warn('[API] No valid access token found in localStorage for request:', config.url);
      console.warn('[API] Token value was:', token);
      console.warn('[API] Token type:', typeof token);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api }; 