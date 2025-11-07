import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  firstName2: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'https://localhost:7003/api/User';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  getProfile(): Observable<UserProfile> {
    console.log('[UserService] Sending GET request to /me');
    
    // Safe way to check token for SSR
    let token: string | null = null;
    if (this.isBrowser) {
      token = localStorage.getItem('token');
      console.log('[UserService] Current token:', token ? `${token.substring(0, 20)}...` : 'No token');
    }
    
    return this.http.get<UserProfile>(`${this.baseUrl}/me`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('[UserService] Error fetching profile:', error);
        console.error('[UserService] Error status:', error.status);
        
        // Return a default user object instead of throwing error
        const defaultUser: UserProfile = {
          id: 'unknown',
          username: 'User',
          firstName: 'User',
          firstName2: 'User',
          lastName: '',
          email: '',
          role: 'User'
        };
        
        console.log('[UserService] Returning default user due to error');
        return of(defaultUser);
      })
    );
  }
}