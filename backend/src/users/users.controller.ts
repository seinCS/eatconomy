import { Controller, Get, Put, Delete, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getUserProfile(user.id);
  }

  @Put('me/preferences')
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(user.id, dto);
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }
}

