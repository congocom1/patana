import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly db: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ actor: { sub: string; role: string } }>();
    const owner = await this.db.owner.findUnique({
      where: { userId: req.actor.sub },
    });
    if (!owner) {
      throw new ForbiddenException('Owner profile required');
    }
    return true;
  }
}