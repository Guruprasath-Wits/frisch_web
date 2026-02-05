import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MissingProductDialogComponent } from '../dialog/missing-product-dialog/missing-product-dialog.component';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
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
    private route: ActivatedRoute,
    private dialog: MatDialog
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

    // Pre-load user data if logged in
    if (this.isLogin) {
      this.loadUserData();
    }

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



  // ---------- MISSING PRODUCT INLINE ----------
  missingProductText: string = '';
  showMissingProductForm: boolean = false;
  userData: any = {};

  openMissingProductDialog(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!isLoggedIn || isLoggedIn !== 'true') {
      Swal.fire({
        title: 'Nicht eingeloggt',
        text: 'Sie sind noch nicht eingeloggt. Bitte loggen Sie sich zuerst ein.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#ffc107',
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
        }
      });
      return;
    }

    // Toggle inline form
    this.showMissingProductForm = !this.showMissingProductForm;

    if (this.showMissingProductForm) {
      this.loadUserData();
    }
  }

  loadUserData() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.dataService.getUserData(userId).subscribe(
        (response: any) => {
          if (response.status && response.user) {
            this.userData = response.user;
          } else {
            this.loadFromLocalStorage();
          }
        },
        (error) => {
          console.error('Error fetching user data from API:', error);
          this.loadFromLocalStorage();
        }
      );
    } else {
      this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    const user = localStorage.getItem('users');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        this.userData = Array.isArray(parsedUser) ? parsedUser[0] : parsedUser;
      } catch (e) {
        console.error('Error parsing user data from localStorage', e);
      }
    }
  }

  // Clear the text area
  clearMissingProduct() {
    this.missingProductText = '';
  }

  submitMissingProduct() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!isLoggedIn || isLoggedIn !== 'true') {
      Swal.fire({
        title: 'Nicht eingeloggt',
        text: 'Bitte loggen Sie sich ein, um eine Anfrage zu senden.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#ffc107',
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
        }
      });
      return;
    }

    if (!this.missingProductText.trim()) {
      Swal.fire('Warnung', 'Bitte geben Sie ein Produkt ein.', 'warning');
      return;
    }

    // Ensure user data is loaded if not already
    if (!this.userData.email) {
      this.loadUserData();
      // Might need a slight delay or promise here, but usually loadUserData handles it fast enough or we retry.
      // Better: Just call loadUserData, and if it fails, we use what we have.
      // Actually, let's just proceed. The backend might handle empty fields or we rely on what we have.
    }

    const payload = {
      first_name: this.userData.fname || '',
      last_name: this.userData.lname || '',
      email: this.userData.email || '',
      mobile_number: this.userData.phone || '',
      message: this.missingProductText
    };

    this.dataService.postMissingProduct(payload).subscribe(
      (response) => {
        if (response.status) {
          Swal.fire({
            title: 'Vielen Dank!',
            text: 'Wir haben Ihre Anfrage erhalten.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.clearMissingProduct(); // Clear text after success
          });
        } else {
          Swal.fire('Fehler', 'Etwas ist schief gelaufen. Bitte versuchen Sie es später erneut.', 'error');
        }
      },
      (error) => {
        console.error('Error submitting missing product:', error);
        Swal.fire({
          title: 'Fehler!',
          text: 'Die Anfrage konnte nicht gesendet werden.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
  }

}
