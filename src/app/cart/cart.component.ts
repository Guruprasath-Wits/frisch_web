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
  constructor(private cdr: ChangeDetectorRef, private dataService: DataService, private authService: AuthService, private route: Router) { }

  cartData: any[] = []
  products: any[] = []
  preventFetching: boolean = false;
  userId: any;
  isLogin = this.authService.isLoggedIn;
  fileUrl = this.dataService.fileUrl;

  total: any = 0
  totalAmount: any = 0
  totalAmounts: any = 0
  minOrderRequired: number = 0;
  deliveryFee: number = 0;
  holidays: any[] = [];
  selectedButton: { value: number, disabled: boolean } | null = null;
  tips: any = 0
  formattedTips: string = `${Math.floor(this.tips)} ⁰⁰`;
  settings: any = {};

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
    this.loadHolidays();
    this.loadSettings();
  }

  loadSettings() {
    this.dataService.getSettingsData().subscribe(
      (response) => {
        if (response?.status) {
          this.settings = response.setting[0] || {};
          this.calculateTotalAmount();
        }
      },
      (error) => {
        console.error("Error fetching settings:", error);
      }
    );
  }

  loadHolidays() {
    this.dataService.getHolidays().subscribe(
      (response) => {
        if (response?.status) {
          this.holidays = response.data || [];
          this.calculateTotalAmount();
        }
      },
      (error) => {
        console.error("Error fetching holidays:", error);
      }
    );
  }

  isHoliday(date: Date): boolean {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return this.holidays.some(h => {
      if (!h.holiday_date) return false;
      const hDate = new Date(h.holiday_date).toISOString().split('T')[0];
      return hDate === dateString;
    });
  }


  loadCartData() {
    if (this.preventFetching) {
      console.log("Cart fetching is disabled after clearing.");
      return;
    }

    this.userId = localStorage.getItem('userId');
    if (!this.userId) {
      console.warn("User ID is null or undefined!");
      this.cartData = [];
      return;
    }

    console.log("Fetching cart data for userId:", this.userId);

    this.dataService.getCartData(this.userId).subscribe(
      (response) => {
        console.log("API Response:", response);

        if (response?.status && response.card?.length) {
          this.cartData = response.card;
          console.log("Updated cartData:", this.cartData);
          this.fetchProductDetails();
          this.dataService.refreshCartCount(this.userId);
        } else {
          console.warn("Cart is empty or response is invalid.");
          this.cartData = [];
          this.dataService.refreshCartCount(this.userId);
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
      // Check if it's a combo or a regular product
      const fetchObservable = cartItem.is_combo
        ? this.dataService.getComboById(cartItem.product_id)
        : this.dataService.getProductById(cartItem.product_id);

      fetchObservable.subscribe(
        (response) => {
          // Adjust response handling based on endpoint structure
          cartItem.productDetails = cartItem.is_combo ? response.combo : response.product;

          // Combos might need price normalization if string
          if (cartItem.is_combo && cartItem.productDetails) {
            // Ensure price is a string for .split() in template, but parsable as float
            // If it's a number, convert to fixed string. If string, leave as is.
            let priceVal = cartItem.productDetails.price;
            if (typeof priceVal === 'number') {
              cartItem.productDetails.price = priceVal.toFixed(2);
            } else if (typeof priceVal === 'string') {
              // Ensure it has 2 decimals if it's a string like "4.5"
              let fVal = parseFloat(priceVal);
              if (!isNaN(fVal)) {
                cartItem.productDetails.price = fVal.toFixed(2);
              }
            }

            cartItem.productDetails.product_name = cartItem.productDetails.name; // Map name
            cartItem.productDetails.product_img = cartItem.productDetails.image; // Map image
          } else if (cartItem.productDetails && typeof cartItem.productDetails.price === 'number') {
            // Regular products might be numbers, ensure string for template .split()
            cartItem.productDetails.price = cartItem.productDetails.price.toFixed(2);
          }

          loadedProducts++;

          if (loadedProducts === this.cartData.length) {
            this.calculateTotalAmount();
          }
        },
        (error) => {
          console.log("Error fetching details for product_id " + cartItem.product_id + ":", error);
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
          this.cartData = this.cartData.filter(item => item.id !== cartId);
          this.calculateTotalAmount();
          this.dataService.cartLoad?.next(true)
          this.dataService.cartLoad1.next(true);
          this.dataService.refreshCartCount(this.userId);
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
    this.total = 0;
    this.minOrderRequired = 0;
    this.deliveryFee = 0;

    const today = new Date();
    const isHolidayFlag = this.isHoliday(today);
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (this.cartData.length > 0) {
      this.cartData.forEach(item => {
        if (item.productDetails) {
          const itemPrice = parseFloat(item.productDetails.price) || 0;
          this.total += itemPrice * item.quantity;

          // Identify the highest minimum order requirement from all categories in the cart
          const itemMinOrder = parseFloat(item.productDetails.min_delivery_charge) || 0;
          if (itemMinOrder > this.minOrderRequired) {
            this.minOrderRequired = itemMinOrder;
          }

          // Delivery fee calculation
          let itemFee = 0;
          if (isHolidayFlag) {
            itemFee = parseFloat(item.productDetails.holiday_fee) || 0;
          } else if (isWeekend) {
            // Check if product is available on weekends
            let isAvailOnWeekend = true;
            if (item.productDetails.availability) {
              try {
                const avail = typeof item.productDetails.availability === 'string'
                  ? JSON.parse(item.productDetails.availability)
                  : item.productDetails.availability;
                if (Array.isArray(avail) && !avail.includes('Sa') && !avail.includes('So')) {
                  isAvailOnWeekend = false;
                }
              } catch (e) { }
            }

            if (isAvailOnWeekend) {
              if (dayOfWeek === 0) { // Sunday
                itemFee = parseFloat(item.productDetails.delivery_fee_weekend) || 0;
              } else { // Saturday
                itemFee = parseFloat(item.productDetails.delivery_fee_weekday) || 0;
              }
            } else {
              // If not available on weekend, use the weekday fee as the actual delivery will be on a weekday
              itemFee = parseFloat(item.productDetails.delivery_fee_weekday) || 0;
            }
          } else {
            itemFee = parseFloat(item.productDetails.delivery_fee_weekday) || 0;
          }

          if (itemFee > this.deliveryFee) {
            this.deliveryFee = itemFee;
          }
        }
      });
    }
    this.total = parseFloat(this.total.toFixed(2));

    // Fallback to settings if no category-specific values are found
    if (this.deliveryFee === 0 && this.settings) {
      if (isHolidayFlag) {
        this.deliveryFee = parseFloat(this.settings.weekday_fee) || 0;
      } else if (dayOfWeek === 0) { // Sunday
        this.deliveryFee = parseFloat(this.settings.weekend_fee) || 0;
      } else { // Monday - Saturday
        this.deliveryFee = parseFloat(this.settings.weekday_fee) || 0;
      }
    }

    if (this.minOrderRequired === 0 && this.settings) {
      this.minOrderRequired = parseFloat(this.settings.minimumorder) || 0;
    }

    // totalAmount should include delivery fee and tips
    this.totalAmount = this.total + parseFloat(this.tips || 0) + this.deliveryFee;
    this.totalAmount = parseFloat(this.totalAmount.toFixed(2));

    console.log("Total Amount: " + this.total);
    console.log("Minimum Order Required: " + this.minOrderRequired);
    console.log("Delivery Fee: " + this.deliveryFee);
    console.log("Final Total Amount (incl. tips & delivery): " + this.totalAmount);
  }


  moveToOrder() {
    if (this.cartData.length > 0) {
      if (this.total < this.minOrderRequired) {
        const remaining = this.minOrderRequired - this.total;
        Swal.fire({
          title: 'Mindestbestellwert nicht erreicht',
          html: `Der Mindestbestellwert für diese Bestellung beträgt <b>${this.minOrderRequired.toFixed(2).replace('.', ',')} €</b>. Ihr aktueller Warenkorbwert beträgt <b>${this.total.toFixed(2).replace('.', ',')} €</b>.<br><br>Nur noch <b>${remaining.toFixed(2).replace('.', ',')} €</b> bis zum Mindestbestellwert.`,
          icon: 'warning'
        });
        return;
      }

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
  loadTipAmt() {
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
      this.calculateTotalAmount();
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

    // Recalculate totalAmount whenever tip is selected
    this.calculateTotalAmount();
  }

  hasAndereCategory(): boolean {
    return this.cartData.some(item =>
      item.productDetails && item.productDetails.category_type === 'Getränke und Sonstiges - Lieferzeiten (Mo-Sa): ca. 16:30 bis 20:30 Uhr'
    );
  }

  resetButtons(): void {
    this.buttons.forEach(button => button.disabled = false);
  }
}