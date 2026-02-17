import { createParamDecorator, ExecutionContext, HttpException } from "@nestjs/common";
import e from "express";

export const AuthUser = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest()
        const user = req.user
        if (user) {
            return user
        } else {
            throw new HttpException('Unauthorized', 401)
        }
    }
)