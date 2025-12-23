import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  constructor(private cdr: ChangeDetectorRef,private dataService: DataService, private authService: AuthService, private route: Router) { }

  cartData: any[] = []
  products: any[] = []
  preventFetching: boolean = false;
  userId: any;
  isLogin = this.authService.isLoggedIn;
  fileUrl = this.dataService.fileUrl;

  total: any = 0
  totalAmount: any = 0
  totalAmounts: any = 0
  selectedButton: { value: number, disabled: boolean } | null = null;
  tips: any = 0
  formattedTips: string = `${Math.floor(this.tips)} ⁰⁰`;

  ngOnInit() {
    console.log("🔄 Subscribing to cartCleared$ event...");
    
    this.dataService.cartCleared$.subscribe((shouldClear) => {
      console.log("📢 Cart clear event received:", shouldClear);
      if (shouldClear) {
        this.clearCartAfterPayment();
      }
    });
  this.loadTipAmt()
    this.loadCartData(); // ✅ This should be AFTER subscribing
}


  loadCartData() {
    if (this.preventFetching) {
      console.log("Cart fetching is disabled after clearing.");
      return;
    }

    if (!this.authService.isLoggedIn) {
      console.warn("User is not logged in. Skipping cart fetch.");
      return;
    }

    this.userId = localStorage.getItem('userId');
    console.log("Fetching cart data for userId:", this.userId);

    if (!this.userId) {
      console.error("User ID is null or undefined!");
      return;
    }

    this.dataService.getCartData(this.userId).subscribe(
      (response) => {
        console.log("API Response:", response);

        if (response?.status && response.card?.length) {
          this.cartData = response.card;
          console.log("Updated cartData:", this.cartData);
          this.fetchProductDetails();
        } else {
          console.warn("Cart is empty or response is invalid.");
          this.cartData = [];
        }
      },
      (error) => {
        console.error("Error fetching cart data:", error);
        this.cartData = [];
      }
    );
  }
  clearCartAfterPayment() {
    console.log("✅ Cart data cleared successfully!");
    this.cartData = [];
    this.preventFetching = true; // ✅ Prevent re-fetching
    console.log("🛑 preventFetching set to:", this.preventFetching);

    // Force UI update
    setTimeout(() => {
      console.log("📌 Cart should be empty now:", this.cartData);
    }, 1000);
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
          // this.loadCartData();
        } else {
          Swal.fire('Fehler!', response.message || 'Die Anmeldung ist fehlgeschlagen!', 'error');
        }
      },
      (error) => {
        Swal.fire('Fehler!', 'Fehlgeschlagen!!!', 'error');
      }
    )
  }

  decrementQuantity(cartItem: any) {
    if (cartItem.quantity > 1) {
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
            // this.loadCartData();
          } else {
            Swal.fire('Fehler!', response.message || 'Die Anmeldung ist fehlgeschlagen!', 'error');
          }
        },
        (error) => {
          Swal.fire('Fehler!', 'Fehlgeschlagen!!!', 'error');
        }
      )
    }
  }

  deleteFromCart(cartId: any) {
    this.dataService.deleteCartData(cartId).subscribe(
      (response) => {
        if (response.status) {
          this.dataService.cartLoad?.next("true")
           this.dataService.cartLoad1.next(true);
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Produkt aus dem Warenkorb gelöscht",
            showConfirmButton: false,
            timer: 2000, // 2 seconds
            didClose: () => {
                this.loadTipAmt()
                this.loadCartData();
              // window.location.reload();
            }
          })
          // this.loadCartData();
          // window.location.reload();
          
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
      this.total = parseFloat(this.total.toFixed(2))
      this.totalAmount = parseFloat(this.total.toFixed(2));
    }
    console.log("Total Amount: " + this.total);
  }

 
  moveToOrder() {
    if (this.cartData.length > 0) {
      localStorage.setItem('total', this.total.toFixed(2));
      localStorage.setItem('totalAmount', this.totalAmount.toFixed(2));
  
      const formattedTips = this.tips.toFixed(2);
      this.formattedTips = formattedTips;
  
      localStorage.setItem('tips', formattedTips);
      console.log('Formatted Tips:', formattedTips);
  
      this.route.navigate(['/orders']);
    } else {
      Swal.fire(
        'Leider ist etwas schiefgelaufen',
        "Ihr leerer Warenkorb wartet darauf, mit Ihren Lieblingsstücken gefüllt zu werden!",
        'warning'
      );
    }
  }
  

  subscribe_order() {
    if (this.cartData.length > 0) {
      localStorage.setItem('total', this.total.toFixed(2));
      localStorage.setItem('totalAmount', this.totalAmount.toFixed(2));
      // this.formattedTips = `${Math.floor(this.tips)} ⁰⁰`;
      const formattedTips = this.tips.toFixed(2);
      this.formattedTips = formattedTips;
  
      localStorage.setItem('tips', formattedTips);
      console.log('Formatted Tips:', formattedTips);
  
      // localStorage.setItem('tips', this.tips);
      this.route.navigate(['/subscribe-order']);
    } else {
      Swal.fire('Warnung!', "Der Warenkorb ist leer", 'warning');
    }
  }

  buttons = [
    { value: 5.00, disabled: false },
    { value: 3.00, disabled: false },
    { value: 1.00, disabled: false },
    { value: 0.50, disabled: false }
  ];

  formatCurrency(value: number): string {
    let euros = Math.floor(value); // Get the whole euro part
    let cents = Math.round((value - euros) * 100); // Get the cents part
  
    return `${euros} <sup>${cents.toString().padStart(2, '0')}</sup> €`;
  }

  // selectAmount(clickedButton: { value: number, disabled: boolean }): void {
  //   if (this.selectedButton === clickedButton) {
  //     this.totalAmount -= clickedButton.value;

  //     this.tips = 0;
  //     this.resetButtons();
  //     this.selectedButton = null;
  //     return;
  //   }

  //   if (this.selectedButton) {
  //     this.totalAmount -= this.selectedButton.value;
  //     this.tips = 0
  //   }

  //   this.buttons
  //     .filter(button => button !== clickedButton)
  //     .forEach(button => button.disabled = true);

  //   this.totalAmount += clickedButton.value;
  //   this.tips = clickedButton.value;

  //   this.selectedButton = clickedButton;
  // }
  loadTipAmt(){
    let storedTip = localStorage.getItem('tips');

    if (storedTip) {
      let tipAmount = parseFloat(storedTip);
  
      // Find the button that matches the stored tip amount
      let selectedButton = this.buttons.find(button => button.value === tipAmount);
  
      if (selectedButton) {
        this.selectedButton = selectedButton;
        this.tips = tipAmount;
  
        // Disable other buttons
        this.buttons.forEach(button => button.disabled = button !== selectedButton);
      }
    }
  }

  // selectAmount(clickedButton: { value: number, disabled: boolean }): void {
   
  //   if (this.selectedButton === clickedButton) {
  //     // Reset Trinkgeld when clicking the same button
  //     this.tips = 0;
  //     this.resetButtons();
  //     this.selectedButton = null;
  //     return;
  //   }
  
  //   // If a button was already selected, reset the tip
  //   if (this.selectedButton) {
  //     this.tips = 0;
  //   }
  
  //   // Disable other buttons to allow only one selection
  //   this.buttons.forEach(button => button.disabled = button !== clickedButton);
  
  //   // Update Trinkgeld amount (Tip)
  //   this.tips = clickedButton.value;
  
  //   // Store selected button
  //   this.selectedButton = clickedButton;
  // }
  
  selectAmount(clickedButton: { value: number, disabled: boolean }): void {
    if (this.selectedButton === clickedButton) {
      // Reset Trinkgeld when clicking the same button
      this.tips = 0;
      localStorage.removeItem('tips');  // Remove tip from localStorage
      this.resetButtons();
      this.selectedButton = null;
      return;
    }
  
    // If a button was already selected, reset the tip
    if (this.selectedButton) {
      this.tips = 0;
    }
  
    // Disable other buttons to allow only one selection
    this.buttons.forEach(button => button.disabled = button !== clickedButton);
  
    // Update Trinkgeld amount (Tip)
    this.tips = clickedButton.value;
  
    // Store the selected tip in localStorage
    localStorage.setItem('tips', this.tips.toString());
  
    // Store selected button
    this.selectedButton = clickedButton;
  }
  
  resetButtons(): void {
    this.buttons.forEach(button => button.disabled = false);
  }
}