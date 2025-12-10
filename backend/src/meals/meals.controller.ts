import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Get('finished/:dateKey/:mealType')
  async getMealFinished(
    @CurrentUser() user: any,
    @Param('dateKey') dateKey: string,
    @Param('mealType') mealType: 'lunch' | 'dinner',
  ) {
    const finished = await this.mealsService.getMealFinished(
      user.id,
      dateKey,
      mealType,
    );
    return { finished };
  }

  @Put('finished/:dateKey/:mealType')
  async toggleMealFinished(
    @CurrentUser() user: any,
    @Param('dateKey') dateKey: string,
    @Param('mealType') mealType: 'lunch' | 'dinner',
  ) {
    const finished = await this.mealsService.toggleMealFinished(
      user.id,
      dateKey,
      mealType,
    );
    return { finished };
  }

  @Get('today')
  async getTodayFinished(@CurrentUser() user: any) {
    const finished = await this.mealsService.getTodayFinished(user.id);
    return { finished };
  }
}

