import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, username, password } = dto;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });
    if (existingUser) {
      throw new ConflictException('Email veya username zaten kullanılıyor.');
    }

    const password_hash = await bcrypt.hash(password, 12); 

    const user = this.userRepository.create({
      email,
      username,
      password_hash,
    });

    const savedUser = await this.userRepository.save(user);
    
    const { password_hash: _ph, ...safeUser } = savedUser; 

    const payload = { userId: savedUser.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: safeUser,
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password_hash')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    const { password_hash: _ph, ...safeUser } = user;
    
    const payload = { userId: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: safeUser,
    };
  }

  async validateUser(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }
    return user;
  }
}
