import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

export interface LoginDto {
  email: string;
  passwordPlana: string;
}

export interface LoginResult {
  accessToken: string;
  usuario: {
    id: string;
    username: string;
    email: string;
    rol: string;
  };
}

export class LoginUsuarioUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    const usuario = await this.userRepository.findByEmail(dto.email);

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new Error('El usuario se encuentra inactivo');
    }

    const passwordValida = await this.passwordHasher.compare(
      dto.passwordPlana,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      throw new Error('Credenciales inválidas');
    }

    const accessToken = await this.tokenService.generateToken({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}
