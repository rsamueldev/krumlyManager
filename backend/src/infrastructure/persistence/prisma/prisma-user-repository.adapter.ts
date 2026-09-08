import { Injectable } from '@nestjs/common';
import { RolUsuario, UsuarioEntity } from '../../../domain/entities/usuario.entity';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepositoryAdapter implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UsuarioEntity | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) return null;

    return this.toEntity(user);
  }

  async findById(id: string): Promise<UsuarioEntity | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user) return null;

    return this.toEntity(user);
  }

  async create(usuario: Omit<UsuarioEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UsuarioEntity> {
    const created = await this.prisma.usuario.create({
      data: {
        username: usuario.username,
        email: usuario.email,
        passwordHash: usuario.passwordHash,
        role: usuario.rol as any,
        activo: usuario.activo,
      },
    });

    return this.toEntity(created);
  }

  private toEntity(prismaUser: any): UsuarioEntity {
    return new UsuarioEntity(
      prismaUser.id,
      prismaUser.username,
      prismaUser.email,
      prismaUser.passwordHash,
      (prismaUser.role || prismaUser.rol) as RolUsuario,
      prismaUser.activo,
      prismaUser.createdAt,
      prismaUser.updatedAt,
    );
  }
}
