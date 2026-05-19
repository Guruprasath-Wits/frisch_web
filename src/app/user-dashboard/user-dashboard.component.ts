import { Component } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent {
  constructor(private dataService: DataService) { }

  userId: any
  settings: any = {}
  userData: any = {}
  orders: any[] = []

  pendingOrder: number = 0
  deliveredOrder: number = 0

  ngOnInit() {
    this.loadSettingsData();
    this.loadUserData();
    this.loadOrdersData();
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

  loadOrdersData() {
    this.userId = localStorage.getItem('userId');
    this.dataService.getOrdersData(this.userId).subscribe(
      (response) => {
        if (response.status) {
          this.orders = response.orders
          console.log(this.orders);
          this.orders.map((item) => {
            if (item.status == "pending") {

            }
          })
        }
      },
      (error) => {
        console.log("Failed to extract orders!!!", error);

      }
    )
  }

}
