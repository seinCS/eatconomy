import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShoppingListService {
  constructor(private prisma: PrismaService) {}

  async getShoppingChecks(userId: string): Promise<Record<string, boolean>> {
    const checks = await this.prisma.shoppingCheck.findMany({
      where: { userId },
    });

    const result: Record<string, boolean> = {};
    checks.forEach((check) => {
      result[check.itemName] = check.checked;
    });

    return result;
  }

  async toggleShoppingItem(
    userId: string,
    itemName: string,
  ): Promise<Record<string, boolean>> {
    // 현재 상태 조회
    const existing = await this.prisma.shoppingCheck.findUnique({
      where: {
        userId_itemName: {
          userId,
          itemName,
        },
      },
    });

    if (existing) {
      // 토글
      await this.prisma.shoppingCheck.update({
        where: {
          userId_itemName: {
            userId,
            itemName,
          },
        },
        data: {
          checked: !existing.checked,
        },
      });
    } else {
      // 생성 (기본값: true)
      await this.prisma.shoppingCheck.create({
        data: {
          userId,
          itemName,
          checked: true,
        },
      });
    }

    return this.getShoppingChecks(userId);
  }

  async setShoppingItem(
    userId: string,
    itemName: string,
    checked: boolean,
  ): Promise<Record<string, boolean>> {
    await this.prisma.shoppingCheck.upsert({
      where: {
        userId_itemName: {
          userId,
          itemName,
        },
      },
      update: {
        checked,
      },
      create: {
        userId,
        itemName,
        checked,
      },
    });

    return this.getShoppingChecks(userId);
  }
}

