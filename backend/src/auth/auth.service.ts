import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { USER_SELECT } from '../common/constants/user-select';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private generateAccessToken(userId: string, username: string) {
    return this.jwt.sign({ sub: userId, username });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  async register(username: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: { username, email, passwordHash },
        select: { ...USER_SELECT, email: true },
      });

      const token = this.generateAccessToken(user.id, user.username);
      const refreshToken = await this.generateRefreshToken(user.id);

      return { token, refreshToken, user };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Username or email already exists');
      throw e;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.generateAccessToken(user.id, user.username);
    const refreshToken = await this.generateRefreshToken(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return { token, refreshToken, user: safeUser };
  }

  async refresh(refreshTokenValue: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: { select: { ...USER_SELECT, email: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const token = this.generateAccessToken(stored.user.id, stored.user.username);
    const newRefreshToken = await this.generateRefreshToken(stored.user.id);

    return { token, refreshToken: newRefreshToken, user: stored.user };
  }

  async logout(refreshTokenValue: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshTokenValue },
    });
  }
}
