import React, { useState, useEffect } from 'react';
import { avatarService, UserAvatar } from '../../services/avatarService';

interface AvatarProps {
  userId: string;
  username: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ userId, username, size = 64, className = '' }) => {
  const [helmetUrl, setHelmetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHelmet = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get helmet image as data URL
        const dataUrl = await avatarService.getHelmetImageDataUrl(userId, size);
        setHelmetUrl(dataUrl);
      } catch (err) {
        console.error('Error loading helmet:', err);
        setError('Failed to load helmet');
      } finally {
        setLoading(false);
      }
    };

    loadHelmet();
  }, [userId, size]);

  if (loading) {
    return (
      <div 
        className={`bg-gray-300 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`bg-gray-300 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        title={`${username} (Error loading helmet)`}
      >
        <span className="text-gray-600 text-xs">?</span>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <img
        src={helmetUrl || ''}
        alt={`${username}'s helmet`}
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-gray-300"
        title={username}
      />
    </div>
  );
};

export default Avatar; 