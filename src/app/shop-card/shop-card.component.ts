import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-shop-card',
  templateUrl: './shop-card.component.html',
  styleUrls: ['./shop-card.component.css']
})
export class ShopCardComponent implements OnInit {

  constructor(private dataService: DataService, private route: Router, private authService: AuthService) { }

  cartData: any[] = []
  products: any[] = []
  userId: any;
  isLogin = this.authService.isLoggedIn;
  fileUrl = this.dataService.fileUrl;

  total: any = 0
  totalAmount: any = 0
  selectedButton: { value: number, disabled: boolean } | null = null;
  tips: any = 0

  ngOnInit() {
    this.loadCartData();
  }

  loadCartData() {
    if (this.authService.isLoggedIn) {
      this.userId = localStorage.getItem('userId');
      this.dataService.getCartData(this.userId).subscribe(
        (response) => {
          if (response.status) {
            this.cartData = response.card;
            this.fetchProductDetails();
            console.log(this.cartData)
          }
        },
        (error) => {
          console.log("Error during fetching cart data:" + error);
        }
      )
    }
  }

  fetchProductDetails() {
    let loadedProducts = 0;

    this.cartData.forEach(cartItem => {
      this.dataService.getProductById(cartItem.product_id).subscribe(
        (productResponse) => {
          cartItem.productDetails = productResponse.product;
          loadedProducts++;

          if (loadedProducts === this.cartData.length) {
            this.calculateTotalAmount();
          }
        },
        (error) => {
          console.log("Error fetching product details for product_id " + cartItem.product_id + ":", error);
          loadedProducts++;

          if (loadedProducts === this.cartData.length) {
            this.calculateTotalAmount();
          }
        }
      );
    });
  }

  incrementQuantity(cartItem: any) {

    const updatedQuantity = cartItem.quantity + 1;

    const data = {
      cart_id: cartItem.id,
      quantity: updatedQuantity
    }

    this.dataService.updateCartQuantity(data).subscribe(
      (response) => {
        if (response.status) {
          cartItem.quantity = updatedQuantity;
          this.calculateTotalAmount();
          this.loadCartData();
        } else {
          Swal.fire('Fehler!', response.message || 'Die Anmeldung ist fehlgeschlagen', 'error');
        }
      },
      (error) => {
        Swal.fire('Fehler!', 'Fehlgeschlagen!!!', 'error');
      }
    )
  }

  decrementQuantity(cartItem: any) {

    const updatedQuantity = cartItem.quantity - 1;

    const data = {
      cart_id: cartItem.id,
      quantity: updatedQuantity
    }

    this.dataService.updateCartQuantity(data).subscribe(
      (response) => {
        if (response.status) {
          cartItem.quantity = updatedQuantity;
          this.calculateTotalAmount();
          this.loadCartData();
        } else {
          Swal.fire('Fehler!', response.message || 'Die Anmeldung ist fehlgeschlagen', 'error');
        }
      },
      (error) => {
        Swal.fire('Fehler!', 'Fehlgeschlagen!!!', 'error');
      }
    )
  }

  deleteFromCart(cartId: any) {
    this.dataService.deleteCartData(cartId).subscribe(
      (response) => {
        if (response.status) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Produkt aus dem Warenkorb gelöscht",
            showConfirmButton: false,
            timer: 1500
          });
          this.loadCartData();
        }
      },
      (error) => {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "Fehler beim Löschen",
          showConfirmButton: false,
          timer: 1500
        });
      }
    )
  }

  calculateTotalAmount() {
    this.total = 0
    if (this.cartData.length > 0) {
      this.cartData.forEach(item => {
        if (item.productDetails) {
          this.total += item.productDetails.price * item.quantity;
        }
      });
      this.totalAmount = this.total;
    }
    console.log("Total Amount: " + this.total);
  }

  moveToOrder() {
    localStorage.setItem('total', this.total);
    localStorage.setItem('totalAmount', this.totalAmount);
    localStorage.setItem('tips', this.tips);
    this.route.navigate(['/orders']);
    // this.route.navigate(['/orders',this.tips,this.totalAmount]);
  }

  buttons = [
    { value: 5, disabled: false },
    { value: 3, disabled: false },
    { value: 1, disabled: false },
    { value: 0.50, disabled: false }
  ];

  selectAmount(clickedButton: { value: number, disabled: boolean }): void {
    if (this.selectedButton === clickedButton) {
      this.totalAmount -= clickedButton.value;
      this.tips = 0;
      console.log(this.tips);
      this.resetButtons();
      this.selectedButton = null;
      return;
    }

    if (this.selectedButton) {
      this.totalAmount -= this.selectedButton.value;
      // localStorage.removeItem('tips');
      this.tips = 0
      console.log(this.tips);
    }

    this.buttons
      .filter(button => button !== clickedButton)
      .forEach(button => button.disabled = true);

    this.totalAmount += clickedButton.value;
    // localStorage.setItem('tips', String(clickedButton.value));
    this.tips = clickedButton.value;
    console.log(this.tips);

    this.selectedButton = clickedButton;
  }

  resetButtons(): void {
    this.buttons.forEach(button => button.disabled = false);
  }

}
