import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidNewPassword, PASSWORD_RULE_MESSAGE } from '../utils/passwordPolicy';

// Define types for form fields
interface FormData {
  password: string;
  confirmPassword: string;
}





// ResetPassword page component
const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const canChangeWhileSignedIn = !token && !!user;

  // Email links carry a token. Signed-in users can set a new password without one.
  useEffect(() => {
    if (authLoading) return;
    if (!token && !user) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token, user, authLoading]);

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = token
        ? await api.post('/api/auth/reset-password', {
            token,
            newPassword: data.password,
          })
        : await api.post('/api/auth/change-password', {
            newPassword: data.password,
          });

      if (response.status !== 200) {
        const errorData = response.data;
        throw new Error(errorData.error || errorData.message || 'Failed to reset password.');
      }

      if (token) {
        navigate('/');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong.';
      setError(message);
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
            {canChangeWhileSignedIn
              ? 'Choose a new password and confirm it.'
              : 'Enter your new password below.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-8 space-y-6">
            <div className="bg-green-100 text-green-800 px-4 py-3 rounded text-center">
              Your password has been updated.
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Back to profile
            </button>
          </div>
        ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="relative">
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                validate: (value) => isValidNewPassword(value) || PASSWORD_RULE_MESSAGE
              })}
              placeholder="New password"
              className="appearance-none rounded relative block w-full py-2 px-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            <p className="text-gray-500 text-xs mt-1">
              At least 6 characters, with one capital letter, one number, and one special character.
            </p>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="relative">
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value, formValues) =>
                  value === formValues.password || 'Passwords do not match.'
              })}
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
              disabled={loading || authLoading || (!token && !user)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
