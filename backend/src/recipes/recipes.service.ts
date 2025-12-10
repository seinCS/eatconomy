import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async getLikedRecipes(userId: string): Promise<number[]> {
    const liked = await this.prisma.likedRecipe.findMany({
      where: { userId },
      select: { recipeId: true },
      orderBy: { createdAt: 'desc' },
    });

    return liked.map((item) => item.recipeId);
  }

  async getDislikedRecipes(userId: string): Promise<number[]> {
    const disliked = await this.prisma.dislikedRecipe.findMany({
      where: { userId },
      select: { recipeId: true },
      orderBy: { createdAt: 'desc' },
    });

    return disliked.map((item) => item.recipeId);
  }

  async likeRecipe(userId: string, recipeId: number): Promise<number[]> {
    // 싫어요에서 제거 (있는 경우)
    await this.prisma.dislikedRecipe.deleteMany({
      where: {
        userId,
        recipeId,
      },
    });

    // 좋아요 추가
    await this.prisma.likedRecipe.upsert({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
      update: {},
      create: {
        userId,
        recipeId,
      },
    });

    return this.getLikedRecipes(userId);
  }

  async dislikeRecipe(userId: string, recipeId: number): Promise<number[]> {
    // 좋아요에서 제거 (있는 경우)
    await this.prisma.likedRecipe.deleteMany({
      where: {
        userId,
        recipeId,
      },
    });

    // 싫어요 추가
    await this.prisma.dislikedRecipe.upsert({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
      update: {},
      create: {
        userId,
        recipeId,
      },
    });

    return this.getDislikedRecipes(userId);
  }

  async removeLike(userId: string, recipeId: number): Promise<number[]> {
    await this.prisma.likedRecipe.deleteMany({
      where: {
        userId,
        recipeId,
      },
    });

    return this.getLikedRecipes(userId);
  }

  async removeDislike(userId: string, recipeId: number): Promise<number[]> {
    await this.prisma.dislikedRecipe.deleteMany({
      where: {
        userId,
        recipeId,
      },
    });

    return this.getDislikedRecipes(userId);
  }
}

