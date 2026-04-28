import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar ?? null,
        role: user.role,
      },
    };
  }

  async register(email: string, username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
    });
    return this.login(user);
  }

  async getMe(id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new UnauthorizedException();
    const { password, ...rest } = user;
    return rest;
  }

  async updateProfile(id: string, data: { username?: string; avatar?: string }) {
    const updated = await this.usersService.updateProfile(id, data);
    const { password, ...rest } = updated;
    return rest;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    return this.usersService.changePassword(id, currentPassword, newPassword);
  }
}
