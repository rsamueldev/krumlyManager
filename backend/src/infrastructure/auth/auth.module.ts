import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginUsuarioUseCase } from '../../application/use-cases/login-usuario.use-case';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/registrar-usuario.use-case';
import { PASSWORD_HASHER_PORT } from '../../domain/ports/password-hasher.port';
import { TOKEN_SERVICE_PORT } from '../../domain/ports/token-service.port';
import { USER_REPOSITORY_PORT } from '../../domain/ports/user-repository.port';
import { AuthController } from '../controllers/auth.controller';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { PrismaUserRepositoryAdapter } from '../persistence/prisma/prisma-user-repository.adapter';
import { BcryptPasswordHasherAdapter } from '../security/bcrypt-password-hasher.adapter';
import { NestJwtTokenServiceAdapter } from '../security/nest-jwt-token-service.adapter';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'krumly-secret-key-change-in-prod',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasherAdapter,
    },
    {
      provide: TOKEN_SERVICE_PORT,
      useClass: NestJwtTokenServiceAdapter,
    },
    {
      provide: USER_REPOSITORY_PORT,
      useClass: PrismaUserRepositoryAdapter,
    },
    {
      provide: LoginUsuarioUseCase,
      useFactory: (userRepo, passwordHasher, tokenService) => {
        return new LoginUsuarioUseCase(userRepo, passwordHasher, tokenService);
      },
      inject: [USER_REPOSITORY_PORT, PASSWORD_HASHER_PORT, TOKEN_SERVICE_PORT],
    },
    {
      provide: RegistrarUsuarioUseCase,
      useFactory: (userRepo, passwordHasher) => {
        return new RegistrarUsuarioUseCase(userRepo, passwordHasher);
      },
      inject: [USER_REPOSITORY_PORT, PASSWORD_HASHER_PORT],
    },
  ],
  exports: [LoginUsuarioUseCase, RegistrarUsuarioUseCase],
})
export class AuthModule {}
