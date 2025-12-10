import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FridgeService {
  constructor(private prisma: PrismaService) {}

  async getFridgeItems(userId: string): Promise<string[]> {
    const items = await this.prisma.fridgeItem.findMany({
      where: { userId },
      select: { name: true },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => item.name);
  }

  async addFridgeItem(userId: string, name: string): Promise<string[]> {
    // 중복 체크 및 추가
    await this.prisma.fridgeItem.upsert({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
      update: {},
      create: {
        userId,
        name,
      },
    });

    return this.getFridgeItems(userId);
  }

  async removeFridgeItem(userId: string, name: string): Promise<string[]> {
    const deleted = await this.prisma.fridgeItem.deleteMany({
      where: {
        userId,
        name,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Fridge item not found');
    }

    return this.getFridgeItems(userId);
  }

  async toggleFridgeItem(userId: string, name: string): Promise<string[]> {
    const existing = await this.prisma.fridgeItem.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });

    if (existing) {
      await this.prisma.fridgeItem.delete({
        where: {
          userId_name: {
            userId,
            name,
          },
        },
      });
    } else {
      await this.prisma.fridgeItem.create({
        data: {
          userId,
          name,
        },
      });
    }

    return this.getFridgeItems(userId);
  }
}

