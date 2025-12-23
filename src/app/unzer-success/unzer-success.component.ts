import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';

@Component({
  selector: 'app-unzer-success',
  templateUrl: './unzer-success.component.html',
  styleUrls: ['./unzer-success.component.css']
})
export class UnzerSuccessComponent implements OnInit {
  constructor(private route: ActivatedRoute, private http: HttpClient, private dataService: DataService) {}

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
    this.http.post(`${this.dataService.apiUrl}api/verify-payment`, {
      orderId,
      paymentId: finalPaymentId
    }).subscribe(
      () => {},
      err => console.error('Verification failed', err)
    );
  }

}
}