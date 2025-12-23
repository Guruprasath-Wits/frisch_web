import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { Route, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-free-trail',
  templateUrl: './free-trail.component.html',
  styleUrls: ['./free-trail.component.css']
})
export class FreeTrailComponent implements OnInit {

  constructor(private authService: AuthService,private dataService: DataService, private route: Router) { }

  fileUrl = this.dataService.fileUrl;
  freeTrails: any[] = []
  isLoggedIn: boolean = false;
  productIds: any[] = []
  products: any[] = []
  userId = localStorage.getItem('userId');

  ordersData: any[] = [];
  sampleOrderOccur: boolean = false;

  currentIndex = 0;
  i = 0;

  ngOnInit(): void {
    this.loadOrdersData();
    this.loadSampleProducts();
  }

  checkLogin() {
    this.isLoggedIn = !!localStorage.getItem('userToken'); // Example condition
  }

 loadSampleProducts(): void {
  this.dataService.getSampleProductsData().subscribe(
    (response) => {
      if (response.status) {
        this.freeTrails = response.sampleOrder;
        console.log(this.freeTrails);

        // You already have product name/id with each freeTrail
        // If you want to show all products together in carousel, flatten them:
        
        this.products = this.freeTrails.flatMap(item =>
          item.products.map((product: any) => ({
            ...product,
            description: item.description // Optional: attach description if needed
          }))
        );

        console.log(this.products);
      }
    },
    (error) => {
      console.log("Error in fetching sample orders: " + error);
    }
  )
}

  formatDescription(description: string): string {
    const lines = description.split('\n');
    if (lines.length > 0) {
      lines[0] = `<h1 class="sample-note-head">${lines[0]}</h1>`;
    }
    return lines.join('<br>');
  }
  
  fetchProductData(productIds: number[]): void {
    this.products = [];
    const productMap = new Map();
  
    productIds.forEach(id => {
      this.dataService.getProductById(id).subscribe(
        (response) => {
          if (response.status) {
            productMap.set(id, response.product);
  
            if (productMap.size === productIds.length) {
              this.products = this.freeTrails.map(trail => ({
                ...productMap.get(trail.product_id),
                description: trail.description
              }));
              console.log(this.products);
            }
          }
        },
        (error) => {
          console.log("Error while fetching..." + error);
        }
      );
    });
  }
  
  freeTrail(cardId: any) {
  this.authService.isLoggedIn.pipe(take(1)).subscribe((loggedIn: boolean) => {
    if (loggedIn) {
      if (this.sampleOrderOccur) {
        Swal.fire({
          // title: 'Kostenlose Probe bereits gebucht',
          text: 'Sie haben bereits eine kostenlose Probe bestellt.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
        return;
      }

      this.userId = localStorage.getItem('userId');
      // this.route.navigate(['/sample-order', cardId]);
      this.goToSampleOrder(cardId, 1);
      // this.route.navigate(['/sample-order', cardId], { queryParams: { type: 1 } });
    } else {
      Swal.fire({
        title: 'Anmeldung erforderlich',
        text: 'Melden Sie sich an, um den kostenloseprobe in Ihrem Warenkorb hinzuzufügen.',
        icon: 'warning',
        confirmButtonText: 'OK'
      }).then(() => {
        this.route.navigate(['/auth']);
      });
    }
  });
}
goToSampleOrder(cardId: number, type: number = 2) {
    this.route.navigate(['/sample-order', cardId], { queryParams: { type } });
}


loadOrdersData() {
  this.userId = localStorage.getItem('userId');
  this.dataService.getOrdersData(this.userId).subscribe(
    (response) => {
      if (response.status) {
        this.ordersData = response.orders;
        console.log(this.ordersData )

        // Check if any order has price 0 and payment_status null
        const existingTrial = this.ordersData.some((order: any) => 
          order.price === '0' && order.payment_status === null && order.status.toLowerCase() !== "cancelling"
        );
        console.log(existingTrial)
        this.sampleOrderOccur = existingTrial;
        console.log('Sample Order Already Exists:', this.sampleOrderOccur);
      }
    },
    (error) => {
      console.log("Failed to extract orders!!!", error);
    }
  );
}

// currentIndex = 0;

next(): void {
  if (this.currentIndex < this.freeTrails.length - 1) {
    this.currentIndex++;
  }
}

prev(): void {
  if (this.currentIndex > 0) {
    this.currentIndex--;
  }
}

goToSlide(index: number): void {
  if (index >= 0 && index < this.freeTrails.length) {
    this.currentIndex = index;
  }
}

  
  

}