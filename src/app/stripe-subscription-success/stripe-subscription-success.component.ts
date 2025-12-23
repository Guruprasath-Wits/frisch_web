import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';

@Component({
  selector: 'app-stripe-subscription-success',
  templateUrl: './stripe-subscription-success.component.html',
  styleUrls: ['./stripe-subscription-success.component.css']
})
export class StripeSubscriptionSuccessComponent implements OnInit{
  subscriptionOrderId : any
  totalAmount : any
  userId : any

  fileUrl = this.dataService.fileUrl;
  apiUrl = this.dataService.apiUrl

  constructor(private route: ActivatedRoute, private http: HttpClient,  private dataService: DataService) {}

  ngOnInit() {
    this.subscriptionOrderId = localStorage.getItem('subscriptionOrderId');
    this.totalAmount = Number(localStorage.getItem('subscriptionTotalAmount'));
    this.userId = localStorage.getItem('userId');
  
    console.log("Subscription Order ID:", this.subscriptionOrderId);
    console.log("Total Amount:", this.totalAmount);
    console.log("User ID:", this.userId);
  
    this.clearSubscriptionCartAndNotify();
  }

  clearSubscriptionCartAndNotify() {
    if (!this.userId) return;
  
    this.dataService.deleteUserProductFromCart(this.userId).subscribe(
      (response) => {
        if (response.status) {
          console.log("Cart cleared successfully");
  
          const notification = {
            title: "New Subscription Order!",
            desc: `New Subscription Order By User ID: ${this.userId}`,
            status: 'unread'
          };
  
          // Notify admin
          this.dataService.notifyToAdmin(notification).subscribe(
            (response) => {
              if (response.status) {
                console.log("Admin notified");
              }
            },
            (error) => {
              console.log("Failed to notify admin", error);
            }
          );
  
          // ✅ Remove localStorage data after processing
          localStorage.removeItem('subscriptionOrderId');
          localStorage.removeItem('subscriptionTotalAmount');
  
          // Redirect user to dashboard
          // this.router.navigate(['/userdashboard']);
        }
      },
      (error) => {
        console.log("Failed to clear cart");
      }
    );
  }
  ngOnDestroy() {
    localStorage.removeItem('subscriptionOrderId');
    localStorage.removeItem('subscriptionTotalAmount');
  }
}