import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePlanDto, UpdatePlanDto } from './dto/update-plan.dto';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getPlans(@CurrentUser() user: any) {
    const plans = await this.plansService.getPlans(user.id);
    return { plans };
  }

  @Post()
  async createPlan(
    @CurrentUser() user: any,
    @Body() dto: CreatePlanDto,
  ) {
    const plans = await this.plansService.createPlan(user.id, dto);
    return { plans };
  }

  @Put(':slotIndex')
  async updatePlan(
    @CurrentUser() user: any,
    @Param('slotIndex', ParseIntPipe) slotIndex: number,
    @Body() dto: UpdatePlanDto,
  ) {
    const plans = await this.plansService.updatePlan(
      user.id,
      slotIndex,
      dto.recipeId ?? null,
    );
    return { plans };
  }
}

