import { createZodDto } from "nestjs-zod";
import { EmployeeSchema, EmployeeUpdateSchema, UsersSchema } from '@repo/schemas';

export class CreateUsersDto extends createZodDto(UsersSchema){}

export class CreateEmployeeDto extends createZodDto(EmployeeSchema){}

export class UpdateUsersDto extends createZodDto(EmployeeUpdateSchema){}
