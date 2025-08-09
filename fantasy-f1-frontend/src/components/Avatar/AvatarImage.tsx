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

  // Always show default avatar on error or if no avatar data
  if (error || !avatarData) {
    return (
      <CallingCard
        helmetPresetId={0}
        helmetNumber="-"
        size={size}
        className={className}
      />
    );
  }

  // If user has a customized avatar (preset 1-30), show the calling card
  if (avatarData?.isCustomized && avatarData?.helmetPresetId && avatarData.helmetPresetId > 0) {
    return (
      <CallingCard
        helmetPresetId={avatarData.helmetPresetId}
        helmetNumber={avatarData.helmetNumber}
        size={size}
        className={className}
      />
    );
  }

  // Default avatar (preset-00 with dash) - also handles helmetPresetId = 0
  return (
    <CallingCard
      helmetPresetId={0}
      helmetNumber="-"
      size={size}
      className={className}
    />
  );
};

export default AvatarImage; 