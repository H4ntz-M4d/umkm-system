import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from 'stores/dto/dto.store';

@Controller('/api/v1/stores')
export class StoresController {
    constructor(
        private service: StoresService
    ) {}

    @Get()
    findAll(){
        return this.service.findAll()
    }

    @Post()
    create(@Body() dto: CreateStoreDto){
        return this.service.create(dto)
    }

    @Delete(':id')
    remove(@Param('id') id: number){
        return this.service.remove(id)
    }
}
