import { createZodDto } from 'nestjs-zod';
import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyResetCodeSchema,
} from '@repo/schemas';

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
export class VerifyResetCodeDto extends createZodDto(VerifyResetCodeSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
