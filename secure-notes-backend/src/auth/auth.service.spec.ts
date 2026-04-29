import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password_hash: 'hash',
      }),
    }),
  };
  const mockJwtService = { sign: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register user successfully', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({
      id: 1,
      email: 'test@test.com',
    });
    mockUserRepository.save.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
    });

    const result = await service.register({
      email: 'test@test.com',
      username: 'testuser',
      password: 'password',
    });
    expect(result.user).toHaveProperty('id');
  });

  it('should throw error on duplicate email', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 1 });
    await expect(
      service.register({
        email: 'test@test.com',
        username: 'testuser',
        password: 'pwd',
      }),
    ).rejects.toThrow();
  });

  it('should throw on password mismatch', async () => {
    mockUserRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password_hash: 'hash',
      }),
    });
    await expect(
      service.login({ email: 'test@test.com', password: 'wrongpwd' }),
    ).rejects.toThrow();
  });
});
