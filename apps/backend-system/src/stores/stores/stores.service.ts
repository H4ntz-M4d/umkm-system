import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import { CreateStoreDto, UpdateStoreDto } from 'stores/dto/dto.store';

@Injectable()
export class StoresService {

    async findAll(pagination: Pagination){
        const skip = pagination.skip ?? 0
        const limit = pagination.limit ?? 10
        const data = await prisma.store.findMany({
            skip,
            take: limit ?? 10
        })
        const total = await prisma.store.count()
        return {
            success: true,
            data,
            meta: {skip, limit, total, timestamp: new Date().toISOString()}
        }
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
