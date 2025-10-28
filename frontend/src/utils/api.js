import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry logic
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    if (config.retry < 3 && error.response?.status >= 500) {
      config.retry += 1;
      await new Promise(resolve => setTimeout(resolve, 1000 * config.retry));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

export default api;
