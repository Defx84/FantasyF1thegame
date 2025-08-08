import React, { useState, useEffect } from 'react';
import { FaUser, FaPalette, FaUndo, FaEye, FaDownload } from 'react-icons/fa';
import IconWrapper from '../../utils/iconWrapper';
import { avatarService, UserAvatar, AvatarUpdateRequest } from '../../services/avatarService';
import AvatarImage from './AvatarImage';
import HelmetImageEditor from './HelmetImageEditor';
import { helmetTemplates } from './HelmetImageEditor';

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
    helmetTemplateId: 1,
    helmetColors: {
      primary: '#FF0000',   // Red for main helmet body
      secondary: '#00FF00', // Green for patterns/stripes
      accent: '#0000FF'     // Blue for accent areas
    },
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

  const handleColorChange = (colorKey: 'primary' | 'secondary' | 'accent', value: string) => {
    setTestConfig(prev => ({
      ...prev,
      helmetColors: {
        ...prev.helmetColors!,
        [colorKey]: value
      }
    }));
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Template</label>
            <select
              value={testConfig.helmetTemplateId || ''}
              onChange={(e) => handleTestConfigChange('helmetTemplateId', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white focus:outline-none focus:border-red-500"
            >
              {helmetTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
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

          {/* Primary Color */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Primary Color</label>
            <input
              type="color"
              value={testConfig.helmetColors?.primary || '#FF0000'}
              onChange={(e) => handleColorChange('primary', e.target.value)}
              className="w-full h-10 bg-white/20 border border-white/30 rounded cursor-pointer"
            />
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Secondary Color</label>
            <input
              type="color"
              value={testConfig.helmetColors?.secondary || '#00FF00'}
              onChange={(e) => handleColorChange('secondary', e.target.value)}
              className="w-full h-10 bg-white/20 border border-white/30 rounded cursor-pointer"
            />
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Accent Color</label>
            <input
              type="color"
              value={testConfig.helmetColors?.accent || '#0000FF'}
              onChange={(e) => handleColorChange('accent', e.target.value)}
              className="w-full h-10 bg-white/20 border border-white/30 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <h4 className="text-sm font-semibold text-white/90 mb-3">Live Preview</h4>
          <div className="flex justify-center">
            <HelmetImageEditor 
              helmetTemplateId={testConfig.helmetTemplateId || 1}
              helmetColors={{
                primary: testConfig.helmetColors?.primary || '#808080',
                secondary: testConfig.helmetColors?.secondary || '#808080',
                accent: testConfig.helmetColors?.accent || '#808080'
              }}
              helmetNumber={testConfig.helmetNumber || '-'}
              size={200}
              onImageGenerated={setGeneratedImageUrl}
            />
          </div>
          
          {/* Download Button */}
          {generatedImageUrl && (
            <div className="mt-4 flex justify-center">
              <a
                href={generatedImageUrl}
                download={`helmet-${testConfig.helmetTemplateId}-${testConfig.helmetNumber}.png`}
                className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-xs"
              >
                <IconWrapper icon={FaDownload} size={12} className="mr-1" />
                Download
              </a>
            </div>
          )}
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
                <AvatarImage key={`${user.id}-${refreshKey}`} userId={user.id} username={user.username} size={48} />
                <div>
                  <div className="text-white/90 font-semibold">{user.username}</div>
                  <div className="text-xs text-white/70">
                    Template: {user.avatar.helmetTemplateId || 'None'} | 
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