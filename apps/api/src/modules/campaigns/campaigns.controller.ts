import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CampaignsService, CurrentUserPayload } from './campaigns.service';
import { CreateCampaignDto } from './create-campaign.dto';
import { UpdateCampaignDto } from './update-campaign.dto';
import { Campaign } from './campaign.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  UpsertFunnelObjectiveDto,
  CreateFunnelKeyResultDto,
  UpdateFunnelKeyResultDto,
  CreateOkrTaskDto,
} from './funnel-okr.dto';

@ApiTags('campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List all campaigns for current organization' })
  @ApiResponse({ status: 200, type: [Campaign] })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden for user role' })
  findAll(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.findAll(user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Aggregated statistics' })
  getStats(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.getStats(user);
  }

  @Get(':id/funnel')
  @ApiOperation({ summary: 'Get campaign sales funnel stages and conversion metrics' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, description: 'Funnel stages with counts and conversion rates' })
  getFunnel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.getCampaignFunnel(id, user);
  }

  @Get(':id/leads')
  @ApiOperation({ summary: 'Get leads belonging to a specific campaign and funnel stage' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, description: 'List of leads in stage' })
  getLeadsByStage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('statusKey') statusKey: string,
    @Query('statusConfigId') statusConfigId: string,
    @Query('search') search: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.getCampaignLeadsByStage(
      id,
      { statusKey, statusConfigId, search },
      user,
    );
  }

  @Get(':id/funnel/okr')
  @ApiOperation({ summary: 'Get all funnel stage objectives and key results for campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, description: 'Campaign funnel OKR tree and summary' })
  getFunnelAllOkr(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.getCampaignAllFunnelOkr(id, user);
  }

  @Get(':id/funnel/stages/:stageKey/okr')
  @ApiOperation({ summary: 'Get OKR for a specific funnel stage' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiParam({ name: 'stageKey', description: 'Funnel stage identifier (e.g. awareness, interest)' })
  @ApiResponse({ status: 200, description: 'Stage objective, key results, and linked tasks' })
  getStageOkr(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('stageKey') stageKey: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.getStageOkr(id, stageKey, user);
  }

  @Put(':id/funnel/stages/:stageKey/objective')
  @ApiOperation({ summary: 'Upsert the Objective for a funnel stage' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiParam({ name: 'stageKey', description: 'Funnel stage identifier' })
  @ApiResponse({ status: 200, description: 'Created or updated objective' })
  upsertStageObjective(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('stageKey') stageKey: string,
    @Body() dto: UpsertFunnelObjectiveDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.upsertStageObjective(id, stageKey, dto, user);
  }

  @Post(':id/funnel/stages/:stageKey/key-results')
  @ApiOperation({ summary: 'Create a Key Result under stage Objective' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiParam({ name: 'stageKey', description: 'Funnel stage identifier' })
  @ApiResponse({ status: 201, description: 'Created key result' })
  createKeyResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('stageKey') stageKey: string,
    @Body() dto: CreateFunnelKeyResultDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.createKeyResult(id, stageKey, dto, user);
  }

  @Put(':id/funnel/key-results/:krId')
  @ApiOperation({ summary: 'Update a Key Result (title, progress values, unit)' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiParam({ name: 'krId', description: 'Key Result UUID' })
  @ApiResponse({ status: 200, description: 'Updated key result' })
  updateKeyResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('krId', new ParseUUIDPipe()) krId: string,
    @Body() dto: UpdateFunnelKeyResultDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.updateKeyResult(id, krId, dto, user);
  }

  @Delete(':id/funnel/key-results/:krId')
  @ApiOperation({ summary: 'Delete a Key Result' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiParam({ name: 'krId', description: 'Key Result UUID' })
  @ApiResponse({ status: 200, description: 'Key result deleted' })
  deleteKeyResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('krId', new ParseUUIDPipe()) krId: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.deleteKeyResult(id, krId, user);
  }

  @Post(':id/funnel/key-results/:krId/tasks')
  @ApiOperation({ summary: 'Create an execution task under Key Result' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiParam({ name: 'krId', description: 'Key Result UUID' })
  @ApiResponse({ status: 201, description: 'Created task linked to KR' })
  createTaskUnderKeyResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('krId', new ParseUUIDPipe()) krId: string,
    @Body() dto: CreateOkrTaskDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.createTaskUnderKeyResult(id, krId, dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, type: Campaign })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, type: Campaign })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden for user role' })
  create(@Body() dto: CreateCampaignDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, type: Campaign })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCampaignDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.campaignsService.remove(id, user);
  }
}
