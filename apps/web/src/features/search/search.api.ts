import { api } from '@/lib/api';

export interface SearchItemResult {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  type: 'lead' | 'campaign';
  url: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  leads: SearchItemResult[];
  campaigns: SearchItemResult[];
  items: SearchItemResult[];
}

export const searchApi = {
  async globalSearch(query: string): Promise<GlobalSearchResponse> {
    if (!query || query.trim().length < 2) {
      return {
        query: '',
        total: 0,
        leads: [],
        campaigns: [],
        items: [],
      };
    }
    const { data } = await api.get<GlobalSearchResponse>('/search/global', {
      params: { q: query.trim() },
    });
    return data;
  },
};
