import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ExpenseCategoryService } from './expense-category.service';
import { ExpenseCategoryDto } from 'expense-category/dto/expense-category.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
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

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: ExpenseCategoryDto,
  ) {
    return this.expenseCategoryService.update(id, data);
  }

  @Delete('/status/:id')
  removeByStatus(@Param('id', ParseIntPipe) id: bigint) {
    return this.expenseCategoryService.removeByStatus(id);
  }

  @Delete(':id')
  removePermanent(@Param('id', ParseIntPipe) id: bigint) {
    return this.expenseCategoryService.removePermanent(id);
  }
}
