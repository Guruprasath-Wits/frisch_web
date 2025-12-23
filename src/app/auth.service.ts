import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn = this.loggedIn.asObservable();

  constructor() { }

  login() {
    this.loggedIn.next(true);
    localStorage.setItem('isLoggedIn', 'true');
  }

  logout() {
    this.loggedIn.next(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.clear();
  }

  checkLoginStatus() {
    const status = localStorage.getItem('isLoggedIn') === 'true';
    this.loggedIn.next(status);
    return status
  }

}
