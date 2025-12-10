import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getPlans(userId: string): Promise<(number | null)[]> {
    const plans = await this.prisma.plan.findMany({
      where: { userId },
      orderBy: { slotIndex: 'asc' },
    });

    // 14개 슬롯 배열 생성 (없는 슬롯은 null)
    const result: (number | null)[] = Array(14).fill(null);
    plans.forEach((plan) => {
      if (plan.recipeId !== null) {
        result[plan.slotIndex] = plan.recipeId;
      }
    });

    return result;
  }

  async createPlan(userId: string, dto: CreatePlanDto): Promise<(number | null)[]> {
    // 기존 플랜 삭제
    await this.prisma.plan.deleteMany({
      where: { userId },
    });

    // 새 플랜 생성
    const plansToCreate = dto.recipeIds
      .map((recipeId, slotIndex) => ({
        userId,
        slotIndex,
        recipeId,
      }))
      .filter((plan) => plan.recipeId !== null); // null이 아닌 것만 저장

    if (plansToCreate.length > 0) {
      await this.prisma.plan.createMany({
        data: plansToCreate,
      });
    }

    return this.getPlans(userId);
  }

  async updatePlan(
    userId: string,
    slotIndex: number,
    recipeId: number | null,
  ): Promise<(number | null)[]> {
    if (recipeId === null) {
      // 슬롯 비우기
      await this.prisma.plan.deleteMany({
        where: {
          userId,
          slotIndex,
        },
      });
    } else {
      // 슬롯 업데이트 또는 생성
      await this.prisma.plan.upsert({
        where: {
          userId_slotIndex: {
            userId,
            slotIndex,
          },
        },
        update: {
          recipeId,
        },
        create: {
          userId,
          slotIndex,
          recipeId,
        },
      });
    }

    return this.getPlans(userId);
  }
}

