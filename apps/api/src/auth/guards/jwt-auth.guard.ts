import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      if (info && info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (info && info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
