import React, { useState, useEffect } from 'react';
import { avatarService } from '../../services/avatarService';
import CallingCard from './CallingCard';

interface AvatarImageProps {
  userId: string;
  username: string;
  size?: number;
  className?: string;
}

const AvatarImage: React.FC<AvatarImageProps> = ({ 
  userId, 
  username, 
  size = 48,
  className = '' 
}) => {
  const [avatarData, setAvatarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvatarData();
  }, [userId]);

  const loadAvatarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's avatar configuration
      const response = await avatarService.getUserAvatar(userId);
      setAvatarData(response.avatar);
      setLoading(false);
    } catch (err) {
      console.error('Error loading avatar data:', err);
      setError('Failed to load avatar');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className={`bg-gray-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ width: size, height: size * 0.8 }}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-center text-xs ${className}`}
        style={{ width: size, height: size * 0.8 }}
      >
        Error
      </div>
    );
  }

  // If user has a customized avatar, show the calling card
  if (avatarData?.isCustomized && avatarData?.helmetPresetId) {
    return (
      <CallingCard
        helmetPresetId={avatarData.helmetPresetId}
        helmetNumber={avatarData.helmetNumber}
        size={size}
        className={className}
      />
    );
  }

  // Default avatar (grey helmet with dash)
  return (
    <div 
      className={`bg-gray-400 rounded-lg flex items-center justify-center ${className}`}
      style={{ width: size, height: size * 0.8 }}
    >
      <span className="text-white font-bold text-xs">-</span>
    </div>
  );
};

export default AvatarImage; 