import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MessageResponseDto } from 'src/common/dto/message-response.dto';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { PriceAlertsService } from './price-alerts.service';
import { PriceAlert } from './entities/price-alert.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { TriggerTestDto } from './dto/trigger-test.dto';

@ApiTags('Price Alerts')
@Auth()
@Controller('price-alerts')
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a price alert for a stock' })
  @ApiCreatedResponse({ type: PriceAlert, description: 'Alert created' })
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreatePriceAlertDto,
  ) {
    return this.priceAlertsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all price alerts for the authenticated user' })
  @ApiOkResponse({
    type: [PriceAlert],
    description: "User's price alerts, newest first",
  })
  findAll(@Request() req: { user: { id: string } }) {
    return this.priceAlertsService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price alert by ID' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Alert deleted' })
  @ApiNotFoundResponse({ description: 'Alert not found or not owned by user' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.priceAlertsService.remove(id, req.user.id);
  }

  @Post('trigger-test')
  @ApiOperation({
    summary: '[Dev] Simulate a price update to test alert notifications',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Trigger simulation dispatched',
  })
  async triggerTest(@Body() dto: TriggerTestDto) {
    await this.priceAlertsService.checkAndTrigger(dto.symbol, dto.price);
    return {
      message: `checkAndTrigger called for ${dto.symbol} @ $${dto.price}`,
    };
  }
}
