import { api } from './api';

export interface HelmetColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface AvatarConfig {
  helmetPattern: number | null;
  helmetColors: HelmetColors;
  helmetNumber: string;
  isCustomized: boolean;
}

export interface UserAvatar {
  id: string;
  username: string;
  avatar: AvatarConfig;
}

export interface AvatarUpdateRequest {
  helmetPattern?: number;
  helmetColors?: Partial<HelmetColors>;
  helmetNumber?: string;
}

class AvatarService {
  private baseUrl = '/api/avatar';

  /**
   * Get all users with avatar data (admin only)
   */
  async getAllUsersAvatars(): Promise<UserAvatar[]> {
    try {
      const response = await api.get(`${this.baseUrl}/users`);
      return response.data.users;
    } catch (error) {
      console.error('Error fetching users avatars:', error);
      throw error;
    }
  }

  /**
   * Get specific user's avatar configuration
   */
  async getUserAvatar(userId: string): Promise<{ avatar: AvatarConfig; username: string }> {
    try {
      const response = await api.get(`${this.baseUrl}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      throw error;
    }
  }

  /**
   * Update user's avatar configuration
   */
  async updateUserAvatar(userId: string, avatarData: AvatarUpdateRequest): Promise<{ avatar: AvatarConfig; username: string }> {
    try {
      const response = await api.put(`${this.baseUrl}/users/${userId}`, avatarData);
      return response.data;
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  /**
   * Reset user's avatar to default
   */
  async resetUserAvatar(userId: string): Promise<{ avatar: AvatarConfig; username: string }> {
    try {
      const response = await api.delete(`${this.baseUrl}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error resetting user avatar:', error);
      throw error;
    }
  }

  /**
   * Get helmet image URL for a user
   */
  getHelmetImageUrl(userId: string, size: number = 128): string {
    return `${api.defaults.baseURL}${this.baseUrl}/users/${userId}/helmet?size=${size}`;
  }

  /**
   * Get helmet image as data URL (for testing)
   */
  async getHelmetImageDataUrl(userId: string, size: number = 128): Promise<string> {
    try {
      const response = await api.get(`${this.baseUrl}/users/${userId}/helmet?size=${size}`, {
        responseType: 'text'
      });
      
      // Convert SVG to data URL
      const svgString = response.data;
      const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
      return dataUrl;
    } catch (error) {
      console.error('Error fetching helmet image:', error);
      throw error;
    }
  }
}

export const avatarService = new AvatarService(); 