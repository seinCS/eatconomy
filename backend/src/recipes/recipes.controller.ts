import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('liked')
  async getLikedRecipes(@CurrentUser() user: any) {
    const recipeIds = await this.recipesService.getLikedRecipes(user.id);
    return { recipeIds };
  }

  @Get('disliked')
  async getDislikedRecipes(@CurrentUser() user: any) {
    const recipeIds = await this.recipesService.getDislikedRecipes(user.id);
    return { recipeIds };
  }

  @Post(':id/like')
  async likeRecipe(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) recipeId: number,
  ) {
    const recipeIds = await this.recipesService.likeRecipe(user.id, recipeId);
    return { recipeIds };
  }

  @Post(':id/dislike')
  async dislikeRecipe(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) recipeId: number,
  ) {
    const recipeIds = await this.recipesService.dislikeRecipe(user.id, recipeId);
    return { recipeIds };
  }

  @Delete(':id/like')
  async removeLike(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) recipeId: number,
  ) {
    const recipeIds = await this.recipesService.removeLike(user.id, recipeId);
    return { recipeIds };
  }

  @Delete(':id/dislike')
  async removeDislike(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) recipeId: number,
  ) {
    const recipeIds = await this.recipesService.removeDislike(user.id, recipeId);
    return { recipeIds };
  }
}

