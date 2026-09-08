import { RolUsuario, UsuarioEntity } from '../../domain/entities/usuario.entity';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

export interface RegistrarUsuarioDto {
  username: string;
  email: string;
  passwordPlana: string;
  rol: RolUsuario;
}

export class RegistrarUsuarioUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(dto: RegistrarUsuarioDto): Promise<UsuarioEntity> {
    const usuarioExistente = await this.userRepository.findByEmail(dto.email);

    if (usuarioExistente) {
      throw new Error('El correo electrónico ya se encuentra registrado');
    }

    const passwordHash = await this.passwordHasher.hash(dto.passwordPlana);

    const nuevoUsuario = await this.userRepository.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      rol: dto.rol,
      activo: true,
    });

    return nuevoUsuario;
  }
}
