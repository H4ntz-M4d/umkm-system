import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext, 
        next: CallHandler<any>
    ): Observable<any> {
        const request = context.switchToHttp().getRequest()

        return next.handle().pipe(
            map((data) => {
                if (data?.success === true) {
                    return data
                }

                return {
                    success: true,
                    data,
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                }
            })
        )
    }
}