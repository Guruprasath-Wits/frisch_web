import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';

@Component({
  selector: 'app-stripe-success',
  templateUrl: './stripe-success.component.html',
  styleUrls: ['./stripe-success.component.css']
})
export class StripeSuccessComponent implements OnInit{

  fileUrl = this.dataService.fileUrl;
  apiUrl = this.dataService.apiUrl

  constructor(private route: ActivatedRoute, private http: HttpClient,  private dataService: DataService) {}

  ngOnInit(): void {
    const session_id = this.route.snapshot.queryParams['session_id'];
    const order_id = this.route.snapshot.queryParams['order_id'];
    const userId = localStorage.getItem('userId');

    if (session_id && order_id && userId) {
        this.http.post(this.apiUrl + 'payment-success', { order_id, session_id })
            .subscribe(response => {
                console.log("✅ Order updated successfully:", response);

                // ✅ Step 1: Fetch the cart data
                this.dataService.getCartData(userId).subscribe(cartResponse => {
                    if (cartResponse.status && cartResponse.card.length > 0) {
                        const cartItems = cartResponse.card;

                        // ✅ Step 2: Delete each cart item
                        cartItems.forEach((item:any) => {
                            this.dataService.deleteCartData(item.id).subscribe(() => {
                                console.log(`✅ Deleted cart item with ID: ${item.id}`);

                                // ✅ Step 3: Emit event after all items are deleted
                                if (cartItems.indexOf(item) === cartItems.length - 1) {
                                    this.dataService.cartCleared$.next(true);
                                }
                            }, error => {
                                console.error(`❌ Error deleting cart item ${item.id}:`, error);
                            });
                        });
                    }
                });
            }, error => {
                console.error("❌ Error updating order:", error);
            });
    }
}

}
