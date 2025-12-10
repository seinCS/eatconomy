import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      preferences: user.preferences
        ? {
            allergies: user.preferences.allergies,
            dislikedFoods: user.preferences.dislikedFoods,
            spicinessLevel: user.preferences.spicinessLevel,
            cookingSkill: user.preferences.cookingSkill,
          }
        : null,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 선호도 업데이트 또는 생성
    const preferences = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        allergies: dto.allergies,
        dislikedFoods: dto.dislikedFoods,
        spicinessLevel: dto.spicinessLevel,
        cookingSkill: dto.cookingSkill,
      },
      create: {
        userId,
        allergies: dto.allergies || [],
        dislikedFoods: dto.dislikedFoods || [],
        spicinessLevel: dto.spicinessLevel || 2,
        cookingSkill: dto.cookingSkill || 'Beginner',
      },
    });

    return {
      allergies: preferences.allergies,
      dislikedFoods: preferences.dislikedFoods,
      spicinessLevel: preferences.spicinessLevel,
      cookingSkill: preferences.cookingSkill,
    };
  }

  async deleteAccount(userId: string) {
    // Prisma의 cascade delete로 인해 관련 데이터가 자동 삭제됨
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }
}

