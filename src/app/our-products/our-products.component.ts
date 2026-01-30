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
  showCombosOnly: boolean = false;
  allProductsAndCombos: any[] = [];

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

  onComboFilter(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.showCombosOnly = checkbox.checked;
    this.applyFilters();
  }

  onClearAll(): void {
    this.selectedCategories = [];
    this.showCombosOnly = false;
    this.applyFilters();
  }


  applyFilters(): void {
    let tempProducts = [...this.allProductsAndCombos];

    // Find the ID of the "Combos" category from the loaded categories
    // Handle potential whitespace or "combo" vs "Combos" naming, and verify type
    const comboCategory = this.categories.find(c => {
      const name = c.category_name.trim().toLowerCase();
      return name === 'combos' || name === 'combo' || c.category_type === 'combo';
    });
    const comboCategoryId = comboCategory ? comboCategory.id : -1;

    // Category Filter
    if (this.selectedCategories.length > 0) {
      tempProducts = tempProducts.filter(product => {
        // Handle "Combos" category selection dynamically
        if (this.selectedCategories.includes(comboCategoryId) && product.isCombo) {
          return true;
        }

        if (product.isCombo) return false;

        const productCategories = String(product.category_id)
          .split(',')
          .map((id: string) => Number(id.trim()));

        return productCategories.some(catId =>
          this.selectedCategories.includes(catId)
        );
      });
    }

    // Combo Filter (Fallback if verified differently)
    if (this.showCombosOnly) {
      tempProducts = tempProducts.filter(product => product.isCombo);
    }

    this.filteredProducts = tempProducts;
    this.currentPage = 1;
    this.updateTotalPages();

    console.log("Selected Categories:", this.selectedCategories);
    console.log("Combo Category ID Found:", comboCategoryId);
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
          const regularProducts = response.product
            .filter((item: any) => item.price !== '0')
            .map((product: any) => ({
              ...product,
              product_status: product.product_status || (product.status === 1 ? 'enable' : 'disable'),
              quantity: 1,
              isCombo: false
            }));

          this.loadComboData(regularProducts);
        }
      },
      (error) => {
        console.log('Error fetching data in Product', error);
      }
    );
  }

  loadComboData(regularProducts: any[]) {
    this.dataService.getComboData().subscribe(
      (response) => {
        let combos: any[] = [];
        if (response.success) {
          combos = response.combos.map((combo: any) => ({
            id: combo.id,
            product_name: combo.name,
            price: String(combo.price),
            description: combo.description,
            product_img: combo.image,
            product_status: combo.status === 1 ? 'enable' : 'disable',
            quantity: 1,
            isCombo: true
          }));
        }

        this.allProductsAndCombos = [...regularProducts, ...combos];
        this.products = [...this.allProductsAndCombos]; // for sync compatibility

        this.filteredProducts = [...this.allProductsAndCombos];
        this.updateTotalPages();

        if (this.initialCategoryId) {
          this.setCategoryFilter(this.initialCategoryId, true);
        } else {
          this.applyFilters();
        }
      },
      (error) => {
        console.log('Error fetching combo data', error);
        this.allProductsAndCombos = [...regularProducts];
        this.products = [...this.allProductsAndCombos];
        this.filteredProducts = [...this.allProductsAndCombos];
        this.updateTotalPages();
        this.applyFilters();
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
        quantity: product.quantity,
        is_combo: product.isCombo ? 1 : 0
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
