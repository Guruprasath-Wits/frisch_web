import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ActivatedRoute, Params } from '@angular/router';
import { DataService } from '../data.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-edit-subscribe',
  templateUrl: './edit-subscribe.component.html',
  styleUrls: ['./edit-subscribe.component.css']
})
export class EditSubscribeComponent implements OnInit {

  constructor(private dataService: DataService, private authService: AuthService, private router: Router, private route: ActivatedRoute) { }

  isLogin = localStorage.getItem('isLoggedIn');
  products: any[] = [];
  categories: any[] = [];
  fileUrl: any = this.dataService.fileUrl;

  filteredProducts: any[] = [];
  selectedCategories: number[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 0;

  product: any = {};
  productId!: number;
  CartData: any[] = [];

  total: any = 0;
  totalAmount: any = 0;
  selectedButton: { value: number, disabled: boolean } | null = null;
  tips: any = 0;

  orderId: any;
  orderedData: any = {};

  showProductDescribe: boolean = false;
  productDescribeData: any = {};
  order_id: any;

  ngOnInit() {
    this.order_id = this.route.snapshot.queryParamMap.get('orderId');
    this.loadProductData();
    this.loadCategoryData();

    this.route.queryParams.subscribe((params) => {
      const categoryId = +params['category'];
      if (categoryId) {
        this.selectedCategories = [categoryId];
        this.applyFilters();
      }
    });
  }

  loadProductData() {
    this.dataService.getProductsData().subscribe(
      (response) => {
        if (response.status) {
          const productss = response.product;
          this.products = productss
            .filter((item: any) => item.price !== '0')
            .map((product: any) => ({
              ...product,
             category_id: product.category_id
      ? product.category_id.toString().split(',').map((id: string) => +id.trim())
      : [],
              quantity: 0 // default to 0, will be updated by getOrderedProduct
            }));

          // Now get ordered products and update quantities
          this.getOrderedProduct();
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
          const category = response.category;
          category.map((item: any) => {
            if (item.category_type != 'free_trial') {
              this.categories.push(item);
            }
          });
        }
      },
      (error) => {
        console.log('Error fetching data in category', error);
      }
    );
  }

  getOrderedProduct(): void {
    this.route.queryParams.subscribe((params: Params) => {
      const orderId = params['orderId'];
      if (!orderId) return;

      this.dataService.getOrderDetailsData(orderId).subscribe(
        (response: any) => {
          const orderedItems = response.orders || [];

          // Set quantity for each product based on orderedItems
          this.products = this.products.map(product => {
            const ordered = orderedItems.find(
              (orderItem: any) => orderItem.product_name === product.product_name
            );
            return {
              ...product,
              quantity: ordered ? ordered.quantity : 0
            };
          });

          // Apply filter after updating quantities
          this.applyFilters();
        },
        (error) => {
          console.error('Error fetching order details:', error);
        }
      );
    });
  }

  applyFilters(): void {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
      console.log("FILTER",this.filteredProducts)
    } else {
      this.filteredProducts = this.products.filter(product =>
      product.category_id.some((id: number) => this.selectedCategories.includes(id))
    );
        console.log("FILTERS",this.filteredProducts)
    }
    this.currentPage = 1;
    this.updateTotalPages();
  }

  onCategoryFilter(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.setCategoryFilter(Number(checkbox.value), checkbox.checked);
  }

  setCategoryFilter(categoryId: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedCategories.includes(categoryId)) {
        this.selectedCategories.push(categoryId);
      }
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    }
    this.applyFilters();
  }

  onClearAll(): void {
    this.selectedCategories = [];
    this.applyFilters();
  }

  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.enabledPaginatedProducts.length / this.itemsPerPage);
  }

  // get paginatedProducts(): any[] {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   const endIndex = startIndex + this.itemsPerPage;
  //   return this.filteredProducts.slice(startIndex, endIndex);
  // }

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
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  editSubscribe(product: any) {
    if (this.isLogin) {
      this.route.queryParams.subscribe((params: Params) => {
        this.orderId = params['orderId'];

        this.dataService.getOrderDataByOrderId(this.orderId).subscribe(
          (subResponse) => {
            if (subResponse.status) {
              this.orderedData = subResponse.subscribeData;

              this.dataService.getOrderDetailsData(this.orderId).subscribe(
                (orderResponse: any) => {
                  if (orderResponse.status) {
                    const orderProducts = orderResponse.orders || [];
                    const existingProduct = orderProducts.find((p: any) => p.product_name == product.product_name);
                    const oldQty = existingProduct ? existingProduct.quantity : 0;
                    const pricePerUnit = parseFloat(product.price);

                    const oldTotal = pricePerUnit * oldQty;
                    const newTotal = pricePerUnit * product.quantity;
                    const totalPrice = parseFloat(this.orderedData.price) - oldTotal + newTotal;

                    const otherProducts = orderProducts.filter((p: any) => p.product_name !== product.product_name);
                    const otherHasQty = otherProducts.some((p: any) => p.quantity > 0);

                    if (product.quantity === 0 && !otherHasQty) {
                      Swal.fire({
                        title: "Fehler!",
                        text: "Mindestens ein Produkt muss in der Dauerbestellung bleiben.",
                        icon: "error"
                      });
                      return;
                    }

                    const updatedData = {
                      price: totalPrice.toFixed(2),
                      product_name: product.product_name,
                      quantity: product.quantity
                    };

                    this.dataService.updateSubscribeOrder(this.orderId, updatedData).subscribe(
                      (updateResponse) => {
                        if (updateResponse.status) {
                          Swal.fire({
                            title: "Erfolg!",
                            text: "Bitte überprüfen Sie die dauerbestellung",
                            icon: "success"
                          });
                        } else {
                          alert("Failed");
                        }
                      },
                      (error) => {
                        console.log("Failed to Update!!!", error);
                      }
                    );
                  }
                }
              );
            }
          }
        );
      });

    } else {
      Swal.fire('Fehler!', 'Bitte melden Sie sich an, um Artikel in den Warenkorb zu legen!!!', 'error');
      this.router.navigate(['/auth']);
    }
  }

  showProductDescription(productData: any) {
    this.showProductDescribe = true;
    this.productDescribeData = productData;
  }

  closePopup() {
    this.showProductDescribe = false;
  }

  incrementQuantity(product: any) {
    product.quantity += 1;
  }

  decrementQuantity(product: any) {
    if (product.quantity > 0) {
      product.quantity -= 1;
    }
  }
}