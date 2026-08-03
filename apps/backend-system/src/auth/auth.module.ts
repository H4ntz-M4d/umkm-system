import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../common/strategies/strategy.jwt';
import { PasswordResetService } from './password-reset.service';
import { MailModule } from 'mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN") as any
        }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
