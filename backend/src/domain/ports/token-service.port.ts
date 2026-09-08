export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

export interface TokenServicePort {
  generateToken(payload: JwtPayload): Promise<string>;
  verifyToken(token: string): Promise<JwtPayload>;
}

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');
