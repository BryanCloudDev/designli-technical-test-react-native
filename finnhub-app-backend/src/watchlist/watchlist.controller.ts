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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MessageResponseDto } from 'src/common/dto/message-response.dto';
import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { WatchlistService } from './watchlist.service';

@ApiTags('Watchlist')
@Auth()
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @ApiOperation({
    summary: "Add a stock to the authenticated user's watchlist",
  })
  @ApiCreatedResponse({
    type: WatchlistItem,
    description: 'Item added to watchlist',
  })
  @ApiConflictResponse({ description: 'Symbol is already in the watchlist' })
  add(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateWatchlistItemDto,
  ) {
    return this.watchlistService.add(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List all stocks in the authenticated user's watchlist",
  })
  @ApiOkResponse({
    type: [WatchlistItem],
    description: "User's watchlist items",
  })
  findAll(@Request() req: { user: { id: string } }) {
    return this.watchlistService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a stock from the watchlist by ID' })
  @ApiParam({ name: 'id', description: 'WatchlistItem UUID' })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Item removed' })
  @ApiNotFoundResponse({
    description: 'Watchlist item not found or not owned by user',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.watchlistService.remove(id, req.user.id);
  }
}
