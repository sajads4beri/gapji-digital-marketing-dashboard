import axios, { AxiosInstance } from 'axios';
import { Campaign, CampaignStats, CreateCampaignDto } from '@gapji/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getCampaigns(): Promise<Campaign[]> {
  const { data } = await api.get<Campaign[]>('/campaigns');
  return data;
}

export async function getCampaignStats(): Promise<CampaignStats> {
  const { data } = await api.get<CampaignStats>('/campaigns/stats');
  return data;
}

export async function getCampaign(id: string): Promise<Campaign> {
  const { data } = await api.get<Campaign>(`/campaigns/${id}`);
  return data;
}

export async function createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
  const { data } = await api.post<Campaign>('/campaigns', dto);
  return data;
}

export async function updateCampaign(
  id: string,
  dto: Partial<CreateCampaignDto>,
): Promise<Campaign> {
  const { data } = await api.patch<Campaign>(`/campaigns/${id}`, dto);
  return data;
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete(`/campaigns/${id}`);
}
