import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';

@Component({
  selector: 'app-unzer-success',
  templateUrl: './unzer-success.component.html',
  styleUrls: ['./unzer-success.component.css']
})
export class UnzerSuccessComponent implements OnInit {
  isLoading: boolean = true;
  constructor(private route: ActivatedRoute, private http: HttpClient, private dataService: DataService, private router: Router) { }

  // ngOnInit(): void {
  //   const orderId = this.route.snapshot.queryParamMap.get('orderId');
  //   // const paymentId = this.route.snapshot.queryParamMap.get('paymentId');  // Ensure you're passing it during redirect
  //   const paymentId = localStorage.getItem('paymentId');
  //   if (orderId && paymentId) {
  //     this.http.post(`${this.dataService.apiUrl}payment-success`, { orderId, paymentId })
  //       .subscribe(
  //         async () => {
  //           // 🔄 Clear Cart Logic
  //           const userId = localStorage.getItem('userId');
  //           const cartData = await this.dataService.getCartData(userId).toPromise();
  //           for (const item of cartData.card || []) {
  //             await this.dataService.deleteCartData(item.id).toPromise();
  //           }
  //           this.dataService.cartCleared$.next(true);
  //           localStorage.removeItem('paymentId');
  //         },
  //         error => {
  //           console.error('❌ Error confirming Unzer payment:', error);
  //         }
  //       );
  //   }
  // }

  ngOnInit(): void {
    const orderId = this.route.snapshot.queryParamMap.get('orderId');
    const paymentId = this.route.snapshot.queryParamMap.get('paymentId');

    // ✅ If Unzer did not provide paymentId, fallback from localStorage
    const finalPaymentId = paymentId || localStorage.getItem('paymentId');

    if (orderId && finalPaymentId) {
      this.http.post<any>(`${this.dataService.apiUrl}api/verify-payment`, {
        orderId,
        paymentId: finalPaymentId
      }).subscribe(
        (res) => {
          // If the backend verification confirms the payment was successful
          if (res.success) {
            console.log("✅ Payment Verified as Successful!");
            this.isLoading = false;
            localStorage.removeItem('paymentId');

            // This alerts the UI components (like header cart icon) that cart is cleared
            if (this.dataService.cartCleared$) {
              this.dataService.cartCleared$.next(true);
            }
          } else {
            // Payment verified as Failed or Pending. Redirect to failure page.
            console.warn("⚠️ Payment verification not successful:", res.msg);
            this.router.navigate(['unzer-failure'], { queryParams: { orderId } });
          }
        },
        err => {
          console.error('❌ Verification API call failed', err);
          this.router.navigate(['unzer-failure'], { queryParams: { orderId } });
        }
      );
    }
  }
}