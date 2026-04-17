import { Component, OnInit, ElementRef, NgZone, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../data.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { BehaviorSubject } from 'rxjs';
import { LOCATION_INITIALIZED } from '@angular/common';

import { HttpClient } from '@angular/common/http';

declare var google: any;


@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css'],

})
export class OrderComponent implements OnInit {
  houseNo: string = '';
  address: string = '';
  city: string = '';
  isLoading = false;
  lat: any;
  lng: any;
  postcodes: any[] = []
  stripe: Stripe | null = null; // Define stripe as a class property

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone, private fb: FormBuilder, private dataService: DataService, private authService: AuthService, private route: ActivatedRoute, private router: Router) {
    this.minDate = new Date().toISOString().split('T')[0];
    this.minDateObj = new Date();
    this.minDateObj.setHours(0, 0, 0, 0);
  }

  orderForm!: FormGroup
  @ViewChild('addressInput', { static: false }) addressInputRef!: ElementRef;
  settings: any = {}
  storedAddress: any;
  cartData: any[] = []
  products: any[] = []
  userId: any;
  isLogin = this.authService.isLoggedIn;
  fileUrl = this.dataService.fileUrl;
  apiUrl = this.dataService.apiUrl

  userData: any = {}
  orderData: any = {}
  minDate: string = '';
  minDateObj: Date;

  paymentHandler: any = null;

  // stripeAPIKey: any = 'pk_test_TYooMQauvdEDq54NiTphI7jx';

  // totalAmount: any = this.route.snapshot.paramMap.get('totalAmount');
  // tips: any = this.route.snapshot.paramMap.get('tips');

  itemTotal: any = localStorage.getItem('total');
  totalAmount: any = parseFloat(localStorage.getItem('totalAmount') ?? '0').toFixed(2).toString();
  tips: any = localStorage.getItem('tips');


  selectedDateInfo: string = ''
  holidays: any[] = [] // API Holidays
  dbHolidays: any[] = [] // Admin defined holidays
  deliveryFee: number = 0;
  minOrderRequired: number = 0;
  discountAmount: number = 0;
  couponApplied: boolean = false;
  couponType: string = '';
  discountPercentage: number = 0;

  i: number = 0
  availableCoupons: any[] = [];
  showCouponModal: boolean = false;



  ngOnInit() {
    // this.validateDate(event)
    setTimeout(() => {
      this.validateDate(); // Call without arguments
    });
    // this.stripe = loadStripe('pk_test_51QMXiP06yTdeLqihXYXgftABoWwPsuhWpZTodjuMQ9DG9Cwo5eSMloAP4oQG1ebgAAFkg2la35VBLgKBGPJPg0u700XDbq7AW5');
    this.route.queryParams.subscribe(params => {
      this.houseNo = params['houseNo'] || '';
      this.address = params['address'] || '';
      this.city = params['city'] || '';
      console.log('Address Details:', this.houseNo, this.address, this.city);
    });
    this.storedAddress = localStorage.getItem('currentAddress') || '';
    this.lat = localStorage.getItem('latitude') || '';
    this.lng = localStorage.getItem('longitude') || '';
    this.loadDeliveryAreas();
    this.loadSettingsData();
    this.loadCartData();
    this.loadUserData();

    this.initializeForms();
    this.fetchGermanHolidays();
    this.fetchDbHolidays();
    this.loadAvailableCoupons();

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  async makePayment() {
    if (!this.stripe) {
      console.error('Stripe failed to load.');
      return;
    }

    // Step 1: Request a Payment Intent from the backend
    const response = await fetch(this.apiUrl + 'api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }) // Amount in cents
    });

    const { clientSecret } = await response.json();

    // Step 2: Create Stripe Elements and Card Input
    const elements = this.stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element'); // Ensure this exists in your template

    // Step 3: Create a Payment Method
    const { paymentMethod, error } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement
    });

    if (error) {
      console.error('Error creating payment method:', error);
      return;
    }

    // Step 4: Confirm the payment using the generated payment method
    const { paymentIntent, error: confirmError } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id
    });

    if (confirmError) {
      console.error('Payment Failed:', confirmError);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log('Payment Success');

      // Save payment status in backend
      await fetch(this.apiUrl + 'api/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: '12345',
          payment_status: 'succeeded'
        })
      });
    }
  }
  async fetchGermanHolidays() {
    try {
      const response = await fetch('https://get.api-feiertage.de?states=nw');
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Holidays:', data['feiertage']);

      // Extract holiday dates
      this.holidays = Object.values(data['feiertage']).map((item: any) => item.date);

      return this.holidays;
    } catch (error) {
      console.error('Error fetching German holidays:', error);
      return [];
    }
  }

  fetchDbHolidays() {
    this.dataService.getHolidays().subscribe(
      (response: any) => {
        if (response.status) {
          this.dbHolidays = response.holidays;
          console.log('Admin Holidays Loaded:', this.dbHolidays);
          // Re-validate date now that we have the holiday list
          this.validateDate();
        }
      },
      (error) => {
        console.error('Error fetching admin holidays:', error);
      }
    );
  }


  loadSettingsData() {
    this.dataService.getSettingsData().subscribe(
      (response) => {
        if (response.status) {
          this.settings = response.setting[0];
          console.log(this.settings);
        }
      },
      (error) => {
        console.log('Error fetching data in settings:', error);
      }
    )
  }

  ngAfterViewInit() {
    this.loadGooglePlacesAutocomplete();
  }

  private loadGooglePlacesAutocomplete() {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.error("Google Maps API not loaded or Places API missing!");
      return;
    }

    if (!this.addressInputRef) {
      console.warn("addressInput placeholder not found in the template!");
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(
      this.addressInputRef.nativeElement,
      {
        types: ['geocode'], // Restrict to address results
        componentRestrictions: { country: 'DE' } // Restrict to Germany
      }
    );

    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocomplete.getPlace();
        console.log(place); // Log entire place object for debugging

        if (place.geometry && place.geometry.location) {
          const latitude = place.geometry.location.lat();
          const longitude = place.geometry.location.lng();
          const formattedAddress = place.formatted_address;

          // Updating form with address, latitude, and longitude
          this.orderForm.patchValue({
            address: formattedAddress,
            lat: latitude,
            lng: longitude
          });

          console.log(`Address: ${formattedAddress}`);
          console.log(`Latitude: ${latitude}`);
          console.log(`Longitude: ${longitude}`);
        } else {
          console.error("No geometry data available for the selected place.");
        }
      });
    });
  }




  private initializeForms(): void {
    const fullAddress = this.houseNo && this.address && this.city
      ? `${this.houseNo}, ${this.address}, ${this.city}`
      : this.storedAddress;
    this.orderForm = this.fb.group({
      address: [fullAddress],
      instruction: [null],
      delivery_date: [null, Validators.required],
      lat: [this.lat],
      lng: [this.lng],
      zipcode: [null, Validators.required],
      coupon_code: [null]
    });
  }

  loadCartData() {
    if (this.authService.isLoggedIn) {
      this.userId = localStorage.getItem('userId');
      this.dataService.getCartData(this.userId).subscribe(
        (response) => {
          if (response.status) {
            this.cartData = response.card;
            this.fetchProductDetails();
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
    let computedItemTotal = 0;
    this.products = [];
    this.i = 0;

    if (this.cartData.length === 0) {
      this.itemTotal = "0.00";
      this.updateTotal();
      this.isLoading = false;
      return;
    }

    this.cartData.forEach(cartItem => {
      // Check if it's a combo or a regular product
      const fetchObservable = cartItem.is_combo
        ? this.dataService.getComboById(cartItem.product_id)
        : this.dataService.getProductById(cartItem.product_id);

      fetchObservable.subscribe(
        (response) => {
          cartItem.productDetails = cartItem.is_combo ? response.combo : response.product;
          console.log(cartItem.productDetails)
          loadedProducts++;

          const price = parseFloat(cartItem.productDetails.price) || 0;
          computedItemTotal += (price * cartItem.quantity);

          this.products[this.i++] = [cartItem.productDetails.product_name || cartItem.productDetails.name, cartItem.quantity, cartItem.productDetails.price];

          if (loadedProducts === this.cartData.length) {
            this.itemTotal = computedItemTotal.toFixed(2);
            localStorage.setItem('total', this.itemTotal);
            this.updateTotal();
            this.validateDate();
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        },
        (error) => {
          console.log("Error fetching details for product_id " + cartItem.product_id + ":", error);
          loadedProducts++;
          if (loadedProducts === this.cartData.length) {
            this.itemTotal = computedItemTotal.toFixed(2);
            localStorage.setItem('total', this.itemTotal);
            this.updateTotal();
            this.validateDate();
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        }
      );
    });
  }

  loadUserData() {
    this.userId = localStorage.getItem('userId');
    this.dataService.getUserData(this.userId).subscribe(
      (response) => {
        if (response.status) {
          this.userData = response.user;
          console.log(this.userData);
        }
      },
      (error) => {
        console.log("Error in Fetching User Data:" + error)
      }
    )
  }



  totalQuantity = this.cartData.reduce((totalQuantity, item) => totalQuantity + item.quantity, 0);
  totalAmount$ = new BehaviorSubject<string>('0.00');

  hasAndereProduct(): boolean {
    return this.cartData.some(item =>
      item.productDetails?.category_type === 'Getränke und Sonstiges - Lieferzeiten (Mo-Sa): ca. 16:30 bis 20:30 Uhr' ||
      item.productDetails?.category_type === 'Others'
    );
  }





  checkPublicHoliday(date: string): Promise<boolean> {
    // Convert the selected date string (YYYY-MM-DD) to a Date object
    const selectedDate = new Date(date);

    // Get the year from the selected date
    const selectedYear = selectedDate.getFullYear();

    // Use that year in the API URL
    const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/DE`;

    return new Promise((resolve) => {
      this.http.get<any[]>(apiUrl).subscribe(
        holidays => {
          const isHoliday = holidays.some(holiday => holiday.date === date);
          resolve(isHoliday);
        },
        error => {
          console.error('Error fetching public holidays:', error);
          resolve(false); // treat errors as non-holiday
        }
      );
    });
  }


  // Make validateDate async
  async validateDate(event?: any) {
    // 1️⃣ Get selected date
    let inputDate: Date | null = null;

    if (event?.value) {
      // Angular Material Datepicker event
      inputDate = new Date(event.value);
    } else if (event?.target?.value) {
      // Native input event
      inputDate = new Date(event.target.value);
    } else {
      const formValue = this.orderForm.get('delivery_date')?.value;
      if (formValue) inputDate = new Date(formValue);
    }

    if (!inputDate || isNaN(inputDate.getTime())) {
      this.selectedDateInfo = 'Invalid';
      this.orderForm.get('delivery_date')?.setErrors({ invalidDateFormat: true });
      this.deliveryFee = 0;
      this.updateTotal();
      return;
    }

    const day = inputDate.getDay();
    const formatDateObj = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const formattedDate = formatDateObj(inputDate);

    const currentDate = new Date();
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const todayFormatted = formatDate(currentDate);
    const tomorrowFormattedNew = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));



    const currentDay = currentDate.getDay();
    const currentHour = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    this.selectedDateInfo = '';
    this.orderForm.get('delivery_date')?.setErrors(null);
    this.deliveryFee = 0;

    const blockedDates =
      currentDay === 5 && (currentHour > 16 || (currentHour === 16 && currentMinutes > 0))
        ? [
          todayFormatted,
          tomorrowFormattedNew,
          formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2)),
        ]
        : [];

    if (blockedDates.includes(formattedDate)) {
      this.selectedDateInfo = 'Invalid';
      this.orderForm.get('delivery_date')?.setErrors({ afterFriday4pm: true });
      this.updateTotal();
      return;
    }

    // Product Availability check
    const availabilityMap: { [key: string]: number } = {
      'So': 0, 'Mo': 1, 'Di': 2, 'Mi': 3, 'Do': 4, 'Fr': 5, 'Sa': 6
    };

    let unavailableProductName = '';
    const isAvailable = this.cartData.every(item => {
      if (item.productDetails && item.productDetails.availability) {
        try {
          const productAvail = typeof item.productDetails.availability === 'string'
            ? JSON.parse(item.productDetails.availability)
            : item.productDetails.availability;
          if (Array.isArray(productAvail) && productAvail.length > 0) {
            const allowedDays = productAvail.map((d: string) => availabilityMap[d]);
            if (!allowedDays.includes(day)) {
              unavailableProductName = item.productDetails.product_name;
              return false;
            }
          }
        } catch (e) {
          console.error("Error parsing availability", e);
        }
      }
      return true;
    });

    if (!isAvailable) {
      this.selectedDateInfo = 'Invalid';
      this.orderForm.get('delivery_date')?.setErrors({ productNotAvailable: unavailableProductName });
      this.updateTotal();
      return;
    }

    // ❌ Block today (Allow tomorrow and onwards unless it's a special lockout)
    if (formattedDate === todayFormatted || formattedDate === '2026-01-01') {
      this.selectedDateInfo = 'Invalid';
      this.orderForm.get('delivery_date')?.setErrors({ todayNotAllowed: true });
      this.updateTotal();
      return;
    }

    const isHoliday = await this.checkPublicHoliday(formattedDate);
    const hasAndere = this.hasAndereProduct();

    // Check if it's an admin-defined holiday
    const isDbHoliday = this.dbHolidays.some(h => {
      try {
        // Create date objects for comparison to avoid string format issues
        const d1 = new Date(h.holiday_date);
        const d2 = new Date(formattedDate);

        return d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();
      } catch (e) {
        return false;
      }
    });

    console.log('Holiday Check:', {
      formattedDate,
      isApiHoliday: isHoliday,
      isAdminHoliday: isDbHoliday,
      hasAndere
    });

    // ❌ Block holidays based on category
    if (hasAndere) {
      // "Andere" category products are blocked on Sundays (day 0) and API Public Holidays
      if (isHoliday || day === 0) {
        this.selectedDateInfo = 'Invalid';
        this.orderForm.get('delivery_date')?.setErrors({ holidayNotAllowedForAndere: true });
        this.updateTotal();
        return;
      }
    } else {
      // Normal products are blocked on Admin Defined Holidays
      if (isDbHoliday) {
        this.selectedDateInfo = 'Invalid';
        this.orderForm.get('delivery_date')?.setErrors({ adminHolidayBlocked: true });
        this.updateTotal();
        return;
      }
    }

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    const tomorrowFormatted = formatDate(tomorrow);


    if (
      formattedDate === tomorrowFormatted &&
      isHoliday &&
      (currentHour > 16 || (currentHour === 16 && currentMinutes > 0))
    ) {
      this.selectedDateInfo = 'Invalid';
      this.orderForm.get('delivery_date')?.setErrors({ invalidDate: true });
      this.updateTotal();
      return;
    }
    // Weekend check or weekday check
    if (day === 6 || day === 0) {
      // Saturday or Sunday
      if (isHoliday) {
        // Weekend + public holiday
        this.selectedDateInfo = 'Weekend/PublicHoliday';
      } else {
        this.selectedDateInfo = 'Weekend';
      }
    } else if (isHoliday) {
      // Weekday but public holiday → allow
      this.selectedDateInfo = 'PublicHoliday';
    } else {
      // Normal weekday
      this.selectedDateInfo = 'Valid';
    }

    // Dynamic Delivery Fee and Minimum Order calculation based on cart products
    if (this.selectedDateInfo !== 'Invalid') {
      let maxFee = 0;
      let maxMinOrder = 0;
      const isWeekend = day === 0 || day === 6;

      this.cartData.forEach(item => {
        if (item.productDetails) {
          // Delivery Fee logic
          let itemFee = 0;
          if (isHoliday) {
            itemFee = parseFloat(item.productDetails.holiday_fee) || 0;
          } else if (day === 0) { // Sunday ONLY uses weekend fee
            itemFee = parseFloat(item.productDetails.delivery_fee_weekend) || 0;
          } else { // Weekdays and Saturday use weekday fee
            itemFee = parseFloat(item.productDetails.delivery_fee_weekday) || 0;
          }
          if (itemFee > maxFee) maxFee = itemFee;

          // Minimum Order logic
          let itemMinOrder = parseFloat(item.productDetails.min_delivery_charge) || 0;
          if (itemMinOrder > maxMinOrder) maxMinOrder = itemMinOrder;
        }
      });

      // Fallback to settings if no category-specific fee is found or if it's 0 but settings have a value
      if (maxFee === 0 && this.settings) {
        if (isHoliday) {
          maxFee = parseFloat(this.settings.weekday_fee) || 0;
        } else if (day === 0) { // Sunday ONLY
          maxFee = parseFloat(this.settings.weekend_fee) || 0;
        } else { // Weekdays and Saturday
          maxFee = parseFloat(this.settings.weekday_fee) || 0;
        }
      }
      this.deliveryFee = maxFee;
      this.minOrderRequired = maxMinOrder;
    } else {
      this.deliveryFee = 0;
      this.minOrderRequired = 0;
    }

    if (this.selectedDateInfo !== 'Invalid') {
      localStorage.setItem('selectedDeliveryDate', formattedDate);
    }

    this.updateTotal();
    console.log(`Selected Date Info: ${this.selectedDateInfo}, DeliveryFee: ${this.deliveryFee}`);
  }

  applyCoupon() {
    const couponCode = this.orderForm.get('coupon_code')?.value;
    if (!couponCode) {
      Swal.fire('Error', 'Please enter a coupon code', 'error');
      return;
    }

    this.processCouponApplication(couponCode);
  }

  processCouponApplication(couponCode: string) {
    this.isLoading = true;
    this.dataService.applyCoupon(couponCode, this.userId).subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response.status) {

          // Try to find the coupon in the available list to get the precise type
          const foundCoupon = this.availableCoupons.find(c => c.couponcode === couponCode);
          if (foundCoupon && foundCoupon.type) {
            this.couponType = foundCoupon.type;
          } else {
            this.couponType = response.approve;
          }

          this.couponApplied = true;
          this.orderForm.patchValue({ coupon_code: couponCode });

          // Handle different coupon types
          if (this.couponType === 'Geldgutschein(Benutzerspezifisch)') {
            // Flat discount (User specific money voucher)
            this.discountPercentage = 0;
            this.discountAmount = parseFloat(response.discount_percentage) || 0;
          } else if (this.couponType === 'Prozentrabatt' || this.couponType === 'uservoucher') {
            // Percentage discount or user voucher - apply to item total
            this.discountPercentage = parseFloat(response.discount_percentage) || 0;
            const itemTotalNum = parseFloat(this.itemTotal) || 0;
            this.discountAmount = (itemTotalNum * this.discountPercentage) / 100;
          } else if (this.couponType === 'Versandkostenfrei') {
            // Free delivery - set delivery fee discount
            this.discountAmount = 0;
            this.discountPercentage = 0;
          }

          this.updateTotal();
          Swal.fire('', 'Gutschein erfolgreich eingelöst!', 'success');
        } else {
          Swal.fire('', response.message || 'Ungültiger Gutschein', 'error');
        }
      },
      (error: any) => {
        this.isLoading = false;
        Swal.fire('Error', 'Failed to apply coupon. Please try again.', 'error');
      }
    );
  }

  clearDate(event: MouseEvent) {
    event.stopPropagation();
    this.orderForm.get('delivery_date')?.setValue(null);
    this.selectedDateInfo = '';
    this.deliveryFee = 0;
    this.updateTotal();
  }

  removeCoupon() {
    this.couponApplied = false;
    this.couponType = '';
    this.discountAmount = 0;
    this.discountPercentage = 0;
    this.orderForm.get('coupon_code')?.setValue(null);
    this.updateTotal();
    Swal.fire('', 'Gutschein entfernt', 'info');
  }

  loadAvailableCoupons() {
    this.dataService.getAvailableCoupons(this.userId).subscribe(
      (response: any) => {
        if (response.status) {
          this.availableCoupons = response.coupons;
        }
      },
      (error) => {
        console.log("Error fetching available coupons:", error);
      }
    );
  }

  toggleCouponModal() {
    this.showCouponModal = !this.showCouponModal;
  }

  selectCoupon(code: string) {
    this.toggleCouponModal();
    this.processCouponApplication(code);
  }


  // Helper function to update total including tips + delivery fee
  updateTotal() {
    let itemTotalNum = parseFloat(this.itemTotal) || 0;
    let tipsNum = parseFloat(this.tips) || 0;
    if (isNaN(tipsNum)) tipsNum = 0;

    let actualDeliveryFee = this.deliveryFee;

    // If free delivery coupon is applied, set delivery fee to 0
    if (this.couponType === 'Versandkostenfrei') {
      actualDeliveryFee = 0;
    }

    const total = itemTotalNum + tipsNum + actualDeliveryFee - this.discountAmount;

    this.ngZone.run(() => {
      this.totalAmount = total.toFixed(2);
      this.cdr.detectChanges();
    });
  }




  // validateDate(event?: any) {
  //   let inputDate: Date | null = null;

  //   // If event exists, use its value; otherwise, don't set a date
  //   if (event && event.target?.value) {
  //       inputDate = new Date(event.target.value);
  //   }

  //   const formattedDate = inputDate ? inputDate.toISOString().split('T')[0] : null;
  //   const currentDate = new Date();
  //   const currentDay = currentDate.getDay();
  //   const currentHour = currentDate.getHours();
  //   const currentMinutes = currentDate.getMinutes();

  //   // Reset values before validation
  //   this.selectedDateInfo = '';
  //   this.deliveryFee = 0;
  //   this.orderForm.get('delivery_date')?.setErrors(null);

  //   // Calculate total cost
  //   let itemTotalNum = parseFloat(this.itemTotal) || 0;
  //   let tipsNum = this.tips ? parseFloat(this.tips) : 0;
  //   console.log(tipsNum)
  //   if (isNaN(tipsNum)) {
  //       tipsNum = 0;
  //   }
  //   let newTotal = itemTotalNum + tipsNum;

  //   // Check if it's after Friday 4 PM
  //   const isAfterFriday4PM = 
  //       (currentDay === 5 && (currentHour > 16 || (currentHour === 16 && currentMinutes > 0))) ||
  //       currentDay > 5;

  //   if (isAfterFriday4PM) {
  //       this.selectedDateInfo = 'Invalid';
  //       this.orderForm.get('delivery_date')?.setErrors({ afterFriday4pm: true });
  //   }

  //   if (inputDate) {
  //       const day = inputDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  //       if (day === 6 || day === 0) { 
  //           // If it's a weekend, apply weekend fee
  //           this.selectedDateInfo = 'Weekend';
  //           this.deliveryFee = parseFloat(this.settings.weekend_fee) || 0;
  //       } else if (this.holidays.includes(formattedDate!)) { 
  //           // If it's a holiday on a weekday, apply weekday fee
  //           this.selectedDateInfo = 'Holiday';
  //           this.deliveryFee = parseFloat(this.settings.weekday_fee) || 0;
  //       } else {
  //           // If it's a normal weekday, no extra fee
  //           this.selectedDateInfo = 'Valid';
  //           this.deliveryFee = 0; 
  //       }
  //   }

  //   // Ensure tips and delivery fee are added even if after Friday 4 PM
  //   newTotal += this.deliveryFee;

  //   // Update total price in Angular Zone
  //   this.ngZone.run(() => {
  //       this.totalAmount = newTotal.toFixed(2);
  //       this.cdr.detectChanges();
  //   });

  //   // Save selected delivery date in localStorage
  //   if (formattedDate) {
  //       localStorage.setItem('selectedDeliveryDate', formattedDate);
  //   }

  //   console.log(`Final Total Amount: ${this.totalAmount}`);
  // }














  generateAlphaNumericOTP() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#~$%^&*()-_+=|\?/>.,<[]{}';
    let otp = '';
    for (let i = 0; i < 17; i++) {
      otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
  }


  loadDeliveryAreas() {
    this.dataService.getDeliveryAreasData().subscribe(
      (response) => {
        if (response.status) {
          this.postcodes = response.area;
          console.log(this.postcodes);
        }
      },
      (error) => {
        console.log("Error fetching data in delivery areas: " + error);
      }
    )
  }

  // confirmOrder() {
  //   this.orderData = {
  //     user_id: localStorage.getItem('userId'),
  //     username: this.userData.username,
  //     email: this.userData.email,
  //     deliveryFee:this.deliveryFee,
  //     delivery_date: this.orderForm.value.delivery_date,
  //     address: this.orderForm.value.address || this.userData.address,
  //     contact: this.userData.phone,
  //     instruction: this.orderForm.value.instruction || "deliver to customer",
  //     price: this.itemTotal,
  //     tips: this.tips || 0,
  //     productDetails: this.products,
  //     lat : this.orderForm.value.lat,
  //     lng: this.orderForm.value.lng,
  //     zipcode: this.orderForm.value.zipcode
  //   }

  //   const notification = {
  //     title: "New Order!",
  //     desc: `Order By ${this.userData.username} from ${this.orderData.address}`,
  //     status: 'unread'
  //   }

  //   console.log(this.orderData);





  //   this.dataService.confirmOrder(this.orderData).subscribe(
  //     (response) => {
  //       if (response.status) {
  //         var orderid=response.orders.order.order_id

  //         window.location.href = `https://api.frischfuersie.de/checkout/${this.totalAmount + this.tips}/${orderid}/${localStorage.getItem('userId')}`;



  //       }
  //     },
  //     (error) => {
  //       Swal.fire('Fehler!', 'Bestellung fehlgeschlagen!!!', 'error');
  //     }
  //   )

  // }

  confirmOrder() {
    this.isLoading = true;

    // Check product availability for selected date
    const deliveryDate = this.orderForm.get('delivery_date')?.value;
    if (deliveryDate) {
      const dateObj = new Date(deliveryDate);
      const dayIndex = dateObj.getDay();
      const dayMap = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
      const selectedDay = dayMap[dayIndex];

      const unavailableItems = this.cartData.filter(item => {
        if (!item.productDetails?.availability) return false;
        try {
          let availability = item.productDetails.availability;
          if (typeof availability === 'string') {
            availability = JSON.parse(availability);
          }
          return Array.isArray(availability) && !availability.includes(selectedDay);
        } catch (e) {
          return !item.productDetails.availability.includes(selectedDay);
        }
      });

      if (unavailableItems.length > 0) {
        this.isLoading = false;
        const productNames = unavailableItems.map(item => item.productDetails.product_name).join(', ');
        Swal.fire({
          title: 'Produkt nicht verfügbar',
          text: `Die folgenden Produkte sind am gewählten Lieferdatum (${selectedDay}) nicht verfügbar: ${productNames}. Sie werden aus dem Warenkorb entfernt.`,
          icon: 'warning',
          showConfirmButton: true,
          confirmButtonText: 'OK'
        }).then(async (result) => {
          if (result.isConfirmed) {
            this.isLoading = true;
            for (const item of unavailableItems) {
              await this.dataService.deleteCartData(item.id).toPromise();
            }

            // Notify other components (like Navbar) that the cart has changed
            this.dataService.cartLoad?.next(true);
            this.dataService.cartLoad1.next(true);
            this.dataService.refreshCartCount(this.userId);

            if (unavailableItems.length === this.cartData.length) {
              this.router.navigate(['/ourProducts']);
            } else {
              this.loadCartData();
              Swal.fire({
                title: 'Warenkorb aktualisiert',
                text: 'Nicht verfügbare Produkte wurden entfernt. Sie können nun mit den verbleibenden Artikeln fortfahren.',
                icon: 'info',
                timer: 3000,
                showConfirmButton: false
              });
            }
          }
        });
        return;
      }
    }

    // Ensure postcodes are loaded before checking
    if (!this.postcodes || this.postcodes.length === 0) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Liefergebiete konnten nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error');
      return;
    }

    // Get the entered zipcode
    const enteredZipcode = this.orderForm.value.zipcode;

    // Check if enteredZipcode exists in the postcodes list
    const isZipcodeAvailable = this.postcodes.some((area: any) => area.zipcode.toString() === enteredZipcode.toString());

    if (!isZipcodeAvailable) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Lieferung an diese Postleitzahl ist nicht verfügbar!', 'warning');
      return; // Stop execution
    }

    const rawDate = this.orderForm.get('delivery_date')?.value;
    const dateObj = new Date(rawDate);
    const formattedDate = !isNaN(dateObj.getTime()) 
      ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
      : rawDate;

    // Proceed with order if zipcode is valid
    this.orderData = {
      user_id: localStorage.getItem('userId'),
      username: this.userData.username,
      email: this.userData.email,
      deliveryFee: this.deliveryFee,
      delivery_date: formattedDate,
      // address: 
      //   (this.orderForm.value.address || this.orderForm.value.zipcode || this.userData.ort)
      //     ? `${this.orderForm.value.address || ''}, ${this.orderForm.value.zipcode || ''}, ${this.userData.ort || ''}`
      //     : this.userData.address,
      address:
        (this.orderForm.value.street && this.orderForm.value.address &&
          this.orderForm.value.zipcode &&
          this.userData.ort)
          ? `${this.orderForm.value.street} ${this.orderForm.value.address},${this.orderForm.value.zipcode},${this.userData.ort}`
          : `${this.userData.street || ''} ${this.userData.address || ''},${this.userData.zipcode || ''},${this.userData.ort || ''}`,

      contact: this.userData.phone,
      instruction: this.orderForm.value.instruction,
      price: this.itemTotal,
      tips: this.tips || 0,
      productDetails: this.products,
      lat: this.orderForm.value.lat,
      lng: this.orderForm.value.lng,
      zipcode: enteredZipcode,
      ort: this.userData.ort,
      // Coupon information (if applied)
      couponCode: this.couponApplied ? this.orderForm.value.coupon_code : null,
      couponType: this.couponApplied ? this.couponType : null,
      discountPercentage: this.couponApplied ? this.discountPercentage : 0,
      discountAmount: this.couponApplied ? this.discountAmount : 0,
      is_age_verified: localStorage.getItem('isAgeVerified') === 'true' ? 1 : 0
    };


    console.log(this.orderData);

    this.dataService.confirmOrder(this.orderData).subscribe(
      (response: any) => {

        this.isLoading = false;
        if (response.status) {
          var orderid = response.orders.order.order_id;

          // ✅ Navigate to new pay-now component
          this.router.navigate(['/pay-now'], {
            queryParams: {
              orderId: orderid,
              amount: this.totalAmount,
              userId: localStorage.getItem('userId')
            }
          });
          // var orderid = response.orders.order.order_id;
          // window.location.href = https://api.frischfuersie.de/checkout/${this.totalAmount}/${orderid}/${localStorage.getItem('userId')};
        }
      },
      (error) => {
        this.isLoading = false;
        Swal.fire('Fehler!', 'Bestellung fehlgeschlagen!!!', 'error');
      }
    );
  }



}



