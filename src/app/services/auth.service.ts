import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Use HTTPS for your microservice
  private apiUrl = 'https://localhost:7003/api/Auth';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ===== Token Management =====
  setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  removeToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ===== Register =====
  register(userData: any): Observable<any> {
    const requestData = {
      FirstName: userData.firstName,
      LastName: userData.lastName,
      Email: userData.email,
      Username: userData.username,
      Password: userData.password,
      Phone: userData.phone || null,
      Role: userData.role
    };

    return this.http.post<any>(`${this.apiUrl}/register`, requestData).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMsg = 'Registration failed';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          try { 
            const parsed = JSON.parse(error.error);
            errorMsg = parsed.message || errorMsg;
          } catch {}
        } else if (error.status === 0) {
          errorMsg = 'Cannot connect to server. Make sure the microservice is running.';
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  // ===== Login =====
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response.token) this.setToken(response.token);
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMsg = 'Login failed';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          try { 
            const parsed = JSON.parse(error.error);
            errorMsg = parsed.message || errorMsg;
          } catch {}
        } else if (error.status === 401) {
          errorMsg = 'Invalid email or password';
        } else if (error.status === 0) {
          errorMsg = 'Cannot connect to server. Make sure the microservice is running.';
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }
}
