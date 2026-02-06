import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateStoreDto, UpdateStoreDto } from 'stores/dto/dto.store';

@Injectable()
export class StoresService {

    async findAll(){
        return await prisma.store.findMany()
    }

    async create(data: CreateStoreDto) {
        return await prisma.store.create({
            data: data
        })
    }

    async update(id: bigint, data: UpdateStoreDto){
        return await prisma.store.update({
            where: {
                id: id
            }, 
            data: data
        })
    }
    
    async remove(store_id: number) {
        return await prisma.store.delete({
            where: {
                id: store_id
            }
        })
    }
}
