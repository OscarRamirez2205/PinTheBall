import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

  credentials = {
    username: '',
    password: '',
  };

  login() {
    this.http.post(`${this.apiUrl}/login`, this.credentials).subscribe((res: any) => {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('userId', JSON.stringify(res.id));
    });
  }

}
