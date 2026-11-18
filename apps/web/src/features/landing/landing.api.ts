import { api } from '@/lib/api';
import {
  LandingPageItem,
  CreateLandingPageInput,
  UtmLinkItem,
  CreateUtmLinkInput,
  PreviewUtmInput,
  PreviewUtmResponse,
  LandingOptionsResponse,
  WordPressStatusResponse,
} from './types';

export const landingApi = {
  // Landing Pages
  async getLandingPages(): Promise<LandingPageItem[]> {
    const response = await api.get<LandingPageItem[]>('/landing/pages');
    return response.data;
  },

  async createLandingPage(data: CreateLandingPageInput): Promise<LandingPageItem> {
    const response = await api.post<LandingPageItem>('/landing/pages', data);
    return response.data;
  },

  async deleteLandingPage(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/landing/pages/${id}`);
    return response.data;
  },

  // UTM Links & Builder
  async getUtmLinks(): Promise<UtmLinkItem[]> {
    const response = await api.get<UtmLinkItem[]>('/landing/utm');
    return response.data;
  },

  async previewUtmLink(data: PreviewUtmInput): Promise<PreviewUtmResponse> {
    const response = await api.post<PreviewUtmResponse>('/landing/utm/preview', data);
    return response.data;
  },

  async createUtmLink(data: CreateUtmLinkInput): Promise<UtmLinkItem> {
    const response = await api.post<UtmLinkItem>('/landing/utm', data);
    return response.data;
  },

  // Options & WordPress
  async getOptions(): Promise<LandingOptionsResponse> {
    const response = await api.get<LandingOptionsResponse>('/landing/options');
    return response.data;
  },

  async getWordPressStatus(): Promise<WordPressStatusResponse> {
    const response = await api.get<WordPressStatusResponse>('/landing/wordpress-status');
    return response.data;
  },
};
