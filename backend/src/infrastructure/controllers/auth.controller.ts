import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { LoginUsuarioUseCase } from '../../application/use-cases/login-usuario.use-case';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/registrar-usuario.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class LoginDto {
  email!: string;
  password!: string;
}

class RegistrarDto {
  username!: string;
  email!: string;
  password!: string;
  rol!: RolUsuario;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly loginUsuarioUseCase: LoginUsuarioUseCase,
    private readonly registrarUsuarioUseCase: RegistrarUsuarioUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.loginUsuarioUseCase.execute({
      email: dto.email,
      passwordPlana: dto.password,
    });
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async register(@Body() dto: RegistrarDto) {
    return this.registrarUsuarioUseCase.execute({
      username: dto.username,
      email: dto.email,
      passwordPlana: dto.password,
      rol: dto.rol,
    });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
