import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MissingProductDialogComponent } from '../dialog/missing-product-dialog/missing-product-dialog.component';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';
import { Title, Meta } from '@angular/platform-browser';

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
    private dialog: MatDialog,
    private titleService: Title,
    private metaService: Meta
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
  isAgeVerified: boolean = false;

  ngOnInit() {
    this.updateSEO();
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

    // Check for existing age verification (Session based for better UX and testing)
    this.isAgeVerified = sessionStorage.getItem('isAgeVerified') === 'true';
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
          // This keeps the context (e.g. Backwaren) without forcing a specific Unterkategorie filter
          this.selectedCategoryType = targetCat.category_type;
          this.filterCategoriesByType();

          // ❌ Removed the automatic checking of the Unterkategorie (firstCatId)
          // this.selectedCategories.push(firstCatId);

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
      sessionStorage.removeItem('isAgeVerified');
    }

    this.filterCategoriesByType();
    this.showCombosOnly = false;
    this.applyFilters();
  }


  updateSEO() {
    let title = 'Unsere Produkte - Frisch für Sie';
    let description = 'Entdecken Sie unsere große Auswahl an frischen Brötchen, Broten, Kuchen und mehr.';

    if (this.selectedCategoryType !== 'all') {
      title = `${this.selectedCategoryType} - Frisch für Sie`;
      description = `Frische Produkte aus der Kategorie ${this.selectedCategoryType} online bestellen bei Frisch für Sie.`;
    }

    if (this.selectedCategories.length > 0) {
      const cat = this.allCategories.find(c => c.id === this.selectedCategories[0]);
      if (cat) {
        title = `${cat.category_name} online bestellen - Frisch für Sie`;
        description = `Kaufen Sie frische ${cat.category_name} und weitere Backwaren online bei Ihrem lokalen Lieferservice.`;
      }
    }

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
  }

  applyFilters(resetPage: boolean = true): void {
    this.updateSEO();
    const savedPage = this.currentPage;
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
    this.updateTotalPages();

    if (resetPage) {
      this.currentPage = 1;
    } else {
      // Preserve current page, but clamp to totalPages if they decreased
      if (savedPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
      } else {
        this.currentPage = savedPage;
      }
    }

    console.log("Filter Result:", {
      type: this.selectedCategoryType,
      selected: this.selectedCategories,
      count: this.filteredProducts.length,
      page: this.currentPage
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

          // Apply proper priority filter after products are loaded
          // If we are already on a page (> 1), don't reset it (e.g. if products reload)
          const preservePage = this.currentPage > 1;
          if (this.cartData.length > 0) {
            this.refreshViewFromCart(!preservePage);
          } else if (this.initialCategoryId) {
            this.setCategoryFilter(this.initialCategoryId, true);
          } else {
            this.applyFilters(!preservePage);
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
            this.refreshViewFromCart(this.currentPage === 1);
          } else {
            this.applyFilters(this.currentPage === 1); // Ensure products match the synced state
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

  loadCartData(resetPage: boolean = true) {
    if (!this.authService.isLoggedIn) return;
    this.userId = localStorage.getItem('userId');
    if (!this.userId) return;

    this.dataService.getCartData(this.userId).subscribe(
      (response: any) => {
        if (response?.status && response.card?.length) {
          this.cartData = response.card;
          // Synchronize view based on the new cart contents
          this.refreshViewFromCart(resetPage);
          this.syncProductQuantities();
        } else {
          this.cartData = [];
          this.syncProductQuantities();
          this.applyFilters(resetPage);
        }
      },
      () => {
        this.cartData = [];
        this.syncProductQuantities();
        this.applyFilters(resetPage);
      }
    );
  }

  refreshViewFromCart(resetPage: boolean = true): void {
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

        // ❌ Removed the loop that automatically checked Unterkategorie (subcategory) boxes
        // Based on your cart items. Now subcategories only get selected if you click them manually.
      }
    }
    this.applyFilters(resetPage);
  }

  syncProductQuantities() {
    if (!this.products.length) return;
    this.products.forEach((product: any) => {
      const cartItem = this.cartData.find((item: any) => item.product_id === product.id);
      product.quantity = cartItem ? cartItem.quantity : 1;
    });
    // Removed direct filteredProducts reset to preserve active filters.
  }

  moveToCart(product: any) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      // Find category type of the product being added (needed for both checks below)
      const catIds = String(product.category_id).split(',').map(id => Number(id.trim()));
      const category = this.allCategories.find(c => c.id === catIds[0]);

      if (this.cartData.length > 0) {
        // Prevent mixing products from different category types
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

      // Check for 18+ age verification via DATABASE (API) + Local Session
      const is18Plus = Number(product.is_18_plus) === 1;
      const isUserVerified = Number(this.userData?.is_age_verified) === 1 || sessionStorage.getItem('isAgeVerified') === 'true';

      console.log('--- 18+ PRODUCT CHECK ---');
      console.log('Product:', product.product_name, '| Verified:', isUserVerified);

      if (is18Plus && !isUserVerified) {
        this.showAgeVerification(product);
        return;
      }

      this.executeAddToCart(product);
    } else {
      Swal.fire('Fehler!', 'Bitte melden Sie sich an, um Artikel in den Warenkorb legen!', 'error');
      this.router.navigate(['/auth']);
    }
  }

  showAgeVerification(product: any) {
    Swal.fire({
      title: 'Alkohol – 18+ Pflicht',
      customClass: {
        container: 'age-verification-modal'
      },
      html: `
        <div class="age-header-box">
          <span class="age-header-text">Altersprüfung</span>
        </div>
        <p class="age-subtitle">Du hast ein alkoholhaltiges Produkt in deinen Warenkorb gelegt.<br>Die Abgabe erfolgt ausschließlich an Personen ab 18 Jahren.</p>
        
        <div class="age-section-title">Gesetzliche Grundlage</div>
        <div class="legal-box">
          <p>Gemäß § 9 Abs. 1 Nr. 1 Jugendschutzgesetz (JuSchG) ist die Abgabe von Bier, Wein, Sekt und ähnlichen Getränken an Personen unter 16 Jahren verboten.</p>
          <p>Gemäß § 9 Abs. 1 Nr. 2 JuSchG ist die Abgabe von Spirituosen, Alkopops und anderen Mischgetränken mit Spirituosen an Kinder und jugendliche jeglichen Alters vollständig untersagt.</p>
          <p>Da unser Sortiment auch Produkte der letztgenannten Kategorie umfasst, gilt für alle alkoholhaltigen Artikel in unserem Shop eine einheitliche Altersgrenze von 18 Jahren.</p>
        </div>

        <div class="age-question">Bist du mindestens 18 Jahre alt?</div>

        <div class="age-checkbox-container">
          <input type="checkbox" id="age-confirm-checkbox">
          <label for="age-confirm-checkbox" class="age-checkbox-text">
            Ich bestätige, dass ich mindestens 18 Jahre alt bin, und erkläre mich damit einverstanden, meinen Personalausweis, Reisepass oder Führerschein bei der Lieferung vorzuzeigen. Ich habe verstanden, dass die Bestellung ohne gültigen Altersnachweis nicht übergeben werden kann.
          </label>
        </div>

        <div class="age-btn-group">
          <button id="age-yes-btn" class="age-btn-yes" disabled>Ja, ich bin 18+</button>
          <button id="age-no-btn" class="age-btn-no">Nein</button>
        </div>

        <div class="age-footer-hint">
          <div class="hint-label">Hinweis zur Lieferung</div>
          <p>Unser Lieferpersonal ist gesetzlich verpflichtet, das Alter der empfangenden Person bei der Übergabe anhand eines gültigen Lichtbildausweises (Personalausweis, Reisepass oder Führerschein) zu überprüfen. Ohne Altersnachweis kann die Bestellung nicht ausgehändigt werden.</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        const checkbox = document.getElementById('age-confirm-checkbox') as HTMLInputElement;
        const yesBtn = document.getElementById('age-yes-btn') as HTMLButtonElement;
        const noBtn = document.getElementById('age-no-btn') as HTMLButtonElement;

        const updateButton = () => {
          if (checkbox && yesBtn) {
            yesBtn.disabled = !checkbox.checked;
            yesBtn.style.opacity = checkbox.checked ? '1' : '0.5';
            yesBtn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
          }
        };

        if (checkbox) {
          checkbox.addEventListener('change', updateButton);
          checkbox.addEventListener('click', updateButton);
          checkbox.addEventListener('input', updateButton);
        }

        // Initial state update
        updateButton();

        if (yesBtn) {
          yesBtn.addEventListener('click', () => {
            const userId = localStorage.getItem('userId');
            if (userId) {
              this.dataService.verifyAge(JSON.parse(userId)).subscribe(
                (response) => {
                  if (response.status) {
                    // Update both Database and Local Session for instant effect
                    if (this.userData) this.userData.is_age_verified = 1;
                    sessionStorage.setItem('isAgeVerified', 'true');

                    Swal.fire({
                      title: 'Zugang gewährt',
                      customClass: {
                        container: 'age-success-modal'
                      },
                      html: `
                        <div class="age-success-icon">✓</div>
                        <p class="age-success-text">Vielen Dank für deine Bestätigung. Deine Verifizierung wurde dauerhaft gespeichert.</p>
                        <p class="small text-muted">Bitte halte deinen Ausweis bei der Lieferung bereit.</p>
                      `,
                      timer: 3000,
                      timerProgressBar: true,
                      showConfirmButton: false
                    }).then(() => {
                      this.executeAddToCart(product);
                    });
                  }
                },
                (error) => {
                  console.error('Error verifying age via API:', error);
                  Swal.fire('Fehler', 'Verifizierung konnte nicht gespeichert werden.', 'error');
                }
              );
            }
          });

          noBtn.addEventListener('click', () => {
            Swal.fire({
              title: 'Zugriff verweigert',
              text: 'Der Kauf von alkoholhaltigen Produkten ist nur für Personen ab 18 Jahren gestattet.',
              icon: 'error',
              confirmButtonColor: '#c9a24d'
            });
          });
        }
      }
    });
  }

  executeAddToCart(product: any) {
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
          this.dataService.cartLoad?.next(true);
          this.dataService.cartLoad1.next(true);
          this.loadCartData(false);
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: "In den Warenkorb gelegt",
            showConfirmButton: false,
            timer: 2000,
          });
        }
      },
      () => {
        Swal.fire({
          position: 'top-end',
          icon: 'warning',
          title: "Artikel schon hinzugefügt.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    );
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
    return desc ? desc.replace(/\n/g, '<br>') : '';
  }

  formatDescriptions(nutri_inform: string): string {
    return nutri_inform ? nutri_inform.replace(/\n/g, '<br>') : '';
  }

  formatDescriptionss(ingredients: string): string {
    return ingredients ? ingredients.replace(/\n/g, '<br>') : '';
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

  getAvailability(availability: any): string[] {
    if (!availability) return [];
    if (typeof availability === 'string') {
      try {
        if (availability.trim().startsWith('[') && availability.trim().endsWith(']')) {
          const parsed = JSON.parse(availability);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        // Fallback to comma-separated
      }
      if (availability.includes(',')) {
        return availability.split(',').map(s => s.trim());
      }
      return [availability.trim()];
    }
    return Array.isArray(availability) ? availability : [availability];
  }

  cleanProductName(name: string): string {
    if (!name) return '';
    return name.split('(')[0].trim();
  }

}
