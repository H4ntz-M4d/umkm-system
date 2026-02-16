import { LoginSchema } from "@repo/schemas";
import { createZodDto } from "nestjs-zod";

export class AdminLoginDto extends createZodDto(LoginSchema){}