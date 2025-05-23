// Environment variable type declaration
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_BASE_URL?: string;
      REACT_APP_ENV?: string;
    }
  }
}

// Environment configuration
export const ENV: string = process.env.REACT_APP_ENV || 'development';
export const IS_PRODUCTION: boolean = ENV === 'production';

// API configuration
if (!process.env.REACT_APP_API_BASE_URL) {
  throw new Error('REACT_APP_API_BASE_URL is not set!');
}
export const API_BASE_URL: string = process.env.REACT_APP_API_BASE_URL;

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: IS_PRODUCTION,
  ENABLE_ERROR_TRACKING: IS_PRODUCTION,
};

// Ensure this file is treated as a module
export {}; 