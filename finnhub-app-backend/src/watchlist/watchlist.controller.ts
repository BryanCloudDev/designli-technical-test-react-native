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
import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';
import { WatchlistService } from './watchlist.service';

@ApiTags('Watchlist')
@Auth()
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @ApiOperation({ summary: 'Add a stock to the authenticated user\'s watchlist' })
  add(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateWatchlistItemDto,
  ) {
    return this.watchlistService.add(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all stocks in the authenticated user\'s watchlist' })
  findAll(@Request() req: { user: { id: string } }) {
    return this.watchlistService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a stock from the watchlist by ID' })
  @ApiParam({ name: 'id', description: 'WatchlistItem UUID' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.watchlistService.remove(id, req.user.id);
  }
}
