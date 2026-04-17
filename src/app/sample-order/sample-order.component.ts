import { Component, OnInit, ElementRef, NgZone, ViewChild } from '@angular/core';
import { AuthService } from '../auth.service';
import { DataService } from '../data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';

declare var google: any;


@Component({
  selector: 'app-sample-order',
  templateUrl: './sample-order.component.html',
  styleUrls: ['./sample-order.component.css']
})
export class SampleOrderComponent implements OnInit {
  isLoading = false;
  houseNo: string = '';
  address: string = '';
  storedAddress: any;
  city: string = '';
  lat: any;
  lng: any;
  postcodes: any[] = []
  @ViewChild('addressInput', { static: false }) addressInputRef!: ElementRef;
  constructor(private http: HttpClient, private authService: AuthService, private ngZone: NgZone, private dataService: DataService, private fb: FormBuilder, private route: ActivatedRoute, private router: Router) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  fileUrl = this.dataService.fileUrl;

  SampleOrderForm!: FormGroup
  userId: any
  userData: any = {}
  minDate: string

  selectedDateInfo: string = ''
  isLogin = this.authService.isLoggedIn;
  settings: any = {}

  product: any = {}
  sampleOrderData: any = {}

  productId: any;

  ngOnInit(): void {
    this.loadUserData();
    this.loadSettingsData();
    this.loadSampleProduct();
    this.initializeForms();
    this.loadDeliveryAreas();
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

  // initializeForms(): void {
  //   this.SampleOrderForm = this.fb.group({
  //     address: [null],
  //     instruction: [null],
  //     delivery_date: [null, Validators.required],
  //     zipcode: [null, Validators.required]
  //   })
  // }

  private initializeForms(): void {
    const fullAddress = this.houseNo && this.address && this.city
      ? `${this.houseNo}, ${this.address}, ${this.city}`
      : this.storedAddress;
    this.SampleOrderForm = this.fb.group({
      address: [fullAddress],
      instruction: [null],
      delivery_date: [null, Validators.required],
      lat: [this.lat],
      lng: [this.lng],
      zipcode: [null, Validators.required]
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

  loadSampleProduct() {
    // this.route.paramMap.subscribe((params) => {
    //   this.productId = params.get('id');
    //   console.log(this.productId);
    // })
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      console.log('Product ID:', this.productId);
    });
    this.route.queryParams.subscribe(params => {

      const type = params['type'] ? +params['type'] : 2;
      console.log('Order Type:', type);



      console.log('Product ID:', this.productId);
      console.log('Order Type:', type);

      if (type == 2) {
        this.dataService.getProductById(this.productId).subscribe(
          (response) => {
            if (response.status) {
              this.product = response.product;
              console.log("============", this.product);
            }
          },
          (error) => {
            console.log("Error in fetching sample order data", error);

          }
        )
      }
      else if (type == 1) {
        this.dataService.getSampleProductsDataByID(this.productId).subscribe(

          (response) => {
            if (response.status) {
              this.product = response.sampleOrder;
              console.log("============", this.product);
            }
          },
          (error) => {
            console.log("Error in fetching sample order data", error);

          }
        )
      }
    });
    // if(type = 2)
    //     this.dataService.getProductById(this.productId).subscribe(
    //       (response) => {
    //         if (response.status) {
    //           this.product = response.product;
    //           console.log("============", this.product);
    //         }
    //       },
    //       (error) => {
    //         console.log("Error in fetching sample order data", error);

    //       }
    //     )
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
          this.SampleOrderForm.patchValue({
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




  // validateDate(event: any) {
  //     const inputDate = new Date(event.target.value); // Selected date
  //     const day = inputDate.getDay(); // 0 = Sunday, 6 = Saturday
  //     const formattedDate = inputDate.toISOString().split('T')[0]; // YYYY-MM-DD

  //     const currentDate = new Date();
  //     const todayFormatted = currentDate.toISOString().split('T')[0];
  //     const currentDay = currentDate.getDay();
  //     const currentHour = currentDate.getHours();
  //     const currentMinutes = currentDate.getMinutes();

  //     this.selectedDateInfo = ''; // Reset
  //     this.SampleOrderForm.get('delivery_date')?.setErrors(null); // Reset errors

  //     // Helper to format date as YYYY-MM-DD
  //     const formatDate = (date: Date) => {
  //       const y = date.getFullYear();
  //       const m = String(date.getMonth() + 1).padStart(2, '0');
  //       const d = String(date.getDate()).padStart(2, '0');
  //       return `${y}-${m}-${d}`;
  //     };

  //     // ❌ Block Friday 4 PM onwards + Saturday & Sunday
  //     if (currentDay === 5 && (currentHour > 16 || (currentHour === 16 && currentMinutes > 0))) {
  //       const blockedDates = [
  //         formatDate(currentDate), // Friday
  //         formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)), // Saturday
  //         formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2)), // Sunday
  //       ];

  //       if (blockedDates.includes(formattedDate)) {
  //         this.selectedDateInfo = 'Invalid';
  //         this.SampleOrderForm.get('delivery_date')?.setErrors({ afterFriday4pm: true });
  //         return;
  //       }
  //     }

  //     // ❌ Block today
  //     if (formattedDate === todayFormatted) {
  //       this.selectedDateInfo = 'Invalid';
  //       this.SampleOrderForm.get('delivery_date')?.setErrors({ todayNotAllowed: true });
  //       return;
  //     }

  //     // ✅ Allow only Saturday/Sunday if not blocked
  //     if (day === 6 || day === 0) {
  //       this.selectedDateInfo = 'Weekend';
  //     } else {
  //       this.selectedDateInfo = 'Invalid';
  //       this.SampleOrderForm.get('delivery_date')?.setErrors({ invalidDate: true });
  //     }

  //     // Check if the selected date is a public holiday in Germany
  //     this.checkPublicHoliday(formattedDate);
  //   }


  validateDate(event: any) {
    const inputDate = new Date(event.target.value);
    const day = inputDate.getDay();
    const formattedDate = inputDate.toISOString().split('T')[0];

    const currentDate = new Date();
    const todayFormatted = currentDate.toISOString().split('T')[0];
    const currentDay = currentDate.getDay();
    const currentHour = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    this.selectedDateInfo = '';
    this.SampleOrderForm.get('delivery_date')?.setErrors(null);

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // ❌ Block Friday 4 PM onwards
    if (currentDay === 5 && (currentHour > 16 || (currentHour === 16 && currentMinutes > 0))) {
      const blockedDates = [
        formatDate(currentDate),
        formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)),
        formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2)),
      ];

      if (blockedDates.includes(formattedDate)) {
        this.selectedDateInfo = 'Invalid';
        this.SampleOrderForm.get('delivery_date')?.setErrors({ afterFriday4pm: true });
        return;
      }
    }

    // ❌ Today not allowed
    if (formattedDate === todayFormatted) {
      this.selectedDateInfo = 'Invalid';
      this.SampleOrderForm.get('delivery_date')?.setErrors({ todayNotAllowed: true });
      return;
    }

    // ✅ ONLY Saturday allowed
    if (day === 6) {
      this.selectedDateInfo = 'Saturday';
    } else {
      this.selectedDateInfo = 'Invalid';
      this.SampleOrderForm.get('delivery_date')?.setErrors({ invalidDate: true });
      return;
    }

    // Public holiday check
    this.checkPublicHoliday(formattedDate);
  }


  checkPublicHoliday(date: string) {
    const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${new Date().getFullYear()}/DE`;
    this.http.get<any[]>(apiUrl).subscribe(
      holidays => {
        const isHoliday = holidays.some(holiday => holiday.date === date);
        if (isHoliday) {
          this.selectedDateInfo = 'Public Holiday';
          const control = this.SampleOrderForm.get('delivery_date');
          control?.setErrors({ publicHoliday: true });
          control?.markAsTouched();
        }
      },
      error => {
        console.error('Error fetching public holidays:', error);
      }
    );
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


  confirmOrder() {
    this.isLoading = true;
    if (!this.postcodes || this.postcodes.length === 0) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Liefergebiete konnten nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error');
      return;
    }

    // Get the entered zipcode
    const enteredZipcode = this.SampleOrderForm.value.zipcode;

    // Check if enteredZipcode exists in the postcodes list
    const isZipcodeAvailable = this.postcodes.some((area: any) => area.zipcode.toString() === enteredZipcode.toString());

    if (!isZipcodeAvailable) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Lieferung an diese Postleitzahl ist nicht verfügbar!', 'warning');
      return; // Stop execution
    }

    //       let rawDate = this.SampleOrderForm.value.delivery_date;
    // let formattedDate = '';

    // // If it's a string
    // if (typeof rawDate === 'string') {
    //   if (rawDate.includes('-')) {
    //     const parts = rawDate.split('-');
    //     if (parts[0].length === 4) {
    //       // Already YYYY-MM-DD
    //       formattedDate = rawDate;
    //     } else {
    //       // DD-MM-YYYY → convert
    //       const [day, month, year] = parts;
    //       formattedDate = `${year}-${month}-${day}`;
    //     }
    //   }
    // } 
    // // If it's a Date object
    // else if (rawDate instanceof Date) {
    //   const year = rawDate.getFullYear();
    //   const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    //   const day = String(rawDate.getDate()).padStart(2, '0');
    //   formattedDate = `${year}-${month}-${day}`;
    // } else {
    //   console.error('Invalid delivery_date:', rawDate);
    // }

    const rawDate = this.SampleOrderForm.get('delivery_date')?.value;
    const dateObj = new Date(rawDate);
    const formattedDate = !isNaN(dateObj.getTime()) 
      ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
      : rawDate;

    this.sampleOrderData = {
      user_id: localStorage.getItem('userId'),
      delivery_date: formattedDate,
      // address: this.SampleOrderForm.value.address || this.userData.address,
      address:
        (this.SampleOrderForm.value.street && this.SampleOrderForm.value.address &&
          this.SampleOrderForm.value.zipcode &&
          this.userData.ort)
          ? `${this.SampleOrderForm.value.street} ${this.SampleOrderForm.value.address},${this.SampleOrderForm.value.zipcode},${this.userData.ort}`
          : `${this.userData.street || ''} ${this.userData.address || ''},${this.userData.zipcode || ''},${this.userData.ort || ''}`,

      contact: this.userData.phone,
      instruction: this.SampleOrderForm.value.instruction,
      price: 0.00,
      tips: 0.00,
      // productDetails: [[ this.product.products, 1 ]],
      productDetails: this.product.products.map((prod: any) => [
        prod.name,
        1,
        "0"
      ]),
      lat: this.SampleOrderForm.value.lat,
      lng: this.SampleOrderForm.value.lng,
      zipcode: this.SampleOrderForm.value.zipcode,
      username: this.userData.username,
      email: this.userData.email,
      ort: this.userData.ort,
      status: 'pending',
      type: 2, // Assuming type 2 is for sample orders for mail sending backend reference
      // deliveryFee: this.deliveryFee,
    }

    console.log(this.sampleOrderData);

    const notification = {
      title: "New Order!",
      desc: `Free Trial Order By ${this.userData.username} from ${this.sampleOrderData.address}`,
      status: 'unread'
    }

    console.log(this.sampleOrderData);

    this.dataService.confirmOrder(this.sampleOrderData).subscribe(
      (response) => {
        this.isLoading = false;
        if (response.status) {
          Swal.fire('Erfolg!', "Erfolgreich bestellt!!!", 'success');

          this.dataService.notifyToAdmin(notification).subscribe(
            (response) => {
              if (response.status) {
                console.log("notofication to admin");
                this.router.navigate(['/manageOrders']);
              }
            },
            (error) => {
              console.log("Failed to notify", error);
            }
          )
        }
      },
      (error) => {
        this.isLoading = false;
        Swal.fire('Fehler!', 'Bestellung fehlgeschlagen!!!', 'error');
      }
    )

  }

}
