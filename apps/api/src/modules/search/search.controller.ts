import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchService, CurrentUserPayload, GlobalSearchResponse } from './search.service';
import { GlobalSearchDto } from './dto/global-search.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  @ApiOperation({
    summary: 'جستجوی سریع سراسری در لیدها و کمپین‌های سازمان فعال',
    description: 'جستجوی بلادرنگ با رعایت تفکیک سازمان و محدودیت‌های نقشی (مانند اختصاص لید به کارشناس فروش)',
  })
  @ApiResponse({
    status: 200,
    description: 'نتایج جستجو شامل لیدها و کمپین‌ها',
  })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  async globalSearch(
    @Query() query: GlobalSearchDto,
    @Req() req: any,
  ): Promise<GlobalSearchResponse> {
    const user = req.user as CurrentUserPayload;
    return this.searchService.globalSearch(query.q, user);
  }
}
