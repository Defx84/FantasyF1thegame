import React, { useState, useEffect } from 'react';
import { FaUser, FaPalette, FaUndo, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import IconWrapper from '../../utils/iconWrapper';
import { avatarService, UserAvatar, AvatarUpdateRequest } from '../../services/avatarService';
import CallingCard from './CallingCard';

const AvatarTestingPanel: React.FC = () => {
  const [users, setUsers] = useState<UserAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAvatar | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Test configuration
  const [testConfig, setTestConfig] = useState<AvatarUpdateRequest>({
    helmetPresetId: 1,
    helmetNumber: '44'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await avatarService.getAllUsersAvatars();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvatar = async (userId: string) => {
    try {
      setUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(null);

      await avatarService.updateUserAvatar(userId, testConfig);
      setUpdateSuccess('Avatar updated successfully!');
      
      // Refresh users list and force avatar refresh
      await loadUsers();
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Error updating avatar:', err);
      setUpdateError(err.response?.data?.error || 'Failed to update avatar');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetAvatar = async (userId: string) => {
    try {
      setUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(null);

      await avatarService.resetUserAvatar(userId);
      setUpdateSuccess('Avatar reset to default!');
      
      // Refresh users list and force avatar refresh
      await loadUsers();
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Error resetting avatar:', err);
      setUpdateError(err.response?.data?.error || 'Failed to reset avatar');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestConfigChange = (field: keyof AvatarUpdateRequest, value: any) => {
    setTestConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHelmetChange = (direction: 'prev' | 'next') => {
    setTestConfig(prev => {
      const currentPreset = prev.helmetPresetId || 1;
      let newPreset;
      
      if (direction === 'prev') {
        newPreset = currentPreset > 1 ? currentPreset - 1 : 5;
      } else {
        newPreset = currentPreset < 5 ? currentPreset + 1 : 1;
      }
      
      return {
        ...prev,
        helmetPresetId: newPreset
      };
    });
  };



  if (loading) {
    return (
      <div className="text-white/70 flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/70"></div>
        <span className="ml-3">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Configuration Panel */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                 <h3 className="text-lg font-bold mb-4 text-white/90 flex items-center">
           <IconWrapper icon={FaPalette} size={16} className="mr-2" />
           Test Configuration (v1.1)
         </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Helmet Preset Selection */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Helmet Preset</label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleHelmetChange('prev')}
                className="p-2 bg-white/20 border border-white/30 rounded text-white hover:bg-white/30 transition-colors"
                title="Previous helmet"
              >
                <IconWrapper icon={FaChevronLeft} size={16} />
              </button>
              
              <div className="flex-1 text-center">
                <span className="text-white font-semibold">Preset {testConfig.helmetPresetId || 1}</span>
              </div>
              
              <button
                onClick={() => handleHelmetChange('next')}
                className="p-2 bg-white/20 border border-white/30 rounded text-white hover:bg-white/30 transition-colors"
                title="Next helmet"
              >
                <IconWrapper icon={FaChevronRight} size={16} />
              </button>
            </div>
          </div>

          {/* Helmet Number */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Number</label>
            <input
              type="text"
              value={testConfig.helmetNumber || ''}
              onChange={(e) => handleTestConfigChange('helmetNumber', e.target.value)}
              placeholder="44"
              maxLength={2}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <h4 className="text-sm font-semibold text-white/90 mb-3">Live Preview</h4>
          <div className="flex justify-center">
            <CallingCard 
              helmetPresetId={testConfig.helmetPresetId || 1}
              helmetNumber={testConfig.helmetNumber || '-'}
              size={200}
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-lg font-bold mb-4 text-white/90 flex items-center">
          <IconWrapper icon={FaUser} size={16} className="mr-2" />
          Users ({users.length})
        </h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between bg-white/10 p-3 rounded-lg border border-white/10"
            >
                                           <div className="flex items-center space-x-3">
                <CallingCard key={`${user.id}-${refreshKey}`} helmetPresetId={user.avatar.helmetPresetId || 1} helmetNumber={user.avatar.helmetNumber} size={48} />
                <div>
                  <div className="text-white/90 font-semibold">{user.username}</div>
                  <div className="text-xs text-white/70">
                    Preset: {user.avatar.helmetPresetId || 'None'} | 
                    Number: {user.avatar.helmetNumber} | 
                    Customized: {user.avatar.isCustomized ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdateAvatar(user.id)}
                  disabled={updating}
                  className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm disabled:opacity-50"
                  title="Apply test configuration"
                >
                  <IconWrapper icon={FaEye} size={12} className="mr-1" />
                  Test
                </button>
                <button
                  onClick={() => handleResetAvatar(user.id)}
                  disabled={updating}
                  className="flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm disabled:opacity-50"
                  title="Reset to default"
                >
                  <IconWrapper icon={FaUndo} size={12} className="mr-1" />
                  Reset
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Status Messages */}
        {updateSuccess && (
          <div className="mt-4 text-green-400 text-sm bg-green-500/10 p-2 rounded-lg border border-green-500/20">
            {updateSuccess}
          </div>
        )}
        {updateError && (
          <div className="mt-4 text-red-500 text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {updateError}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarTestingPanel; 