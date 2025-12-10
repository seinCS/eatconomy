import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShoppingListService } from './shopping-list.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('shopping-list')
@UseGuards(JwtAuthGuard)
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Get()
  async getShoppingChecks(@CurrentUser() user: any) {
    const checks = await this.shoppingListService.getShoppingChecks(user.id);
    return { checks };
  }

  @Put(':item/toggle')
  async toggleShoppingItem(
    @CurrentUser() user: any,
    @Param('item') itemName: string,
  ) {
    const checks = await this.shoppingListService.toggleShoppingItem(
      user.id,
      itemName,
    );
    return { checks };
  }

  @Put(':item')
  async setShoppingItem(
    @CurrentUser() user: any,
    @Param('item') itemName: string,
    @Body('checked') checked: boolean,
  ) {
    const checks = await this.shoppingListService.setShoppingItem(
      user.id,
      itemName,
      checked,
    );
    return { checks };
  }
}

