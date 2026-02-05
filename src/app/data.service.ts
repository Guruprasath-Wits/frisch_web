import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  getSettings() {
    throw new Error('Method not implemented.');
  }

  cartLoad = new BehaviorSubject("false")

  // public apiUrl = 'https://api.frischfuersie.de/';
  // public fileUrl = 'https://api.frischfuersie.de';
  public apiUrl = 'http://localhost:4001/';
  public fileUrl = 'http://localhost:4001';
  stripe: any;
  private cartCleared = new BehaviorSubject<boolean>(false);
  cartCleared$ = new BehaviorSubject<boolean>(false);

  cartLoad1 = new Subject<boolean>();

  // public isLogged: boolean = false;

  constructor(private http: HttpClient) {
    this.cartLoad?.next("false")
  }

  //  getCartDatas(userId: string) {
  //   return this.http.get<any>(this.apiUrl + `cart/userCart/${userId}`);
  // }



  // public isLoggedIn() {
  //   this.isLogged = !!localStorage.getItem('userId');
  //   return this.isLogged
  // }

  public getCategoryData(): Observable<any> {
    return this.http.get(this.apiUrl + 'category/read');
  }

  public getSettingsData(): Observable<any> {
    return this.http.get(this.apiUrl + 'setting/read');
  }

  public getDeliveryAreas(): Observable<any> {
    return this.http.get(this.apiUrl + 'deliveryArea/read');
  }

  public getFaqData(): Observable<any> {
    return this.http.get(this.apiUrl + "faq/read");
  }

  public getUserAdvantage(): Observable<any> {
    return this.http.get(this.apiUrl + 'userAdv/read');
  }

  public getProductsData(): Observable<any> {
    return this.http.get(this.apiUrl + 'product/read');
  }

  public getComboData(): Observable<any> {
    return this.http.get(this.apiUrl + 'combo');
  }

  public getComboById(comboId: number): Observable<any> {
    return this.http.get(this.apiUrl + `combo/${comboId}`);
  }

  public getProductById(productId: number): Observable<any> {
    return this.http.get(this.apiUrl + `product/read/${productId}`)
  }

  public getDeliveryAreasData(): Observable<any> {
    return this.http.get(this.apiUrl + 'deliveryArea/read');
  }

  public getSampleProductsData(): Observable<any> {
    return this.http.get(this.apiUrl + "sampleOrder/read");
  }
  public getSampleProductsDataByID(orderId: any): Observable<any> {
    return this.http.get(this.apiUrl + `sampleOrder/read/${orderId}`);
  }

  public CreateUser(UserData: any): Observable<any> {
    return this.http.post(this.apiUrl + "users/register", UserData)
  }

  public loadImprint(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}impressum/read`);
  }

  public VerifyOtp(UserData: any): Observable<any> {
    return this.http.post(this.apiUrl + "users/verify", UserData)
  }

  public LoginUser(UserData: any): Observable<any> {
    return this.http.post(this.apiUrl + "users/login", UserData)
  }

  public resetPassword(email: any): Observable<any> {
    return this.http.post(this.apiUrl + "users/forgetPass", { email })
  }

  public updatePassword(requestData: any): Observable<any> {
    return this.http.post(this.apiUrl + "users/updatePass", requestData)
  }

  public addToCart(CartData: any): Observable<any> {
    return this.http.post(this.apiUrl + "cart/create", CartData)
  }

  public updateCartQuantity(data: any): Observable<any> {
    return this.http.post(this.apiUrl + `cart/update`, data);
  }

  public getCartData(userId: any): Observable<any> {
    return this.http.get(this.apiUrl + `cart/userCart/${userId}`);
  }

  validateIban(payload: { iban: string, customerName: string }) {
    return this.http.post(this.apiUrl + 'validate-iban', payload);
  }

  public deleteCartData(cartId: any): Observable<any> {
    return this.http.post(this.apiUrl + `cart/delete/${cartId}`, {});
  }

  public deleteUserProductFromCart(userId: any): Observable<any> {
    return this.http.post(this.apiUrl + `cart/deleteCart/${userId}`, {});
  }

  public getUserData(userId: any): Observable<any> {
    return this.http.get(this.apiUrl + `users/read/${userId}`);
  }

  public confirmOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl + "orders/create", orderData);
  }

  // public confirmOrder(orderData: any): void {
  //   const url = `${this.apiUrl}pay?${new URLSearchParams(orderData).toString()}`;
  //   window.open(url, "_blank"); // Opens in a new tab
  // }


  public subscriptionOrder(subscribeData: any): Observable<any> {
    return this.http.post(this.apiUrl + "all_subscribe-orders/create", subscribeData);
  }

  public createPaypalReference(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl + "all_subscribe_paypal", orderData);
  }

  public notifyToAdmin(notification: any): Observable<any> {
    return this.http.post(this.apiUrl + "notifications/create", notification);
  }


  public createaddress(data: any): Observable<any> {
    return this.http.post(this.apiUrl + "address/create", data)
  }

  public getAddress(): Observable<any> {
    return this.http.get(this.apiUrl + "address/read")
  }

  public deleteAddress(id: any): Observable<any> {
    return this.http.post(this.apiUrl + "address/delete/" + id, {})
  }

  public getJobsData(): Observable<any> {
    return this.http.get(this.apiUrl + 'jobs/read');
  }

  public getOrdersData(userId: any): Observable<any> {
    return this.http.get(this.apiUrl + `orders/read/${userId}`);
  }

  public getOrderDataByOrderId(orderId: any): Observable<any> {
    return this.http.get(this.apiUrl + `all_subscribe-orders/readOrder/${orderId}`);
  }

  public updateSubscribeOrder(orderId: any, updatedData: any): Observable<any> {
    return this.http.post(this.apiUrl + `all_subscribe-orders/updateOrder/${orderId}`, updatedData)
  }

  public subscriptionCheck(userId: any): Observable<any> {
    return this.http.get(this.apiUrl + `all_subscribe-orders/read/${userId}`);
  }

  public getSubscriptionOrderData(subscribeData: any): Observable<any> {
    return this.http.get(this.apiUrl + "all_subscribe-orders/readAll", subscribeData);
  }
  public getOrderDeliveryDetailsData(orderId: any): Observable<any> {
    return this.http.get(this.apiUrl + `subscribe-orders/Deliveryread/${orderId}`)
  }

  public getOrderDetailsData(orderId: any): Observable<any> {
    return this.http.get(this.apiUrl + `orders/orderDetails/${orderId}`)
  }

  public updateUserData(userId: any, updatedUserData: any): Observable<any> {
    return this.http.put(this.apiUrl + `users/update/${userId}`, updatedUserData)
  }

  public contractTerminate(userId: any, terminateData: any): Observable<any> {
    return this.http.post(this.apiUrl + `all_subscribe-orders/terminate/${userId}`, terminateData);
  }

  public vacationPause(userId: any, vacationData: any): Observable<any> {
    return this.http.post(this.apiUrl + `all_subscribe-orders/vacation-pause/${userId}`, vacationData)
  }

  public submitContact(contactData: any): Observable<any> {
    return this.http.post(this.apiUrl + "contactUs/create", contactData)
  }

  public cancellingOrder(orderId: any): Observable<any> {
    return this.http.post(this.apiUrl + `orders/cancel/${orderId}`, {})
  }

  public applyForJob(jobDetails: any): Observable<any> {
    return this.http.post(this.apiUrl + "jobs/apply", jobDetails);
  }

  async makePayment() {
    const response = await fetch(this.apiUrl + 'api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }) // Amount in cents
    });

    const { clientSecret } = await response.json();

    const result = await this.stripe.confirmCardPayment(clientSecret);

    if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      console.log('Payment Success');

      // Save payment status to backend
      await fetch(this.apiUrl + 'api/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: '12345',
          payment_status: 'succeeded'
        })
      });

    } else {
      console.error('Payment Failed', result.error);
    }
  }

  savePaypalSubscription(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}save-paypal-subscription`, payload);
  }



  public postMissingProduct(data: any): Observable<any> {
    return this.http.post(this.apiUrl + "missingProduct/create", data);
  }

}


