import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Campaign } from './campaign.entity';
import { CreateCampaignDto } from './create-campaign.dto';
import { UpdateCampaignDto } from './update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async findAll(): Promise<Campaign[]> {
    return this.campaignRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOneBy({ id });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async create(dto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepository.create(dto);
    return this.campaignRepository.save(campaign);
  }

  async update(id: string, dto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.findOne(id);
    Object.assign(campaign, dto);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string): Promise<void> {
    const result = await this.campaignRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
  }

  async getStats() {
    const campaigns = await this.findAll();
    return {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === 'active').length,
      totalSpend: campaigns.reduce((sum, c) => sum + Number(c.spend), 0),
      totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    };
  }
}
