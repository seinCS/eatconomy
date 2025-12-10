import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FridgeModule } from './fridge/fridge.module';
import { PlansModule } from './plans/plans.module';
import { RecipesModule } from './recipes/recipes.module';
import { ShoppingListModule } from './shopping-list/shopping-list.module';
import { MealsModule } from './meals/meals.module';
import { validate } from './common/config/env.validation';
import { winstonConfig } from './common/logger/winston.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분
        limit: 100, // 최대 100회 요청
      },
    ]),
    WinstonModule.forRoot(winstonConfig),
    PrismaModule,
    AuthModule,
    UsersModule,
    FridgeModule,
    PlansModule,
    RecipesModule,
    ShoppingListModule,
    MealsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
