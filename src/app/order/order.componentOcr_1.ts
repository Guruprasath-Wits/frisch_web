import { Component, OnInit,ElementRef, NgZone, ViewChild,ChangeDetectorRef } from '@angular/core';
import { DataService } from '../data.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { BehaviorSubject } from 'rxjs';
import { LOCATION_INITIALIZED } from '@angular/common';



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

  constructor(private cdr: ChangeDetectorRef,private ngZone: NgZone,private fb: FormBuilder, private dataService: DataService, private authService: AuthService, private route: ActivatedRoute, private router: Router) {
  
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
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
  minDate: string;

  paymentHandler: any = null;

  // stripeAPIKey: any = 'pk_test_TYooMQauvdEDq54NiTphI7jx';

  // totalAmount: any = this.route.snapshot.paramMap.get('totalAmount');
  // tips: any = this.route.snapshot.paramMap.get('tips');

  itemTotal: any = localStorage.getItem('total');
  totalAmount: any = parseFloat(localStorage.getItem('totalAmount') ?? '0').toFixed(2).toString();
  tips: any = localStorage.getItem('tips');
  

  selectedDateInfo: string = ''
  holidays: any[] = []
  deliveryFee: number = 0;

  i: number = 0

 

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
      zipcode: [null, Validators.required]
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

    this.cartData.forEach(cartItem => {
      this.dataService.getProductById(cartItem.product_id).subscribe(
        (productResponse) => {
          cartItem.productDetails = productResponse.product;
          console.log(cartItem.productDetails)
          loadedProducts++;
          // console.log(cartItem);
          this.products[this.i++] = [cartItem.productDetails.product_name, cartItem.quantity,cartItem.productDetails.price];
          console.log(this.products);
        },
        (error) => {
          console.log("Error fetching product details for product_id " + cartItem.product_id + ":", error);
          loadedProducts++;
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

  


validateDate(event?: any) {
  // 1️⃣ Get selected date
  let inputDate: Date | null = null;

  if (event && event.target?.value) {
    inputDate = new Date(event.target.value);
  } else {
    // Use existing form value if no event (ngOnInit call)
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

  const day = inputDate.getDay(); // 0 = Sunday, 6 = Saturday
  const formattedDate = inputDate.toISOString().split('T')[0];

  const currentDate = new Date();
  const todayFormatted = currentDate.toISOString().split('T')[0];
  const currentDay = currentDate.getDay();
  const currentHour = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  // Reset errors & state
  this.selectedDateInfo = '';
  this.orderForm.get('delivery_date')?.setErrors(null);
  this.deliveryFee = 0;

  // Helper to format date
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // ❌ Block Friday 4 PM onwards + Saturday & Sunday
  const blockedDates =
    currentDay === 5 && (currentHour > 16 || (currentHour === 16 && currentMinutes > 0))
      ? [
          formatDate(currentDate), // Friday
          formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)), // Saturday
          formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2)), // Sunday
        ]
      : [];

  if (blockedDates.includes(formattedDate)) {
    this.selectedDateInfo = 'Invalid';
    this.orderForm.get('delivery_date')?.setErrors({ afterFriday4pm: true });
    this.updateTotal();
    return;
  }

  // ❌ Block today
  if (formattedDate === todayFormatted) {
    this.selectedDateInfo = 'Invalid';
    this.orderForm.get('delivery_date')?.setErrors({ todayNotAllowed: true });
    this.updateTotal();
    return;
  }

  // ✅ Weekend check
  if (day === 6 || day === 0) {
    this.selectedDateInfo = 'Weekend';
    this.deliveryFee = parseFloat(this.settings.weekend_fee) || 0;
  } else {
    this.selectedDateInfo = 'Invalid';
    this.orderForm.get('delivery_date')?.setErrors({ invalidDate: true });
    this.deliveryFee = parseFloat(this.settings.weekday_fee) || 0; // optional for weekday fee
  }

  // Save valid date
  if (this.selectedDateInfo !== 'Invalid') {
    localStorage.setItem('selectedDeliveryDate', formattedDate);
  }

  // Update total amount
  this.updateTotal();

  console.log(`Selected Date Info: ${this.selectedDateInfo}, DeliveryFee: ${this.deliveryFee}`);
}

// Helper function to update total including tips + delivery fee
updateTotal() {
  let itemTotalNum = parseFloat(this.itemTotal) || 0;
  let tipsNum = parseFloat(this.tips) || 0;
  if (isNaN(tipsNum)) tipsNum = 0;

  const total = itemTotalNum + tipsNum + this.deliveryFee;

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
    (error)=>{
      console.log("Error fetching data in delivery areas: "+error);
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
  
    // Proceed with order if zipcode is valid
  this.orderData = {
  user_id: localStorage.getItem('userId'),
  username: this.userData.username,
  email: this.userData.email,
  deliveryFee: this.deliveryFee,
  delivery_date: this.orderForm.value.delivery_date,
  // address: 
  //   (this.orderForm.value.address || this.orderForm.value.zipcode || this.userData.ort)
  //     ? `${this.orderForm.value.address || ''}, ${this.orderForm.value.zipcode || ''}, ${this.userData.ort || ''}`
  //     : this.userData.address,
  address:
  (this.orderForm.value.address &&
   this.orderForm.value.zipcode &&
   this.userData.ort)
    ? `${this.orderForm.value.address},${this.orderForm.value.zipcode},${this.userData.ort}`
    : `${this.userData.address || ''},${this.userData.zipcode || ''},${this.userData.ort || ''}`,

  contact: this.userData.phone,
  instruction: this.orderForm.value.instruction,
  price: this.itemTotal,
  tips: this.tips || 0,
  productDetails: this.products,
  lat: this.orderForm.value.lat,
  lng: this.orderForm.value.lng,
  zipcode: enteredZipcode,
  ort: this.userData.ort
};

  
    console.log(this.orderData);
  
    this.dataService.confirmOrder(this.orderData).subscribe(
      (response:any) => {
        
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

  



