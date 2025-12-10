import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdatePlanDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(13)
  slotIndex?: number;

  @IsInt()
  @IsOptional()
  recipeId?: number | null; // null이면 슬롯 비우기
}

export class CreatePlanDto {
  @IsInt({ each: true })
  recipeIds: (number | null)[]; // 14개 슬롯 (0-13)
}

