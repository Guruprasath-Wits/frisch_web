import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-our-products',
  templateUrl: './our-products.component.html',
  styleUrls: ['./our-products.component.css']
})
export class OurProductsComponent implements OnInit {
  initialCategoryId: any;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  isLogin = localStorage.getItem('isLoggedIn');
  products: any[] = [];
  categories: any[] = [];
  fileUrl: any = this.dataService.fileUrl;

  filteredProducts: any[] = [];
  selectedCategories: number[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 0;

  cartData: any[] = [];
  userId: any = null;

  showProductDescribe: boolean = false;
  productDescribeData: any = {};

ngOnInit() {
  this.route.queryParams.subscribe((params) => {
    const categoryId = Number(params['category']);
    if (categoryId) {
      this.initialCategoryId = categoryId; // ✅ store for later
    }
  });

  this.loadCategoryData();
  this.loadCartData();
  this.loadProductData(); // filter applied after products load
}

// ---------- FILTER ----------
setCategoryFilter(categoryId: number, checked: boolean): void {
  if (checked) {
    if (!this.selectedCategories.includes(categoryId)) {
      this.selectedCategories.push(categoryId);
    }
  } else {
    this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
  }

  // ✅ Always call filter after update
  this.applyFilters();
}

onCategoryFilter(event: Event): void {
  const checkbox = event.target as HTMLInputElement;
  this.setCategoryFilter(Number(checkbox.value), checkbox.checked);
}

  onClearAll(): void {
    this.selectedCategories = [];
    this.applyFilters();
  }


applyFilters(): void {
  if (this.selectedCategories.length === 0) {
    // show all products if no filter selected
    this.filteredProducts = [...this.products];
  } else {
    // filter products based on multiple category_ids
    this.filteredProducts = this.products.filter(product => {
      const productCategories = String(product.category_id)
        .split(',')
        .map((id: string) => Number(id.trim()));

      return productCategories.some(catId =>
        this.selectedCategories.includes(catId)
      );
    });
  }

  this.currentPage = 1;
  this.updateTotalPages();

  console.log("Selected Categories:", this.selectedCategories);
  console.log("Filtered Products:", this.filteredProducts);
}


updateTotalPages(): void {
  this.totalPages = Math.ceil(this.enabledPaginatedProducts.length / this.itemsPerPage);
}



  // ---------- PAGINATION ----------
get paginatedProducts(): any[] {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  return this.enabledPaginatedProducts.slice(startIndex, endIndex);
}


get enabledPaginatedProducts(): any[] {
  return this.filteredProducts.filter(
    p => p.product_status?.toLowerCase() === 'enable'
  );
}


  get pageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ---------- DATA FETCH ----------
loadProductData() {
  this.dataService.getProductsData().subscribe(
    (response) => {
      if (response.status) {
        this.products = response.product
          .filter((item: any) => item.price !== '0')
          .map((product: any) => ({
            ...product,
            quantity: 1,
          }));

        this.filteredProducts = [...this.products];
        this.updateTotalPages();

        // ✅ Apply filter only after products are loaded
        if (this.initialCategoryId) {
          this.setCategoryFilter(this.initialCategoryId, true);
        } else {
          this.applyFilters(); // show all by default
        }
      }
    },
    (error) => {
      console.log('Error fetching data in Product', error);
    }
  );
}

 loadCategoryData() {
  this.dataService.getCategoryData().subscribe(
    (response) => {
      if (response.status) {
        this.categories = response.category.filter(
          (item: any) => item.category_type !== 'free_trial'
        );
      }
    },
    (error) => {
      console.log('Error fetching data in category', error);
    }
  );
}
  loadCartData() {
    if (!this.authService.isLoggedIn) return;
    this.userId = localStorage.getItem('userId');
    if (!this.userId) return;

    this.dataService.getCartData(this.userId).subscribe(
      (response) => {
        if (response?.status && response.card?.length) {
          this.cartData = response.card;
          this.syncProductQuantities();
        } else {
          this.cartData = [];
          this.syncProductQuantities();
        }
      },
      () => {
        this.cartData = [];
        this.syncProductQuantities();
      }
    );
  }

  syncProductQuantities() {
    if (!this.products.length) return;
    this.products.forEach(product => {
      const cartItem = this.cartData.find(item => item.product_id === product.id);
      product.quantity = cartItem ? cartItem.quantity : 1;
    });
    this.filteredProducts = [...this.products];
  }

  // ---------- CART ----------
  moveToCart(product: any) {
    if (this.isLogin) {
      let userId: any = localStorage.getItem('userId');
      const cart_data: any = {
        user_id: JSON.parse(userId),
        product_id: product.id,
        quantity: product.quantity
      };

      this.dataService.addToCart(cart_data).subscribe(
        (response) => {
          if (response.status) {
            this.dataService.cartLoad?.next("true");
            this.dataService.cartLoad1.next(true);
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: "In den Warenkorb gelegt",
              showConfirmButton: false,
              timer: 2000,
            });
          } else {
            Swal.fire('Fehler!', response.message || 'Das Hinzufügen zum Warenkorb ist fehlgeschlagen.', 'error');
          }
        },
        () => {
          Swal.fire({
            position: 'top-end',
            icon: 'warning',
            title: "Artikel schon hinzugefügt. Bitte die Menge im Warenkorb anpassen.",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      );
    } else {
      Swal.fire('Fehler!', 'Bitte melden Sie sich an, um Artikel in den Warenkorb zu legen!', 'error');
      this.router.navigate(['/auth']);
    }
  }

  // ---------- POPUP ----------
  showProductDescription(productData: any) {
    this.showProductDescribe = true;
    this.productDescribeData = productData;
  }

  closePopup() {
    this.showProductDescribe = false;
  }

  // ---------- QUANTITY ----------
  incrementQuantity(product: any) {
    product.quantity += 1;
  }

  decrementQuantity(product: any) {
    if (product.quantity > 1) {
      product.quantity -= 1;
    }
  }

  // ---------- FORMATTERS ----------
  formatDescription(desc: string): string {
    return desc.replace(/\n/g, '<br>');
  }

  formatDescriptions(nutri_inform: string): string {
    return nutri_inform.replace(/\n/g, '<br>');
  }

  formatDescriptionss(ingredients: string): string {
    return ingredients.replace(/\n/g, '<br>');
  }

}
