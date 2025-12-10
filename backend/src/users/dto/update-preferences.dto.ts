import { IsArray, IsInt, IsString, IsIn, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @IsOptional()
  @IsInt()
  spicinessLevel?: number; // 1: 순한맛, 2: 보통, 3: 매운맛

  @IsOptional()
  @IsString()
  @IsIn(['Beginner', 'Intermediate', 'Advanced'])
  cookingSkill?: string;
}

