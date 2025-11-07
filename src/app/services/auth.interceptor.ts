import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/api/Auth/')) {
      return next.handle(req);
    }

    const token = localStorage.getItem('token');
    console.log(`[AuthInterceptor] ${req.method} ${req.url}`);
    console.log('[AuthInterceptor] Token exists:', !!token);

    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      // Log the actual header being sent
      console.log('[AuthInterceptor] Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      
      return next.handle(cloned);
    }

    console.log('[AuthInterceptor] No token found');
    return next.handle(req);
  }
}