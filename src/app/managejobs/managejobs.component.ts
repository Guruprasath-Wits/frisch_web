import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { catchError } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-managejobs',
  templateUrl: './managejobs.component.html',
  styleUrls: ['./managejobs.component.css']
})
export class ManagejobsComponent implements OnInit {
  constructor(private dataService: DataService) { }

  isModalOpen: boolean = false;

  ordersData: any[] = []
  userId: any
  orderDetails: any[] = []
  userData: any = {}

  paginatedOrders: any[] = [];
  itemsPerPage = 3;
  currentPage = 1;
  totalPages = 0;

  ngOnInit(): void {
    this.loadUserData()
    this.loadOrdersData()
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.ordersData.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrders = this.ordersData.slice(startIndex, endIndex);
    console.log(this.paginatedOrders)
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  formatToLocalDate(utcDate: string): string {
    const date = new Date(utcDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  loadOrdersData() {
    this.userId = localStorage.getItem('userId');
    this.dataService.getOrdersData(this.userId).subscribe(
      (response) => {
        if (response.status) {
    this.ordersData = response.orders.filter((order: any) => {
      const status = (order.status || '').toLowerCase();
      const paymentStatus = order.payment_status;
      const price = order.price;
      return (
        (paymentStatus === null  && price == 0) || // Sample Order
        // (paymentStatus === 'success' && status !== 'cancelling') // Successful Order
        (paymentStatus === 'success' && status !== 'cancelling' && status !== null && status !== '') // Successful Order

      );
    });


          console.log(this.ordersData)
          // Format dates
          this.ordersData.forEach(item => {
            item.delivery_date = this.formatToLocalDate(item.delivery_date);
            item.created_at = this.formatToLocalDate(item.created_at);
          });
  
          // Load ordered products
          this.loadOrderedProducts();
  
          // Update pagination
          this.updatePagination();
  
          console.log(this.ordersData);
        }
      },
      (error) => {
        console.log("Failed to extract orders!!!", error);
      }
    );
  }
  


  loadOrderedProducts() {
    const orderDetailsData = this.ordersData.map((order: any) =>
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
      this.ordersData = enrichedOrders;
      console.log(this.ordersData);
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

  closeModal() {
    this.isModalOpen = false;
    this.orderDetails = [];
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

  cancelOrder(orderId: string) {

    console.log("-----",orderId);    

    const notification = {
      title: "Termination!",
      desc: `${this.userData.username} has terminated their subscription.`,
      status: 'unread',
    };

    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();
  
    const friday = 5; 
    const fridayDeadlineTime = 16 * 60;
  
    if (currentDay > friday || (currentDay === friday && currentTime >= fridayDeadlineTime)) {
      Swal.fire({
        title: "Nicht erlaubt!",
        text: "Eine Stornierung der Bestellung ist nur vor Freitag, 16:00 Uhr möglich.",
        icon: "error",
      });
      return;
    }
    Swal.fire({
      title: "Bist du sicher?",
      text: "Möchten Sie Ihre Bestellung stornieren?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ja",
      cancelButtonText: "Abbrechen"
    })
    .then((result) => {
      if (result.isConfirmed) {
        this.dataService.cancellingOrder(orderId).subscribe(
          (response) => {
            if (response.status) {
              Swal.fire({
                title: "Abgesagt!",
                text: "Ihre Bestellung wurde erfolgreich storniert.",
                icon: "success",
              });

              this.dataService.notifyToAdmin(notification).subscribe(
                (notifyResponse) => {
                  if (notifyResponse.status) {
                    console.log("Notification sent to admin successfully.");
                    this.loadOrdersData();
                  }
                },
                (error) => {
                  console.log("Failed to send notification to admin.", error);
                }
              );
              this.loadOrderedProducts();
            }
          },
          (error)=>{
            Swal.fire({
              title: "Fehler!",
              text: "Keine Bestellung gefunden oder konnte nicht beendet werden.",
              icon: "error",
            });
            console.error("Order Cancel error:", error);
          }
        )
      }
    });
  }

}
