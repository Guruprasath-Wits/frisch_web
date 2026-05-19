import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-paypal-subscription-success',
  templateUrl: './paypal-subscription-success.component.html',
  styleUrls: ['./paypal-subscription-success.component.css']
})
export class PaypalSubscriptionSuccessComponent implements OnInit {
  paymentId: string | null = null;
  typeId: string | null = null;
  message: string = 'Processing your subscription...';
  userId: string | null = null;
  orderData: any = null; // Add this property and assign it as needed

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {
  // Get the full orderData from localStorage
  const orderDataString = localStorage.getItem("subscriptionOrderData");
  const orderData: any = orderDataString ? JSON.parse(orderDataString) : null;

  if (orderData && orderData.user_id && orderData.productDetails?.length) {
    // Build payload for backend
    const payload = {
      paymentId: localStorage.getItem("paypalPaymentId") || `SUB-${Date.now()}`, // fallback unique ID
      typeId: localStorage.getItem("paypalTypeId") || undefined,
      user_id: localStorage.getItem("userId"),
      productDetails: orderData.productDetails || [],
      iban: orderData.iban,
      delivery_date: orderData.delivery_date || undefined,
      tips: orderData.tips || 0,
      deliveryFee: orderData.deliveryFee || 0,
      price: orderData.price || 0,
      instruction: orderData.instruction || undefined,
      paymentType: orderData.paymentType || "PayPal",
       address: orderData.address || undefined,   // added address
      contact: orderData.contact || undefined ,   // added contact
    };
    this.userId = localStorage.getItem("userId");

    // Call backend to save subscription
 this.dataService.savePaypalSubscription(payload).subscribe({
      next: (res) => {
        console.log("✅ Backend responded:", res);
        // this.message = '✅ Your subscription has been activated!';
        this.clearSubscriptionCartAndNotify();

        // Clear only the main subscription data
        localStorage.removeItem("subscriptionOrderData");
      },
      error: (err) => {
        console.error("⚠️ Subscription save failed:", err);
        this.message = '⚠️ Failed to save subscription. Please contact support.';
      },
      complete: () => {
        console.log("Request completed");
      }
    });


  } else {
    this.message = '⚠️ Subscription details not found. Please try again.';
  }
}



// confirmPaypalSubscription() {
//   this.dataService.savePaypalSubscription({
//     paymentId: this.paymentId!,
//     typeId: this.typeId!,
//     userId: this.userId,
//     orderData: this.orderData   // 👈 pass order details here!
//   }).subscribe({
//     next: () => {
//       Swal.fire({
//         title: 'Erfolg!',
//         text: 'Ihre Dauerbestellung wurde erfolgreich bestätigt.',
//         icon: 'success',
//         showConfirmButton: false,
//       });
//       this.clearSubscriptionCartAndNotify();
//     },
//     error: () => {
//       Swal.fire('Fehler!', 'PayPal Bestellung konnte nicht gespeichert werden!', 'error');
//     }
//   });
// }


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

          // ✅ Notify admin
          this.dataService.notifyToAdmin(notification).subscribe(
            (response) => {
              if (response.status) {
                console.log("Admin notified");
              }
            },
            (error) => console.error("Failed to notify admin", error)
          );

          // ✅ Remove subscription data from localStorage
          localStorage.removeItem('subscriptionOrderId');
          localStorage.removeItem('subscriptionTotalAmount');

          // ✅ Navigate & refresh dashboard
           this.dataService.cartLoad1.next(true);
            this.cdr.detectChanges();
          // this.router.navigateByUrl('/subscribe-order-dashboard').then(() => {
          //   setTimeout(() => {
          //     window.location.reload();
          //     this.cdr.detectChanges();
          //   }, 1500);
          // });
        }
      },
      (error) => console.error("Failed to clear cart", error)
    );
  }
}
