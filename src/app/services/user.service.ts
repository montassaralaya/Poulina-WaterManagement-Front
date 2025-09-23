import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
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

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    console.log('[UserService] Sending GET request to /me');
    return this.http.get<UserProfile>(`${this.baseUrl}/me`);
  }
}
