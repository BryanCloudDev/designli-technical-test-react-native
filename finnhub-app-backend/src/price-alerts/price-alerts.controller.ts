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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { TriggerTestDto } from './dto/trigger-test.dto';
import { PriceAlertsService } from './price-alerts.service';

/**
 * REST controller for price alert management under `/price-alerts`.
 *
 * All routes require a valid JWT (Bearer token).
 *
 * Endpoints:
 * - `POST /price-alerts`        — create a new alert.
 * - `GET  /price-alerts`        — list all alerts for the authenticated user.
 * - `DELETE /price-alerts/:id`  — delete an alert by ID.
 */
@ApiTags('Price Alerts')
@Auth()
@Controller('price-alerts')
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  /**
   * Creates a price alert that fires when the symbol's price reaches the
   * specified target.
   *
   * @param req - Express request; `req.user` is the authenticated `User`.
   * @param dto - Validated body containing `symbol` and `targetPrice`.
   */
  @Post()
  @ApiOperation({ summary: 'Create a price alert for a stock' })
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreatePriceAlertDto,
  ) {
    return this.priceAlertsService.create(req.user.id, dto);
  }

  /**
   * Returns all price alerts owned by the authenticated user, newest first.
   *
   * @param req - Express request; `req.user` is the authenticated `User`.
   */
  @Get()
  @ApiOperation({ summary: 'List all price alerts for the authenticated user' })
  findAll(@Request() req: { user: { id: string } }) {
    return this.priceAlertsService.findAll(req.user.id);
  }

  /**
   * Deletes a specific price alert. Only the owner can delete their own alerts.
   *
   * @param id  - UUID of the alert to delete.
   * @param req - Express request; `req.user` is the authenticated `User`.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price alert by ID' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.priceAlertsService.remove(id, req.user.id);
  }

  /**
   * DEV ONLY — simulates a price update for a symbol so you can test alert
   * notifications without waiting for the market to be open or the poll cycle.
   *
   * Example: POST /price-alerts/trigger-test { "symbol": "AAPL", "price": 999 }
   * Any alert whose targetPrice ≤ 999 will fire immediately.
   */
  @Post('trigger-test')
  @ApiOperation({ summary: '[Dev] Simulate a price update to test alert notifications' })
  async triggerTest(@Body() dto: TriggerTestDto) {
    await this.priceAlertsService.checkAndTrigger(dto.symbol, dto.price);
    return { message: `checkAndTrigger called for ${dto.symbol} @ $${dto.price}` };
  }
}
