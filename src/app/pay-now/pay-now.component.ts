import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';


declare var window: any;

@Component({
  selector: 'app-pay-now',
  templateUrl: './pay-now.component.html',
  styleUrls: ['./pay-now.component.css'],
})
export class PayNowComponent implements OnInit {
  orderId: string = '';
  amount: number = 0;
  userId: string = '';
  payPageId: string = '';
  isLoading = false;
  apiUrl = this.dataService.apiUrl

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private dataService: DataService
  ) { }



  loadUserData() {
    this.isLoading = true;
    this.loginData = localStorage.getItem('loginData');
    this.password = JSON.parse(this.loginData)?.password;
    this.dataService.getUserData(this.userId).subscribe(
      (response) => {
        if (response.status) {
          this.userData = response.user;
          console.log(this.userData);
        }
      },
      (error) => {
        console.log("Error in Fetching User Data:" + error);
      }
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      this.orderId = params['orderId'];
      this.amount = +params['amount'];
      this.userId = params['userId'];

      // Load user data
      this.loadUserData();

      // Wait until userData is loaded before proceeding
      setTimeout(async () => {
        const user = this.userData;

        const customerData = {
          firstname: user.fname || 'N/A',
          lastname: user.lname || 'N/A',
          email: user.email || 'noemail@example.com',
          birthDate: user.dob || '2000-01-01',
          billingAddress: {
            name: `${user.fname} ${user.lname}`,
            street: user.address || 'Default Street 1',
            zip: user.zipcode || '10115',
            city: user.subtown || 'Berlin',
            country: 'DE', // Germany
          },
          shippingAddress: {
            name: `${user.fname} ${user.lname}`,
            street: user.address || 'Default Street 1',
            zip: user.zipcode || '10115',
            city: user.subtown || 'Berlin',
            country: 'DE', // Germany
            shippingType: 'equals-billing',
          },
        };

        const basketData = {
          amountTotalGross: this.amount,
          amountTotalVat: 0,
          currencyCode: 'EUR',
          orderId: this.orderId,
          basketItems: [
            {
              basketItemReferenceId: this.orderId,
              quantity: 1,
              amountGross: this.amount,
              amountNet: this.amount,
              amountVat: 0,
              title: 'Order from FrischFürSie',
              type: 'goods',
            },
          ],
        };

        try {

          // [MODIFIED BY CO-PILOT 2026-02-01]: Changed returnUrl to backend redirect

          // OLD LOGIC (Direct to Frontend)
          const response: any = await this.http.post(`${this.apiUrl}api/init-payment`, {
            customerData,
            basketData,
            returnUrl: `https://frischfuersie.de/unzer-success?orderId=${this.orderId}`,
            redirectUrl: `https://frischfuersie.de/unzer-failure?orderId=${this.orderId}`,
            // returnUrl: `http://localhost:4200/unzer-success?orderId=${this.orderId}`,
            // redirectUrl: `http://localhost:4200/unzer-failure?orderId=${this.orderId}`,
          })
            .toPromise();


          // NEW LOGIC (Via Backend Redirect)
          // const response: any = await this.http.post(`${this.apiUrl}api/init-payment`, {
          //   customerData,
          //   basketData,
          //   // returnUrl: `${this.apiUrl}api/payment-redirect?orderId=${this.orderId}`,
          //   // redirectUrl: `${this.apiUrl}api/payment-redirect?orderId=${this.orderId}&status=cancelled`,
          //   returnUrl: `https://frischfuersie.de/unzer-success?orderId=${this.orderId}`,
          //   redirectUrl: `https://frischfuersie.de/unzer-failure?orderId=${this.orderId}`,
          //   // returnUrl: `http://localhost:4200/unzer-success?orderId=${this.orderId}`,
          //   // redirectUrl: `http://localhost:4200/unzer-failure?orderId=${this.orderId}`,
          // })
          //   .toPromise();

          this.payPageId = response.payPageId;


          await this.loadUnzerScript();
          this.initUnzerCheckout();

        } catch (err) {
          console.error('Error initiating payment:', err);
        }

      }, 500); // Wait for loadUserData to complete
    });
  }



  userData: any = {}
  password: any
  loginData: any

  async loadUnzerScript() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://static.unzer.com/v1/checkout.js';
      script.onload = resolve;
      document.body.appendChild(script);
      this.isLoading = false; // Show loader while script is loading
    });
  }

  initUnzerCheckout() {
    // const checkout = new window.checkout(this.payPageId);
    //  const checkout = new window.checkout(this.payPageId, {
    //     allowedPaymentMethods: ['card', 'googlepay', 'applepay', 'paypal'] // Exclude 'sepa'
    //   });
    const checkout = new window.checkout(this.payPageId);
    if (!checkout || typeof checkout.init !== 'function') {
      console.error('❌ checkout.init() is not a function.');
      return;
    }

    const initResult = checkout.init();

    if (initResult && typeof initResult.then === 'function') {
      initResult.then(() => {
        const openResult = checkout.open();

        if (openResult && typeof openResult.then === 'function') {
          openResult.then(() => {
            this.isLoading = false;
          });
        } else {
          this.isLoading = false;
        }


        checkout.success((result: any) => {
          console.log('✅ Payment Success Result:', result);

          const paymentId = result?.resources?.paymentId;
          const isSuccess = result?.isSuccess || false;
          const orderId = this.orderId;

          // 🔑 Always store paymentId if present (PayPal gives this early)
          if (paymentId) {
            localStorage.setItem('paymentId', paymentId);
          }

          // ✅ If Unzer confirms success (Card or PayPal after approval)
          if (isSuccess) {
            if (paymentId) {
              this.router.navigate(['unzer-success'], {
                queryParams: { orderId, paymentId }
              });
            } else {
              // Should not happen, but safe fallback
              this.router.navigate(['unzer-failure'], { queryParams: { orderId } });
            }
          } else {
            // ⚠️ Special handling for PayPal
            if (paymentId) {
              // 👉 PayPal flow: paymentId received but user has not approved yet
              console.log('🕒 PayPal pending approval. Waiting for redirect...');
              // ✅ Do NOT navigate yet. Let PayPal redirect back after approval.
              return;
            } else {
              // 👉 Failure (no paymentId and no success)
              this.router.navigate(['unzer-failure'], { queryParams: { orderId } });
            }
          }
        });

        checkout.abort(() => {
          this.router.navigate(['unzer-failure'], {
            queryParams: { orderId: this.orderId }
          });
        });

        checkout.error(() => {
          this.router.navigate(['unzer-failure'], {
            queryParams: { orderId: this.orderId }
          });
        });

      });
    } else {
      console.error('❌ checkout.init() did not return a Promise.');
    }
  }



}