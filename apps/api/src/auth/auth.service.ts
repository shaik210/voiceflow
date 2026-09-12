import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async register(dto: RegisterDto) {
    if (!dto.email || typeof dto.email !== 'string') {
      throw new BadRequestException('Email is required');
    }

    const email = this.normalizeEmail(dto.email);
    if (!this.EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    if (!dto.password || typeof dto.password !== 'string' || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      success: true,
      accessToken,
      user,
    };
  }

  async login(dto: LoginDto) {
    if (!dto.email || !dto.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const email = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user,
    };
  }
}
