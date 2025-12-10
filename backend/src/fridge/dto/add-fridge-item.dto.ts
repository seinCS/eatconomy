import { IsString, IsNotEmpty } from 'class-validator';

export class AddFridgeItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

