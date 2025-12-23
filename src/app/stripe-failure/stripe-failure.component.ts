import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';
@Component({
  selector: 'app-stripe-failure',
  templateUrl: './stripe-failure.component.html',
  styleUrls: ['./stripe-failure.component.css']
})
export class StripeFailureComponent implements OnInit {

  fileUrl = this.dataService.fileUrl;
  apiUrl = this.dataService.apiUrl

  constructor(private route: ActivatedRoute, private http: HttpClient, private dataService: DataService) {}

  ngOnInit(): void {
    const order_id = this.route.snapshot.queryParams['order_id'];

    if (order_id) {
      this.http.post(this.apiUrl + 'payment-failure', { order_id })
        .subscribe(response => {
          console.log("Order marked as failed:", response);
        }, error => {
          console.error("Error updating order:", error);
        });
    }
  }

}
