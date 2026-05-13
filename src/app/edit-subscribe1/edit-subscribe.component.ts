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

  isLogin = localStorage.getItem('isLoggedIn')

  products: any[] = []
  categories: any[] = []
  fileUrl: any = this.dataService.fileUrl

  filteredProducts = [...this.products];
  selectedCategories: number[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;

  product: any = {};
  productId!: number;
  CartData: any[] = []

  total: any = 0
  totalAmount: any = 0
  selectedButton: { value: number, disabled: boolean } | null = null;
  tips: any = 0

  orderId: any;
  orderedData: any = {}

  showProductDescribe: boolean = false
  productDescribeData: any = {}

  ngOnInit() {
    this.loadProductData();
    this.loadCategoryData();

    this.filteredProducts = [...this.products];


    this.route.queryParams.subscribe((params) => {
      const categoryId = +params['category'];
      if (categoryId) {
        this.selectedCategories = [categoryId];
        this.applyFilters();
      }
    })

  }

  onCategoryFilter(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    // const categoryId = parseInt(checkbox.value, 10);
    const categoryId = +checkbox.value;
    if (checkbox.checked) {
      this.selectedCategories.push(categoryId);
      console.log(this.selectedCategories);
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    }
    this.applyFilters();
  }

  onClearAll(): void {
    this.selectedCategories = [];
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product =>
        this.selectedCategories.includes(product.category_id)
      );
    }

    this.currentPage = 1;
    this.updateTotalPages();
  }

  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
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
              quantity: 1
            }));

          if (this.selectedCategories.length > 0) {
            this.applyFilters();
          } else {
            this.filteredProducts = [...this.products];
          }
          console.log(this.products);
          this.updateTotalPages();
        }
      },
      (error) => {
        console.log('Error fetching data in Product', error);
      }
    )
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
          })
          console.log(this.categories);
          // console.log(this.displayCards)
        }
      },
      (error) => {
        console.log('Error fetching data in category', error);
      }
    );
  }


  get paginatedProducts(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, endIndex);
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
        console.log("==============" + this.orderId);
      })

      this.dataService.getOrderDataByOrderId(this.orderId).subscribe(
        (response) => {
          if (response.status) {
            this.orderedData = response.subscribeData

            const totalPrice = parseFloat(this.orderedData.price) + (parseFloat(product.price) * product.quantity);

            const updatedData = {
              price: totalPrice.toFixed(2),
              product_name: product.product_name,
              quantity: product.quantity
            }

            this.dataService.updateSubscribeOrder(this.orderId,updatedData).subscribe(
              (response)=>{
                if(response.status){
                  Swal.fire({
                    title: "Erfolg!",
                    text: "Bitte überprüfen Sie die dauerbestellung",
                    icon: "success"
                  });
                }else{
                  alert("Failed");
                }
              },
              (error)=>{
                console.log("Failed to Update!!!",error);
              }
            )

            console.log(this.orderedData);
          }

        }
      )



    } else {
      Swal.fire('Fehler!', 'Bitte melden Sie sich an, um Artikel in den Warenkorb zu legen!!!', 'error');
      this.router.navigate(['/auth'])
    }
  }

  showProductDescription(productData: any) {
    this.showProductDescribe = true

    this.productDescribeData = productData;

  }

  closePopup() {
    this.showProductDescribe = false
  }

  incrementQuantity(product: any) {
    product.quantity += 1
  }

  decrementQuantity(product: any) {
    if (product.quantity > 1) {
      product.quantity -= 1
    }
  }
}
