import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { MerchantUser, UserRole } from '../database/entities/merchant-user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(MerchantUser)
    private usersRepo: Repository<MerchantUser>,
    private jwtService: JwtService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      ...dto,
      password: hashed,
      role: UserRole.OWNER,
    });
    await this.usersRepo.save(user);

    return this.signToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      relations: ['merchant'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    user.lastLoginAt = new Date();
    await this.usersRepo.save(user);

    return this.signToken(user);
  }

  async me(userId: string) {
    return this.usersRepo.findOne({
      where: { id: userId },
      relations: ['merchant'],
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'merchantId', 'createdAt'],
    });
  }

  async refreshToken(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.signToken(user);
  }

  private signToken(user: MerchantUser) {
    const payload = { sub: user.id, email: user.email, role: user.role, merchantId: user.merchantId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        merchantId: user.merchantId,
      },
    };
  }
}
