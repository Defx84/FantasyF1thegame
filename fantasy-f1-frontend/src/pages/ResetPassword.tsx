import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { api } from '../services/api';

// Define types for form fields
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// Define types for IconWrapper props
interface IconWrapperProps {
  icon: React.ElementType; // ✅ Correct type
  size?: number;
  className?: string;
}

// IconWrapper component
const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, size = 24, className = '' }) => {
  if (!Icon) return null;

  const TypedIcon = Icon as unknown as React.FC<{ size?: number; className?: string }>;

  return (
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <TypedIcon size={size} className={`text-gray-400 ${className}`} />
    </div>
  );
};

// ResetPassword page component
const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/api/auth/reset-password', {
        token,
        email: data.email,
        password: data.password,
      });

      if (response.status !== 200) {
        const errorData = response.data;
        throw new Error(errorData.message || 'Failed to reset password.');
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="relative">
            <IconWrapper icon={FaEnvelope} />
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              placeholder="Email address"
              className="appearance-none rounded relative block w-full pl-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="relative">
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              placeholder="New password"
              className="appearance-none rounded relative block w-full py-2 px-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="relative">
            <input
              type="password"
              {...register('confirmPassword', { required: 'Please confirm your password' })}
              placeholder="Confirm new password"
              className="appearance-none rounded relative block w-full py-2 px-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
