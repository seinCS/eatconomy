import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FridgeService } from './fridge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddFridgeItemDto } from './dto/add-fridge-item.dto';

@Controller('fridge')
@UseGuards(JwtAuthGuard)
export class FridgeController {
  constructor(private readonly fridgeService: FridgeService) {}

  @Get()
  async getFridgeItems(@CurrentUser() user: any) {
    const items = await this.fridgeService.getFridgeItems(user.id);
    return { items };
  }

  @Post()
  async addFridgeItem(
    @CurrentUser() user: any,
    @Body() dto: AddFridgeItemDto,
  ) {
    const items = await this.fridgeService.addFridgeItem(user.id, dto.name);
    return { items };
  }

  @Delete(':name')
  async removeFridgeItem(
    @CurrentUser() user: any,
    @Param('name') name: string,
  ) {
    const items = await this.fridgeService.removeFridgeItem(user.id, name);
    return { items };
  }

  @Put(':name/toggle')
  async toggleFridgeItem(
    @CurrentUser() user: any,
    @Param('name') name: string,
  ) {
    const items = await this.fridgeService.toggleFridgeItem(user.id, name);
    return { items };
  }
}

