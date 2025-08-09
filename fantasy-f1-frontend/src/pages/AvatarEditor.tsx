import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaSave, FaTimes, FaUser } from 'react-icons/fa';
import IconWrapper from '../utils/iconWrapper';
import { avatarService, AvatarUpdateRequest } from '../services/avatarService';
import CallingCard from '../components/Avatar/CallingCard';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

const AvatarEditor: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPreset, setCurrentPreset] = useState(1);
  const [helmetNumber, setHelmetNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHelmetModal, setShowHelmetModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    // Load current avatar settings when user is available
    if (user?.id) {
      loadCurrentAvatar(user.id);
    }
  }, [user]);

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
      setCurrentPreset(prev => prev > 1 ? prev - 1 : 30);
    } else {
      setCurrentPreset(prev => prev < 30 ? prev + 1 : 1);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const updateData: AvatarUpdateRequest = {
        helmetPresetId: currentPreset,
        helmetNumber: helmetNumber || '-'
      };

      await avatarService.updateUserAvatar(user.id, updateData);
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

  const handleNumberChange = (value: string) => {
    // Only allow numbers, max 2 digits, format as 01, 02, etc. or 1, 2, etc.
    const numericValue = value.replace(/\D/g, ''); // Remove non-digits
    
    if (numericValue === '') {
      setHelmetNumber('');
      return;
    }
    
    const num = parseInt(numericValue);
    if (num < 1 || num > 99) return; // Only allow 1-99
    
    // Format as 01, 02, etc. for single digits, or 10, 11, etc. for double digits
    const formatted = num < 10 ? `0${num}` : num.toString();
    setHelmetNumber(formatted);
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input
    if (value === '') {
      setHelmetNumber('');
      return;
    }
    
    // Only allow numeric input, max 2 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 2);
    
    if (numericValue === '') {
      setHelmetNumber('');
      return;
    }
    
    const num = parseInt(numericValue);
    
    // Allow numbers 1-99
    if (num >= 1 && num <= 99) {
      // For single digit, don't auto-format to 0X until user finishes typing
      // For double digit, use as-is
      if (numericValue.length === 1) {
        setHelmetNumber(numericValue); // Store as "1", "2", etc.
      } else {
        setHelmetNumber(numericValue); // Store as "15", "99", etc.
      }
    }
  };

  const handleNumberBlur = () => {
    // Format with leading zero only when user finishes editing (onBlur)
    if (helmetNumber && helmetNumber.length === 1) {
      const num = parseInt(helmetNumber);
      if (num >= 1 && num <= 9) {
        setHelmetNumber(`0${num}`);
      }
    }
  };

  return (
    <AppLayout>
      {/* Background Image */}
      <div
        className="fixed inset-0 w-full h-full z-0"
        style={{
          backgroundImage: 'url("/profile.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-0" />

      <div className="min-h-screen flex flex-col relative z-10">


        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-16 min-h-screen">
        <div className="max-w-4xl w-full h-full flex flex-col justify-center">
          {/* Page Title */}
          <div className="text-center mb-3 sm:mb-4">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2">
              <IconWrapper icon={FaUser} size={18} className="text-red-500 sm:hidden" />
              <IconWrapper icon={FaUser} size={20} className="text-red-500 hidden sm:block" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Choose Your Avatar</h1>
            </div>
          </div>
          
          {/* Helmet Display Section */}
          <div className="text-center mb-3 sm:mb-4">
            <button
              onClick={() => setShowGallery(true)}
              className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 hover:text-red-400 transition-colors cursor-pointer"
              title="View all helmets"
            >
              Gallery 📖
            </button>
            
            {/* Navigation Arrows */}
            <div className="flex items-center justify-center space-x-4 sm:space-x-6 mb-3 sm:mb-4">
              <button
                onClick={() => handleHelmetChange('prev')}
                className="p-3 sm:p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/30 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                title="Previous helmet"
              >
                <IconWrapper icon={FaChevronLeft} size={20} className="sm:hidden" />
                <IconWrapper icon={FaChevronLeft} size={24} className="hidden sm:block" />
              </button>
              
              <div className="text-center min-w-0 flex-shrink-0">
                <div className="text-2xl sm:text-4xl font-bold text-white mb-1">
                  {currentPreset}
                </div>
                <div className="text-white/70 text-xs">
                  of 30 helmets
                </div>
              </div>
              
              <button
                onClick={() => handleHelmetChange('next')}
                className="p-3 sm:p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/30 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                title="Next helmet"
              >
                <IconWrapper icon={FaChevronRight} size={20} className="sm:hidden" />
                <IconWrapper icon={FaChevronRight} size={24} className="hidden sm:block" />
              </button>
            </div>
          </div>

          {/* Helmet Preview and Number Input - Responsive Layout */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
            {/* Helmet Preview - Clickable */}
            <div 
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/20 relative cursor-pointer hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
              onClick={() => setShowHelmetModal(true)}
              title="Click to view full size"
            >
              <div className="flex justify-center">
                <img
                  src={`/images/helmets/preset-${currentPreset}.png`}
                  alt={`Helmet Preset ${currentPreset}`}
                  className="w-36 h-36 sm:w-48 sm:h-48 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="flex items-center justify-center w-36 h-36 sm:w-48 sm:h-48 text-white/40">
                        <div class="text-center">
                          <div class="text-3xl sm:text-4xl mb-2">🏁</div>
                          <div class="text-xs sm:text-sm">Helmet ${currentPreset}</div>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
              
              {/* Number Badge */}
              {helmetNumber && helmetNumber !== '' && (
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg border-2 border-white">
                    {helmetNumber}
                  </div>
                </div>
              )}
              
              {/* Tap indicator - Bottom */}
              <div className="absolute bottom-2 left-2 opacity-60">
                <div className="bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="text-white text-xs">👆 Tap to enlarge</span>
                </div>
              </div>
            </div>

            {/* Number Input Section - Mobile Optimized */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/20 w-40 sm:w-48">
              <label className="block text-xs sm:text-sm font-semibold text-white mb-2 text-center">
                Choose Your Number
              </label>
              
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={helmetNumber}
                onChange={handleNumberInputChange}
                onBlur={handleNumberBlur}
                onFocus={(e) => e.target.select()} // Select all text when focused for easy replacement
                placeholder="01"
                maxLength={2}
                className="w-full px-3 py-2 sm:py-3 bg-white/20 border border-white/30 rounded-lg text-white text-center text-lg sm:text-xl font-bold placeholder-white/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 touch-manipulation"
              />
              
              <div className="mt-1 text-center text-white/70 text-xs">
                Numbers 1-99
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto px-6 py-3 sm:py-3 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-base font-medium touch-manipulation"
            >
              <IconWrapper icon={FaTimes} size={16} />
              <span>Cancel</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 sm:py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-800 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-base font-medium touch-manipulation"
            >
              <IconWrapper icon={FaSave} size={16} />
              <span>{saving ? 'Saving...' : 'Save Avatar'}</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Helmet Modal - Full Screen View */}
      {showHelmetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHelmetModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 max-w-md w-full">
            {/* Close Button */}
            <button
              onClick={() => setShowHelmetModal(false)}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors touch-manipulation"
              title="Close"
            >
              <IconWrapper icon={FaTimes} size={20} />
            </button>
            
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white">Helmet {currentPreset}</h3>
              <p className="text-white/70 text-sm">Full Size Preview</p>
            </div>
            
            {/* Large Helmet Image */}
            <div className="flex justify-center mb-4 relative">
              <img
                src={`/images/helmets/preset-${currentPreset}.png`}
                alt={`Helmet Preset ${currentPreset}`}
                className="w-72 h-72 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="flex items-center justify-center w-72 h-72 text-white/40">
                      <div class="text-center">
                        <div class="text-6xl mb-4">🏁</div>
                        <div class="text-lg">Helmet ${currentPreset}</div>
                      </div>
                    </div>
                  `;
                }}
              />
              
              {/* Large Number Badge */}
              {helmetNumber && helmetNumber !== '' && (
                <div className="absolute bottom-8 right-8">
                  <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-lg font-bold shadow-lg border-4 border-white">
                    {helmetNumber}
                  </div>
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="text-center">
              <p className="text-white/80 text-sm">
                {helmetNumber ? `Your number: ${helmetNumber}` : 'No number selected'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal - All Helmets */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowGallery(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors touch-manipulation z-10"
              title="Close"
            >
              <IconWrapper icon={FaTimes} size={20} />
            </button>
            
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white">Helmet Gallery</h3>
              <p className="text-white/70 text-sm">Choose from 30 available helmets</p>
            </div>
            
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((presetId) => (
                <div
                  key={presetId}
                  className={`relative bg-white/5 backdrop-blur-sm rounded-xl p-3 border transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-white/10 ${
                    currentPreset === presetId 
                      ? 'border-red-500 bg-red-500/10' 
                      : 'border-white/20'
                  }`}
                  onClick={() => {
                    setCurrentPreset(presetId);
                    setShowGallery(false);
                  }}
                  title={`Select Helmet ${presetId}`}
                >
                  <img
                    src={`/images/helmets/preset-${presetId}.png`}
                    alt={`Helmet ${presetId}`}
                    className="w-full aspect-square object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="flex items-center justify-center w-full aspect-square text-white/40">
                          <div class="text-center">
                            <div class="text-2xl mb-1">🏁</div>
                            <div class="text-xs">${presetId}</div>
                          </div>
                        </div>
                      `;
                    }}
                  />
                  
                  {/* Helmet Number */}
                  <div className="text-center mt-2">
                    <span className="text-white text-xs font-medium">#{presetId}</span>
                  </div>
                  
                  {/* Selected Indicator */}
                  {currentPreset === presetId && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
   );
 };

export default AvatarEditor;
