import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret', 'change-me-in-production'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasherService, JwtStrategy],
  exports: [AuthService, PasswordHasherService, PassportModule, JwtModule],
})
export class AuthModule {}
