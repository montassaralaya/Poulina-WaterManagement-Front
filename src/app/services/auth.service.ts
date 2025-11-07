import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { UserProfile } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7003/api/Auth';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

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

  debugToken(): void {
    const token = this.getToken();
    console.log('Token from localStorage:', token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expiration:', new Date(payload.exp * 1000));
        
        // Log all available claims for debugging
        console.log('Available token claims:');
        Object.keys(payload).forEach(key => {
          console.log(`  ${key}:`, payload[key]);
        });
      } catch (e) {
        console.log('Token is not a JWT or cannot be decoded');
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    console.log('[AuthService] Login attempt for:', email);
    
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        console.log('[AuthService] Raw login response:', response);
        
        let token: string | null = null;
        
        if (response.token) {
          token = response.token;
        } else if (response.accessToken) {
          token = response.accessToken;
        } else if (response.access_token) {
          token = response.access_token;
        } else if (response.data?.token) {
          token = response.data.token;
        }
        
        if (token) {
          this.setToken(token);
          console.log('[AuthService] Token set successfully:', this.getToken());
        } else {
          console.error('[AuthService] No token found in response. Full response:', response);
          throw new Error('No authentication token received from server');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[AuthService] Login error:', error);
        let errorMsg = 'Login failed';
        
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          try { 
            const parsed = JSON.parse(error.error);
            errorMsg = parsed.message || errorMsg;
          } catch {
            errorMsg = error.error;
          }
        } else if (error.status === 401) {
          errorMsg = 'Invalid email or password';
        } else if (error.status === 0) {
          errorMsg = 'Cannot connect to server. Make sure the microservice is running.';
        }
        
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  testBackendConnection(): void {
    const token = this.getToken();
    console.log('=== BACKEND CONNECTION TEST ===');
    console.log('Token:', token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Username from token:', payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']);
        console.log('Role from token:', payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
        
        // Log all available claims for debugging
        console.log('All available claims:');
        Object.keys(payload).forEach(key => {
          console.log(`  ${key}:`, payload[key]);
        });
      } catch (e) {
        console.log('Error decoding token:', e);
      }
    }
    
    // Test if we can manually call the API
    if (token && this.isBrowser) {
      fetch('https://localhost:7003/api/User/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log('Manual fetch response status:', response.status);
        console.log('Manual fetch response headers:', response.headers);
        return response.text();
      })
      .then(data => {
        console.log('Manual fetch response data:', data);
        try {
          const parsedData = JSON.parse(data);
          console.log('Manual fetch parsed data:', parsedData);
        } catch (e) {
          console.log('Manual fetch response is not JSON:', data);
        }
      })
      .catch(error => {
        console.error('Manual fetch error:', error);
      });
    } else {
      console.log('No token available for manual fetch test');
    }
  }

  getUserFromToken(): UserProfile | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[AuthService] Extracting user from token payload:', payload);
      
      // Extract username from token
      const username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
                      payload.preferred_username || 
                      payload.unique_name || 
                      'User';
      
      // Try to extract first and last name from username
      // Common pattern: "alaya.montassar" -> firstName: "Alaya", lastName: "Montassar"
      // Or "alaya123" -> firstName: "Alaya", lastName: ""
      let firstName = 'User';
      let lastName = '';
      
      if (username && username !== 'User') {
        // If username contains a dot, split into first and last name
        if (username.includes('.')) {
          const nameParts = username.split('.');
          firstName = this.capitalizeFirstLetter(nameParts[0]);
          lastName = nameParts.length > 1 ? this.capitalizeFirstLetter(nameParts[1]) : '';
        } 
        // If username contains numbers, try to extract the name part
        else if (/\d/.test(username)) {
          // Remove numbers and capitalize
          const namePart = username.replace(/\d/g, '');
          firstName = this.capitalizeFirstLetter(namePart);
        }
        // Otherwise, use the username as first name
        else {
          firstName = this.capitalizeFirstLetter(username);
        }
      }
      
      const userProfile: UserProfile = {
        id: payload.sub || 'unknown',
        username: username,
        firstName: firstName,
        firstName2: firstName, // Add this line to include firstName2
        lastName: lastName,
        email: payload.email || 
              payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
              '',
        role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
             payload.role || 
             'User',
        phone: payload.phone_number || 
              payload.phone || 
              payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] || 
              undefined
      };
      
      console.log('[AuthService] User profile from token:', userProfile);
      return userProfile;
      
    } catch (e) {
      console.error('[AuthService] Error decoding token:', e);
      return null;
    }
  }

  // Helper method to capitalize first letter
  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Additional helper method to check token expiration
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiration;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true;
    }
  }

  // Method to get remaining token time in minutes
  getTokenTimeRemaining(): number {
    const token = this.getToken();
    if (!token) return 0;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000;
      const remaining = expiration - Date.now();
      return Math.max(0, Math.round(remaining / 60000)); // Convert to minutes
    } catch (e) {
      console.error('Error calculating token time remaining:', e);
      return 0;
    }
  }
}