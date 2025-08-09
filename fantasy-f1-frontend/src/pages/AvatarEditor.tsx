import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaSave, FaTimes, FaUser } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { avatarService, AvatarUpdateRequest } from '../services/avatarService';
import CallingCard from '../components/Avatar/CallingCard';
import AppLayout from '../components/AppLayout';

const AvatarEditor: React.FC = () => {
  const navigate = useNavigate();
  const [currentPreset, setCurrentPreset] = useState(1);
  const [helmetNumber, setHelmetNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID from localStorage or context
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      setUserId(currentUserId);
      // Load current avatar settings
      loadCurrentAvatar(currentUserId);
    }
  }, []);

  const loadCurrentAvatar = async (uid: string) => {
    try {
      const response = await avatarService.getUserAvatar(uid);
      if (response.avatar.isCustomized) {
        setCurrentPreset(response.avatar.helmetPresetId || 1);
        setHelmetNumber(response.avatar.helmetNumber || '');
      }
    } catch (error) {
      console.error('Error loading current avatar:', error);
    }
  };

  const handleHelmetChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPreset(prev => prev > 1 ? prev - 1 : 22);
    } else {
      setCurrentPreset(prev => prev < 22 ? prev + 1 : 1);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const updateData: AvatarUpdateRequest = {
        helmetPresetId: currentPreset,
        helmetNumber: helmetNumber || '-'
      };

      await avatarService.updateUserAvatar(userId, updateData);
      navigate('/profile'); // Return to profile page
    } catch (error) {
      console.error('Error saving avatar:', error);
      alert('Failed to save avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <AppLayout>
      <div 
        className="min-h-screen flex flex-col relative"
        style={{
          backgroundImage: 'url("/profile.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Background Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-30 z-0" />
        {/* Save/Cancel buttons - floating */}
        <div className="fixed top-20 right-4 z-40 flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-lg backdrop-blur-sm"
          >
            <IconWrapper icon={FaTimes} size={16} />
            <span>Cancel</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-lg backdrop-blur-sm"
          >
            <IconWrapper icon={FaSave} size={16} />
            <span>{saving ? 'Saving...' : 'Save Avatar'}</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 pt-16">
        <div className="max-w-4xl w-full">
          {/* Page Title */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <IconWrapper icon={FaUser} size={32} className="text-red-500" />
              <h1 className="text-5xl font-bold text-white">Choose Your Avatar</h1>
            </div>
          </div>
          
          {/* Helmet Display Section */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-8">Helmet {currentPreset}</h2>
            
            {/* Navigation Arrows */}
            <div className="flex items-center justify-center space-x-8 mb-8">
              <button
                onClick={() => handleHelmetChange('prev')}
                className="p-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white transition-all duration-200 hover:scale-110"
                title="Previous helmet"
              >
                <IconWrapper icon={FaChevronLeft} size={32} />
              </button>
              
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-2">
                  {currentPreset}
                </div>
                <div className="text-white/70 text-sm">
                  of 22 helmets
                </div>
              </div>
              
              <button
                onClick={() => handleHelmetChange('next')}
                className="p-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white transition-all duration-200 hover:scale-110"
                title="Next helmet"
              >
                <IconWrapper icon={FaChevronRight} size={32} />
              </button>
            </div>
          </div>

          {/* Helmet Preview */}
          <div className="flex justify-center mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <CallingCard
                helmetPresetId={currentPreset}
                helmetNumber={helmetNumber || '-'}
                size={400}
              />
            </div>
          </div>

          {/* Number Input Section */}
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <label className="block text-lg font-semibold text-white mb-4 text-center">
                Choose Your Number
              </label>
              
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={helmetNumber}
                  onChange={(e) => setHelmetNumber(e.target.value)}
                  placeholder="44"
                  maxLength={2}
                  className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white text-center text-xl font-bold placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                
                <button
                  onClick={() => setHelmetNumber('')}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="mt-4 text-center text-white/70 text-sm">
                Enter 1-2 characters (letters, numbers, or dash)
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
   );
 };

export default AvatarEditor;
