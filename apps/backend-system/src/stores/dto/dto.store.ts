import { StoreSchema } from "@repo/schemas";
import { createZodDto } from "nestjs-zod";

export class CreateStoreDto extends createZodDto(StoreSchema){}

export class UpdateStoreDto extends createZodDto(StoreSchema.partial()){}