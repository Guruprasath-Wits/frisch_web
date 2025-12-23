import { Component } from '@angular/core';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class DashboardSidebarComponent {
  constructor(private dataService: DataService, private authService: AuthService, private router:Router) { }

  userId: any
  settings: any = {}
  userData: any = {}

  loginStatus: boolean = false
  isLogin = this.authService.isLoggedIn
  private authSubcription!: Subscription

  ngOnInit() {
    this.loadSettingsData();
    this.loadUserData();

    
    this.authSubcription = this.authService.isLoggedIn.subscribe((status) => {
      this.loginStatus = status;
    })

  }

  ngOnDestroy() {
    this.authSubcription.unsubscribe();
  }

  logOut() {
    this.authService.logout()
    this.router.navigate(['/auth'])
    console.log("logout---");
  }

  loadSettingsData() {
    this.dataService.getSettingsData().subscribe(
      (response) => {
        if (response.status) {
          this.settings = response.setting[0];
          console.log(this.settings);
        }
      },
      (error) => {
        console.log('Error fetching data in settings:', error);
      }
    )
  }

  loadUserData() {
    this.userId = localStorage.getItem('userId');
    this.dataService.getUserData(this.userId).subscribe(
      (response) => {
        if (response.status) {
          this.userData = response.user;
          console.log(this.userData);
        }
      },
      (error) => {
        console.log("Error in Fetching User Data:" + error)
      }
    )
  }
}
