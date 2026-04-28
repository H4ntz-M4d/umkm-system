import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ExpenseCategoryService } from './expense-category.service';
import { ExpenseCategoryDto } from 'expense-category/dto/expense-category.dto';

@Controller('api/v1/expense-category')
export class ExpenseCategoryController {
  constructor(
    private readonly expenseCategoryService: ExpenseCategoryService,
  ) {}

  @Get()
  findAll() {
    return this.expenseCategoryService.findAll();
  }

  @Post()
  create(@Body() data: ExpenseCategoryDto) {
    return this.expenseCategoryService.create(data);
  }

  @Put()
  update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: ExpenseCategoryDto,
  ) {
    return this.expenseCategoryService.update(id, data);
  }

  @Delete()
  removeByStatus(@Param('id', ParseIntPipe) id: bigint) {
    return this.expenseCategoryService.removeByStatus(id);
  }

  @Delete()
  removePermanent(@Param('id', ParseIntPipe) id: bigint) {
    return this.expenseCategoryService.removePermanent(id);
  }
}
