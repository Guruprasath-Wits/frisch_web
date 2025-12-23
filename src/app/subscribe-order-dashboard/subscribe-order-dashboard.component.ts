import { Component } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-subscribe-order-dashboard',
  templateUrl: './subscribe-order-dashboard.component.html',
  styleUrls: ['./subscribe-order-dashboard.component.css']
})
export class SubscribeOrderDashboardComponent {
  constructor(private dataService: DataService) { }

  isModalOpen: boolean = false;
  isNewModalOpen: boolean = false;

  subscriptionData: any[] = []
  userId: any
  orderDetails: any[] = []

  ngOnInit(): void {
    this.loadSubscriptionOrderData()
  }

  formatToLocalDate(utcDate: string): string {
    const date = new Date(utcDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  loadSubscriptionOrderData() {
    this.userId = localStorage.getItem('userId');
    this.dataService.subscriptionCheck(this.userId).subscribe(
      (response) => {
        if (response.status) {
          this.subscriptionData = response.subscribeData

          this.subscriptionData.map(item => {
            item.delivery_date = this.formatToLocalDate(item.delivery_date)
            item.vacation_start = this.formatToLocalDate(item.vacation_start)
            item.vacation_end = this.formatToLocalDate(item.vacation_end)
            item.created_at = this.formatToLocalDate(item.created_at)

            if (item.delivery_date >= item.vacation_start && item.delivery_date <= item.vacation_end) {
              item['vacationPause'] = true
            }

          })

          this.loadOrderedProducts()
          console.log(this.subscriptionData);
        }
      },
      (error) => {
        console.log("Failed to extract orders!!!", error);

      }
    )
  }


  loadOrderedProducts() {
    const orderDetailsData = this.subscriptionData.map((order: any) =>
      this.dataService.getOrderDetailsData(order.order_id).toPromise().then(
        (response) => {
          if (response.status) {
            order.orderDetails = response.orders || [];
          } else {
            order.orderDetails = []
          }
          return order
        },
        (error) => {
          console.log("Failed to fetch order details !!!", error);
          order.orderDetails = []
          return order
        }
      )
    );

    Promise.all(orderDetailsData).then((enrichedOrders) => {
      this.subscriptionData = enrichedOrders;
      console.log(this.subscriptionData);
    })
  }


  order: any[] = []
  openOrderDetails(order: any) {
    this.order = order;
    this.dataService.getOrderDetailsData(order.order_id).subscribe(
      (response: any) => {
        this.orderDetails = response.orders || [];
        this.isModalOpen = true;
      },
      (error) => {
        console.error("Error fetching order details:", error);
        this.isModalOpen = true;
      }
    );
  }
  openAllOrderDetails(order: any) {
   
    this.order = order;
    this.dataService.getOrderDeliveryDetailsData(order.id).subscribe(
      (response: any) => {
        this.orderDetails = response.subscribeData || [];
        this.isNewModalOpen = true;
      },
      (error) => {
        console.error("Error fetching order details:", error);
        this.isNewModalOpen = true;
      }
    );
  }

  closeModal() {
    this.isModalOpen = false;
    this.isNewModalOpen = false
    this.orderDetails = [];
  }
}
