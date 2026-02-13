import { PaginationSchema } from "@repo/schemas";
import { createZodDto } from "nestjs-zod";

export class Pagination extends createZodDto(PaginationSchema) {}