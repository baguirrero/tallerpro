export interface LoginRequest {
  email: string;
  password: string;
}

export interface UsuarioSesion {
  id: string;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
  usuario: UsuarioSesion;
}

export interface RegistroRequest {
  username: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}

export interface MensajeResponse {
  mensaje: string;
}
