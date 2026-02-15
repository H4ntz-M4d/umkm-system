import { createZodDto } from "nestjs-zod";
import { UsersSchema } from '@repo/schemas';

export class CreateUsersDto extends createZodDto(UsersSchema){}

export class UpdateUsersDto extends createZodDto(UsersSchema.partial()){}
