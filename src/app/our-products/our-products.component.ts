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
  allCategories: any[] = [];
  selectedCategoryType: string = 'all';
  mainCategories: any[] = [];
  fileUrl: any = this.dataService.fileUrl;

  filteredProducts: any[] = [];
  selectedCategories: number[] = [];
  showCombosOnly: boolean = false;
  allProductsAndCombos: any[] = [];
  selectedCategoryId: any = 'all';

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
    this.loadMainCategoryData();
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
      const targetCat = this.allCategories.find(c => c.id === categoryId);

      if (targetCat && targetCat.category_type) {
        // If switching to a category of a different type, clear previous selections
        if (this.selectedCategoryType !== targetCat.category_type) {
          this.selectedCategories = [];
          this.selectedCategoryType = targetCat.category_type;
          this.filterCategoriesByType();
        }
      }

      if (!this.selectedCategories.includes(categoryId)) {
        this.selectedCategories.push(categoryId);
      }
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    }

    if (this.selectedCategories.length === 0) {
      this.selectedCategoryId = 'all';
    } else {
      this.selectedCategoryId = this.selectedCategories[0];
    }

    this.applyFilters();
  }

  selectProductFilter(product: any): void {
    if (product.category_id) {
      const catIds = String(product.category_id)
        .split(',')
        .map(id => Number(id.trim()));

      const firstCatId = catIds[0];
      if (firstCatId) {
        const targetCat = this.allCategories.find(c => c.id === firstCatId);
        if (targetCat && targetCat.category_type) {
          // Select the Sub-Category Type (top checkboxes)
          this.selectedCategoryType = targetCat.category_type;
          this.filterCategoriesByType();

          // Also check the specific Kategorie box to show related products
          if (!this.selectedCategories.includes(firstCatId)) {
            this.selectedCategories.push(firstCatId);
          }
          this.applyFilters();
        }
      }
    }
  }

  onCategorySelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const val = select.value;
    this.selectedCategoryId = val;

    if (val === 'all') {
      this.selectedCategories = [];
    } else {
      const categoryId = Number(val);
      this.selectedCategories = [categoryId];

      // Sync the Type dropdown if not already set
      const targetCat = this.allCategories.find(c => c.id === categoryId);
      if (targetCat && targetCat.category_type) {
        this.selectedCategoryType = targetCat.category_type;
        this.filterCategoriesByType();
      }
    }

    this.applyFilters();
  }

  onCategoryTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCategoryType = select.value;
    this.filterCategoriesByType();
    this.selectedCategories = []; // Only clear selections, keep type
    this.applyFilters();
  }

  setCategoryTypeFilter(typeName: string, checked: boolean): void {
    if (this.cartData.length > 0) {
      Swal.fire({
        icon: 'info',
        title: 'Filter gesperrt',
        text: 'Bitte leeren Sie Ihren Warenkorb, um den Bereich (Sub-Category Type) zu wechseln.',
        confirmButtonColor: '#ffb74d'
      });
      return;
    }

    if (checked) {
      this.selectedCategoryType = typeName;
      this.filterCategoriesByType();
      this.selectedCategories = []; // Clear sub-category when type changes
    } else {
      this.selectedCategoryType = 'all';
      this.filterCategoriesByType();
      this.selectedCategories = [];
    }
    this.applyFilters();
  }

  filterCategoriesByType(): void {
    if (this.selectedCategoryType === 'all') {
      this.categories = this.allCategories.filter(
        (item: any) => item.category_type !== 'free_trial'
      );
    } else {
      this.categories = this.allCategories.filter(
        (item: any) => item.category_type === this.selectedCategoryType
      );
    }
  }

  onClearAll(): void {
    this.selectedCategories = [];
    this.selectedCategoryId = 'all';

    if (this.cartData.length === 0) {
      this.selectedCategoryType = 'all';
    }

    this.filterCategoriesByType();
    this.showCombosOnly = false;
    this.applyFilters();
  }


  applyFilters(): void {
    let result = [...this.products];

    // 1. Primary Filter: By Sub-Category Type (Main Category)
    if (this.selectedCategoryType !== 'all') {
      // Find all category IDs matching the selected type
      const validCategoryIds = this.allCategories
        .filter(cat => cat.category_type === this.selectedCategoryType)
        .map(cat => cat.id);

      result = result.filter(product => {
        const productCategories = String(product.category_id)
          .split(',')
          .map((id: string) => Number(id.trim()));

        return productCategories.some(id => validCategoryIds.includes(id));
      });
    }

    // 2. Secondary Filter: By Specific Checked Categories
    if (this.selectedCategories.length > 0) {
      result = result.filter(product => {
        const productCategories = String(product.category_id)
          .split(',')
          .map((id: string) => Number(id.trim()));

        return productCategories.some(catId =>
          this.selectedCategories.includes(catId)
        );
      });
    }

    this.filteredProducts = result;
    this.currentPage = 1;
    this.updateTotalPages();

    console.log("Filter Result:", {
      type: this.selectedCategoryType,
      selected: this.selectedCategories,
      count: this.filteredProducts.length
    });
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
      (response: any) => {
        if (response.status) {
          this.products = response.product
            .filter((item: any) => item.price !== '0')
            .map((product: any) => ({
              ...product,
              quantity: 1,
            }));

          this.filteredProducts = [...this.products];
          this.updateTotalPages();

          // ✅ Apply proper priority filter after products are loaded
          if (this.cartData.length > 0) {
            this.refreshViewFromCart();
          } else if (this.initialCategoryId) {
            this.setCategoryFilter(this.initialCategoryId, true);
          } else {
            this.applyFilters();
          }
        }
      },
      (error: any) => {
        console.log('Error fetching data in Product', error);
      }
    );
  }

  loadCategoryData() {
    this.dataService.getCategoryData().subscribe(
      (response: any) => {
        if (response.status) {
          this.allCategories = response.category;

          // Re-sync if we had an initial category ID (as requested for deep linking)
          if (this.initialCategoryId) {
            const target = this.allCategories.find(c => c.id === this.initialCategoryId);
            if (target) {
              this.selectedCategoryId = target.id;
              if (target.category_type) {
                this.selectedCategoryType = target.category_type;
              }
            }
          }

          this.filterCategoriesByType();

          if (this.cartData.length > 0) {
            this.refreshViewFromCart();
          } else {
            this.applyFilters(); // Ensure products match the synced state
          }
        }
      },
      (error: any) => {
        console.log('Error fetching data in category', error);
      }
    );
  }
  loadMainCategoryData() {
    this.dataService.getMainCategoryData().subscribe(
      (response: any) => {
        if (response.status) {
          this.mainCategories = response.category;
        }
      },
      (error: any) => {
        console.log('Error fetching main category data', error);
      }
    );
  }

  loadCartData() {
    if (!this.authService.isLoggedIn) return;
    this.userId = localStorage.getItem('userId');
    if (!this.userId) return;

    this.dataService.getCartData(this.userId).subscribe(
      (response: any) => {
        if (response?.status && response.card?.length) {
          this.cartData = response.card;
          // Synchronize view based on the new cart contents
          this.refreshViewFromCart();
          this.syncProductQuantities();
        } else {
          this.cartData = [];
          this.syncProductQuantities();
          this.applyFilters();
        }
      },
      () => {
        this.cartData = [];
        this.syncProductQuantities();
        this.applyFilters();
      }
    );
  }

  refreshViewFromCart(): void {
    if (!this.cartData || this.cartData.length === 0 || this.products.length === 0 || this.allCategories.length === 0) {
      return;
    }

    // Lock to the category type of items in the cart (assuming all type-consistent)
    const firstItem = this.cartData[0];
    const product = this.products.find(p => p.id === firstItem.product_id);

    if (product && product.category_id) {
      const catIds = String(product.category_id).split(',').map(id => Number(id.trim()));
      const category = this.allCategories.find(c => c.id === catIds[0]);

      if (category && category.category_type) {
        this.selectedCategoryType = category.category_type;
        this.filterCategoriesByType();

        // Check the individual category boxes for all items in the cart
        this.cartData.forEach(item => {
          const cartProduct = this.products.find(p => p.id === item.product_id);
          if (cartProduct && cartProduct.category_id) {
            const ids = String(cartProduct.category_id).split(',').map(id => Number(id.trim()));
            ids.forEach(id => {
              if (!this.selectedCategories.includes(id)) {
                this.selectedCategories.push(id);
              }
            });
          }
        });
      }
    }
    this.applyFilters();
  }

  syncProductQuantities() {
    if (!this.products.length) return;
    this.products.forEach((product: any) => {
      const cartItem = this.cartData.find((item: any) => item.product_id === product.id);
      product.quantity = cartItem ? cartItem.quantity : 1;
    });
    // Removed direct filteredProducts reset to preserve active filters.
  }

  // ---------- CART ----------
  moveToCart(product: any) {
    if (this.isLogin) {
      if (this.cartData.length > 0) {
        // Find category type of the product being added
        const catIds = String(product.category_id).split(',').map(id => Number(id.trim()));
        const category = this.allCategories.find(c => c.id === catIds[0]);

        if (category && category.category_type && category.category_type !== this.selectedCategoryType) {
          Swal.fire({
            icon: 'warning',
            title: 'Gemischte Bestellung nicht möglich',
            text: `Sie haben bereits Produkte aus dem Bereich "${this.selectedCategoryType}" im Warenkorb. Bitte schließen Sie diese Bestellung zuerst ab oder leeren Sie Ihren Warenkorb.`,
            confirmButtonColor: '#ffb74d'
          });
          return;
        }
      }

      let userId: any = localStorage.getItem('userId');
      const cart_data: any = {
        user_id: JSON.parse(userId),
        product_id: product.id,
        quantity: product.quantity,
        is_combo: product.isCombo ? 1 : 0
      };

      this.dataService.addToCart(cart_data).subscribe(
        (response: any) => {
          if (response.status) {
            this.dataService.cartLoad?.next("true");
            this.dataService.cartLoad1.next(true);
            this.loadCartData(); // Refresh cart lock state
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
        (error: any) => {
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
      (response: any) => {
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
      (error: any) => {
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
