import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { jwtInterceptor } from './jwt-interceptor';
import { TokenService } from '../services/token';
import { ToastService } from '../../shared/ui/toast';
import { UsuarioSesion } from '../models/auth.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const USUARIO: UsuarioSesion = {
  id: 'u1',
  username: 'asesor',
  email: 'asesor@taller.pe',
  nombres: 'Ana',
  apellidos: 'Quispe',
  roles: ['ASESOR'],
};

const NO_AUTORIZADO = { status: 401, statusText: 'Unauthorized' };

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let tokens: TokenService;
  let toast: ToastService;
  let router: Router;

  beforeEach(async () => {
    localStorage.removeItem('taller_token');
    localStorage.removeItem('taller_usuario');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/ordenes/7');
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    backend.verify();
    localStorage.removeItem('taller_token');
    localStorage.removeItem('taller_usuario');
  });

  it('adjunta el token a las peticiones de la API', () => {
    tokens.guardarSesion('vigente', USUARIO);

    http.get(`${API}/ordenes`).subscribe();

    const peticion = backend.expectOne(`${API}/ordenes`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer vigente');
    peticion.flush([]);
  });

  it('un 401 con el token vigente cierra la sesión y lleva al login con la ruta de vuelta', () => {
    tokens.guardarSesion('vencido', USUARIO);

    http.get(`${API}/ordenes`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/ordenes`).flush({ message: 'El token es inválido o expiró' }, NO_AUTORIZADO);

    expect(tokens.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('taller_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/auth/login'], {
      queryParams: { returnUrl: '/ordenes/7' },
    });
    expect(toast.avisos().map((a) => a.texto)).toEqual([
      'Su sesión venció. Inicie sesión nuevamente.',
    ]);
  });

  it('el que hizo la petición no recibe el error: el aviso de sesión es el único mensaje', () => {
    tokens.guardarSesion('vencido', USUARIO);
    const alFallar = jasmine.createSpy('error');

    http.get(`${API}/ordenes`).subscribe({ error: alFallar });
    backend.expectOne(`${API}/ordenes`).flush({ message: 'El token es inválido o expiró' }, NO_AUTORIZADO);

    expect(alFallar).not.toHaveBeenCalled();
  });

  it('si fallan varias peticiones a la vez, cierra la sesión y avisa una sola vez', () => {
    tokens.guardarSesion('vencido', USUARIO);

    http.get(`${API}/ordenes`).subscribe();
    http.get(`${API}/ordenes/estadisticas`).subscribe();
    http.get(`${API}/usuarios`).subscribe();
    backend.expectOne(`${API}/ordenes`).flush(null, NO_AUTORIZADO);
    backend.expectOne(`${API}/ordenes/estadisticas`).flush(null, NO_AUTORIZADO);
    backend.expectOne(`${API}/usuarios`).flush(null, NO_AUTORIZADO);

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(toast.avisos().length).toBe(1);
  });

  it('las credenciales equivocadas del login no se toman como sesión vencida', () => {
    // Quien llega al login con un token viejo en el navegador lo manda igual.
    tokens.guardarSesion('viejo', USUARIO);
    const alFallar = jasmine.createSpy('error');

    http.post(`${API}/auth/login`, { email: 'a@b.pe', password: 'mala' }).subscribe({
      error: alFallar,
    });
    backend
      .expectOne(`${API}/auth/login`)
      .flush({ message: 'Credenciales inválidas' }, NO_AUTORIZADO);

    expect(alFallar).toHaveBeenCalled();
    expect(alFallar.calls.mostRecent().args[0].error.message).toBe('Credenciales inválidas');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toast.avisos()).toEqual([]);
  });

  it('un 401 de un token que ya no es el vigente no toca la sesión nueva', () => {
    tokens.guardarSesion('anterior', USUARIO);
    http.get(`${API}/ordenes`).subscribe();
    tokens.guardarSesion('nuevo', USUARIO);

    backend.expectOne(`${API}/ordenes`).flush(null, NO_AUTORIZADO);

    expect(tokens.obtenerToken()).toBe('nuevo');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toast.avisos()).toEqual([]);
  });

  it('los demás errores llegan intactos al que hizo la petición', () => {
    tokens.guardarSesion('vigente', USUARIO);
    const alFallar = jasmine.createSpy('error');

    http.delete(`${API}/ordenes/7`).subscribe({ error: alFallar });
    backend
      .expectOne(`${API}/ordenes/7`)
      .flush({ message: 'No tiene permiso' }, { status: 403, statusText: 'Forbidden' });

    expect(alFallar).toHaveBeenCalled();
    expect(alFallar.calls.mostRecent().args[0].status).toBe(403);
    expect(tokens.obtenerToken()).toBe('vigente');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
