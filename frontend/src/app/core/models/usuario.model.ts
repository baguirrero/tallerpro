export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: string;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  activo: boolean;
  created_at: string;
  roles: Rol[];
}

export interface Mecanico {
  id: string;
  username: string;
  nombres: string;
  apellidos: string;
}
