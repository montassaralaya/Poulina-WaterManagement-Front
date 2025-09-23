import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');
    console.log('[Interceptor] token from localStorage:', token);

    if (token) {
      // Add 'Bearer ' exactly like Swagger expects
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      console.log('[Interceptor] Sending request with headers:', cloned.headers.get('Authorization'));
      return next.handle(cloned);
    }

    console.log('[Interceptor] No token found, sending request without Authorization header');
    return next.handle(req);
  }
}
