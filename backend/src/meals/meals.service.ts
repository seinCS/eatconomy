import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MealsService {
  constructor(private prisma: PrismaService) {}

  async getMealFinished(
    userId: string,
    dateKey: string,
    mealType: 'lunch' | 'dinner',
  ): Promise<boolean> {
    const meal = await this.prisma.mealFinished.findUnique({
      where: {
        userId_dateKey_mealType: {
          userId,
          dateKey,
          mealType,
        },
      },
    });

    return meal?.finished || false;
  }

  async toggleMealFinished(
    userId: string,
    dateKey: string,
    mealType: 'lunch' | 'dinner',
  ): Promise<boolean> {
    const existing = await this.prisma.mealFinished.findUnique({
      where: {
        userId_dateKey_mealType: {
          userId,
          dateKey,
          mealType,
        },
      },
    });

    if (existing) {
      // 토글
      const updated = await this.prisma.mealFinished.update({
        where: {
          userId_dateKey_mealType: {
            userId,
            dateKey,
            mealType,
          },
        },
        data: {
          finished: !existing.finished,
        },
      });
      return updated.finished;
    } else {
      // 생성 (기본값: true)
      const created = await this.prisma.mealFinished.create({
        data: {
          userId,
          dateKey,
          mealType,
          finished: true,
        },
      });
      return created.finished;
    }
  }

  async getTodayFinished(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dinner = await this.getMealFinished(userId, today, 'dinner');
    return dinner; // 오늘의 저녁 완료 여부
  }
}

