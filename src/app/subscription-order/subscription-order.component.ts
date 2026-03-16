import { Component, OnInit, NgZone, ElementRef, ViewChild, ChangeDetectorRef, Inject } from '@angular/core';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


declare var google: any;
@Component({
  selector: 'app-subscription-order',
  templateUrl: './subscription-order.component.html',
  styleUrls: ['./subscription-order.component.css']
})
export class SubscriptionOrderComponent implements OnInit {

  constructor(private authService: AuthService, private dataService: DataService,
    private fb: FormBuilder, private route: ActivatedRoute, private router: Router,
    public dialog: MatDialog, private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    this.minDate = new Date().toISOString().split('T')[0];
  }
  isDialogOpen = false;
  SubscriptionForm!: FormGroup
  @ViewChild('addressInput', { static: false }) addressInputRef!: ElementRef;
  settings: any = {}

  fileUrl = this.dataService.fileUrl
  isLogin = this.authService.isLoggedIn
  cartData: any[] = []
  products: any[] = []
  userId: any
  userData: any = {}
  i: number = 0
  postcodes: any[] = []
  isLoading = false;
  itemTotal: any = localStorage.getItem('total') || '0.00';
  totalAmount: any = parseFloat(localStorage.getItem('totalAmount') ?? '0').toFixed(2).toString();
  tips: any = localStorage.getItem('tips');

  selectedDateInfo: string = ''
  deliveryFee: number = 0;
  orderData: any = {}
  minDate: string;

  subscribeData: any = {}
  subscriptionData: any[] = []
  holidays: any[] = []
  weekend_fee: any
  weekday_fee: any
  showFirst20Popup = false;

  ibanVerified: boolean = false;
  ibanError: string = '';
  ibanDetails: any = null;
  // setting = {
  //   declaration: "By accepting this SEPA mandate, you authorize us to collect payments from your bank account."
  // };

  ngOnInit(): void {
    setTimeout(() => {
      this.inialTotal();
    });
    this.loadSettingsData();
    this.loadUserData()
    this.fetchSubscriptionData()
    this.loadDeliveryAreas();
    this.initializeForms();
    this.loadCartData();
  }

  inialTotal() {
    let itemTotalNum = parseFloat(this.itemTotal) || 0;
    let tipsNum = this.tips ? parseFloat(this.tips) : 0;
    if (isNaN(tipsNum)) {
      tipsNum = 0;
    }
    this.totalAmount = (itemTotalNum + tipsNum).toFixed(2).toString();
  }

  verifyIban() {
    const iban = this.SubscriptionForm.get('iban')?.value;
    const customerName = this.userData?.username || '';
    this.ibanError = '';
    this.ibanVerified = false;
    this.ibanDetails = null;

    if (!iban || !customerName) {
      this.ibanError = 'Bitte IBAN und Name eingeben.';
      return;
    }

    this.dataService.validateIban({ iban, customerName }).subscribe(
      (res: any) => {
        if (res?.validation?.valid) {
          this.ibanVerified = true;
          this.ibanDetails = res;
          // Patch values into the form
          this.SubscriptionForm.patchValue({
            bankName: res.validation.bic.name || '',
            bic: res.validation.bic.bic || '',
            nationalBankCode: res.validation.bic.nationalBankCode || '',
            formattedIban: res.validation.iban || ''
          });
        } else {
          this.ibanError = 'IBAN ist ungültig.';
          // Clear bank fields if invalid
          this.SubscriptionForm.patchValue({
            bankName: '',
            bic: '',
            nationalBankCode: '',
            formattedIban: ''
          });
        }
      },
      (error: any) => {
        this.ibanError = 'Fehler bei der IBAN-Prüfung.';
        this.SubscriptionForm.patchValue({
          bankName: '',
          bic: '',
          nationalBankCode: '',
          formattedIban: ''
        });
      }
    );
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
          this.SubscriptionForm.patchValue({
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

  openDialog() {
    console.log('Settings:', this.settings);
    console.log('Description:', this.settings?.description);

    this.dialog.open(InlineDialogComponent, {
      width: '500px',
      panelClass: 'custom-dialog-container',
      data: {
        declaration: this.settings?.description || ''  // fallback to empty string
      }
    });
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


  closeDialog() {
    this.isDialogOpen = false;
  }

  async fetchGermanHolidays() {
    try {
      const response = await fetch('https://get.api-feiertage.de?states=nw');
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = await response.json();
      // console.log('Holidays:', data['feiertage']);

      const dates = Object.values(data['feiertage']);
      // console.log('Dates:', dates);

      dates.map((item: any) => {
        this.holidays.push(item.date)
      })

      console.log(this.holidays);

      return dates;
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
  get iban() {
    return this.SubscriptionForm.get('iban');
  }


  private initializeForms(): void {
    this.SubscriptionForm = this.fb.group({
      paymentType: ['', Validators.required],
      iban: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{22}$/)]],
      declaration: [false, Validators.requiredTrue],
      bankName: [''],
      bic: [''],
      nationalBankCode: [''],
      formattedIban: [''],
      address: [''],
      zipcode: ['', Validators.required],
      instruction: [''],
      delivery_date: ['', Validators.required],
      delivery_day_option: ['', Validators.required]
    }, { updateOn: 'change' });
  }

  weekendError = false;

  validateWeekend() {
    const selectedOption = this.SubscriptionForm.get('delivery_day_option')?.value;
    this.weekendError = !selectedOption;
  }


  selectWeekend(option: string) {
    this.SubscriptionForm.get('delivery_day_option')?.setValue(option);
    this.weekendError = false;
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
    this.i = 0;
    let loadedProducts = 0;

    this.cartData.forEach(cartItem => {
      this.dataService.getProductById(cartItem.product_id).subscribe(
        (productResponse) => {
          cartItem.productDetails = productResponse.product;
          loadedProducts++;
          // console.log(cartItem);

          this.products[this.i++] = [cartItem.productDetails.product_name, cartItem.quantity, cartItem.productDetails.price];
          console.log(this.products);
          this.cdr.detectChanges();
        },
        (error) => {
          console.log("Error fetching product details for product_id " + cartItem.product_id + ":", error);
          loadedProducts++;
          this.cdr.detectChanges();
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


  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  validateDate(event?: any) {
    let inputDate: Date | null = null;

    if (event?.target?.value) {
      inputDate = new Date(event.target.value);
    } else {
      const formValue = this.SubscriptionForm.get('delivery_date')?.value;
      if (formValue) inputDate = new Date(formValue);
    }

    if (!inputDate) return;

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const formattedDate = formatDate(inputDate);
    const selectedDay = inputDate.getDay();

    if (selectedDay === 0) {
      this.selectedDateInfo = 'Sunday';
    } else if (selectedDay === 6) {
      this.selectedDateInfo = 'Saturday';
    } else {
      this.selectedDateInfo = 'Invalid';
      this.SubscriptionForm.get('delivery_date')?.setErrors({ invalidDate: true });
    }

    localStorage.setItem('selectedSubscriptionDate', formattedDate);
  }

  disableSaturday = false;
  disableSunday = false;




  fetchSubscriptionData() {
    this.userId = localStorage.getItem('userId');
    this.dataService.getSubscriptionOrderData(this.userId).subscribe(
      (response) => {
        if (response.status) {
          this.subscriptionData = response.orders
          console.log(this.subscriptionData);
        }
      },
      (error) => {
        console.log("Failed to extract orders!!!", error);

      }
    )
  }
  paymentType: 'sepa' | 'paypal' = 'sepa';

  confirmSubscription() {
    this.paymentType = this.SubscriptionForm.value.paymentType;
    if (this.paymentType === 'sepa') {
      this.confirmSubscriptionOrder();
    } else if (this.paymentType === 'paypal') {
      this.startPaypalSubscription();
    } else if (this.paymentType === 'Überweisung') {
      this.startBankTransferSubscription();
    }
  }

  startBankTransferSubscription() {

    this.isLoading = true;

    if (!this.postcodes || this.postcodes.length === 0) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Liefergebiete konnten nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error');
      return;
    }
    const enteredZipcode = this.SubscriptionForm.value.zipcode;

    // Check if enteredZipcode exists in the postcodes list
    const isZipcodeAvailable = this.postcodes.some((area: any) => area.zipcode.toString() === enteredZipcode.toString());

    if (!isZipcodeAvailable) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Lieferung an diese Postleitzahl ist nicht verfügbar!', 'warning');
      return; // Stop execution
    }
    this.orderData = {
      user_id: localStorage.getItem('userId'),
      username: this.userData.username,
      email: this.userData.email,
      delivery_date: this.SubscriptionForm.value.delivery_date,
      iban: this.SubscriptionForm.value.iban,
      bankName: this.SubscriptionForm.value.bankName,           // <-- add this
      bic: this.SubscriptionForm.value.bic,                     // <-- add this
      nationalBankCode: this.SubscriptionForm.value.nationalBankCode, // <-- add this
      formattedIban: this.SubscriptionForm.value.formattedIban, // <-- add this

      //    address: 
      // (this.SubscriptionForm.value.address || this.SubscriptionForm.value.zipcode || this.userData.ort)
      //   ? `${this.SubscriptionForm.value.address || ''}, ${this.SubscriptionForm.value.zipcode || ''}, ${this.userData.ort || ''}`
      //   : this.userData.address,

      address:
        (this.SubscriptionForm.value.street && this.SubscriptionForm.value.address &&
          this.SubscriptionForm.value.zipcode &&
          this.userData.ort)
          ? `${this.SubscriptionForm.value.street} ${this.SubscriptionForm.value.address},${this.SubscriptionForm.value.zipcode},${this.userData.ort}`
          : `${this.userData.street || ''} ${this.userData.address || ''},${this.userData.zipcode || ''},${this.userData.ort || ''}`,
      contact: this.userData.phone,
      deliveryFee: this.deliveryFee,
      instruction: this.SubscriptionForm.value.instruction,
      price: this.itemTotal,
      tips: this.tips || 0,
      productDetails: this.products,
      zipcode: enteredZipcode,
      ort: this.userData.ort,
      declaration: this.SubscriptionForm.value.declaration,
      paymentType: this.SubscriptionForm.value.paymentType,
      deliveryDayOption: this.SubscriptionForm.value.delivery_day_option
    };

    const notification = {
      title: "New Subscription Order!",
      desc: `New Subscription Order By ${this.userData.username} from ${this.orderData.address}`,
      status: 'unread'
    };

    console.log(this.orderData)

    this.dataService.subscriptionCheck(this.orderData.user_id).subscribe(
      (response) => {
        if (response.status) {
          Swal.fire(
            'Bitte beachten Sie!',
            'Sie haben bereits eine Dauerbestellung angelegt.<br><br>' +
            'Falls Sie etwas ändern möchten:<br>' +
            'Gehen Sie zu <b>Mein Konto → Dauerbestellung</b> und klicken Sie auf das grüne Bearbeiten-Symbol, damit Sie Produkte hinzufügen oder löschen können.<br><br>' +
            'Danke!',
            'warning'
          );
        }

      },
      (error) => {
        // Place Subscription Order
        this.dataService.subscriptionOrder(this.orderData).subscribe(

          (response) => {
            // if (response.status) {
            //   Swal.fire('Erfolg!', "Abonnementbestellung erfolgreich aufgegeben!!!", 'success');

            //   this.clearSubscriptionCartAndNotify();



            // }
            if (response.status) {
              Swal.fire({
                title: 'Erfolg!',
                text: 'Ihre Dauerbestellung wurde erfolgreich aufgegeben.',
                icon: 'success',
                showConfirmButton: false,
              })
              this.clearSubscriptionCartAndNotify();

            }

          },
          (error) => {
            Swal.fire('Fehler!', 'Bestellung fehlgeschlagen!!!', 'error');
          }
        );
      }
    );
  }

  confirmSubscriptionOrder() {

    this.isLoading = true;
    if (!this.SubscriptionForm.value.declaration) {
      Swal.fire({
        position: "top-end",
        icon: "warning",
        title: "Lesen Sie die Erklärung",
        showConfirmButton: false,
        timer: 1500
      });
      return;
    }
    // Ensure postcodes are loaded before checking
    if (!this.postcodes || this.postcodes.length === 0) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Liefergebiete konnten nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error');
      return;
    }
    const enteredZipcode = this.SubscriptionForm.value.zipcode;

    // Check if enteredZipcode exists in the postcodes list
    const isZipcodeAvailable = this.postcodes.some((area: any) => area.zipcode.toString() === enteredZipcode.toString());

    if (!isZipcodeAvailable) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Lieferung an diese Postleitzahl ist nicht verfügbar!', 'warning');
      return; // Stop execution
    }
    this.orderData = {
      user_id: localStorage.getItem('userId'),
      username: this.userData.username,
      email: this.userData.email,
      delivery_date: this.SubscriptionForm.value.delivery_date,
      iban: this.SubscriptionForm.value.iban,
      bankName: this.SubscriptionForm.value.bankName,           // <-- add this
      bic: this.SubscriptionForm.value.bic,                     // <-- add this
      nationalBankCode: this.SubscriptionForm.value.nationalBankCode, // <-- add this
      formattedIban: this.SubscriptionForm.value.formattedIban, // <-- add this
      //    address: 
      // (this.SubscriptionForm.value.address || this.SubscriptionForm.value.zipcode || this.userData.ort)
      //   ? `${this.SubscriptionForm.value.address || ''}, ${this.SubscriptionForm.value.zipcode || ''}, ${this.userData.ort || ''}`
      //   : this.userData.address,

      address:
        (this.SubscriptionForm.value.address &&
          this.SubscriptionForm.value.zipcode &&
          this.userData.ort)
          ? `${this.SubscriptionForm.value.address},${this.SubscriptionForm.value.zipcode},${this.userData.ort}`
          : `${this.userData.address || ''},${this.userData.zipcode || ''},${this.userData.ort || ''}`,
      contact: this.userData.phone,
      deliveryFee: this.deliveryFee,
      instruction: this.SubscriptionForm.value.instruction,
      price: this.itemTotal,
      tips: this.tips || 0,
      productDetails: this.products,
      zipcode: enteredZipcode,
      ort: this.userData.ort,
      declaration: this.SubscriptionForm.value.declaration,
      paymentType: this.SubscriptionForm.value.paymentType,
      deliveryDayOption: this.SubscriptionForm.value.delivery_day_option
    };

    const notification = {
      title: "New Subscription Order!",
      desc: `New Subscription Order By ${this.userData.username} from ${this.orderData.address}`,
      status: 'unread'
    };

    console.log(this.orderData)

    this.dataService.subscriptionCheck(this.orderData.user_id).subscribe(
      (response) => {
        if (response.status) {
          Swal.fire(
            'Bitte beachten Sie!',
            'Sie haben bereits eine Dauerbestellung angelegt.<br><br>' +
            'Falls Sie etwas ändern möchten:<br>' +
            'Gehen Sie zu <b>Mein Konto → Dauerbestellung</b> und klicken Sie auf das grüne Bearbeiten-Symbol, damit Sie Produkte hinzufügen oder löschen können.<br><br>' +
            'Danke!',
            'warning'
          );
        }

      },
      (error) => {
        // Place Subscription Order
        this.dataService.subscriptionOrder(this.orderData).subscribe(

          (response) => {
            // if (response.status) {
            //   Swal.fire('Erfolg!', "Abonnementbestellung erfolgreich aufgegeben!!!", 'success');

            //   this.clearSubscriptionCartAndNotify();



            // }
            if (response.status) {
              Swal.fire({
                title: 'Erfolg!',
                text: 'Ihre Dauerbestellung wurde erfolgreich aufgegeben.',
                icon: 'success',
                showConfirmButton: false,
              })
              this.clearSubscriptionCartAndNotify();

            }

          },
          (error) => {
            Swal.fire('Fehler!', 'Bestellung fehlgeschlagen!!!', 'error');
          }
        );
      }
    );
  }

  // Existing SEPA flow
  placeSepaSubscription() {
    // console.log("Placing SEPA subscription with order data:", this.orderData);
    // return

    this.dataService.subscriptionOrder(this.orderData).subscribe(
      (response) => {
        if (response.status) {
          Swal.fire({
            title: 'Erfolg!',
            text: 'Ihre Dauerbestellung wurde erfolgreich aufgegeben.',
            icon: 'success',
            showConfirmButton: false,
          });
          this.clearSubscriptionCartAndNotify();
        }
      },
      (error) => {
        Swal.fire('Fehler!', 'Bestellung fehlgeschlagen!!!', 'error');
      }
    );
  }

  // New PayPal flow
  startPaypalSubscription() {
    this.isLoading = true;

    if (!this.postcodes || this.postcodes.length === 0) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Liefergebiete konnten nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error');
      return;
    }

    const enteredZipcode = this.SubscriptionForm.value.zipcode;

    // Check if enteredZipcode exists in the postcodes list
    const isZipcodeAvailable = this.postcodes.some(
      (area: any) => area.zipcode.toString() === enteredZipcode.toString()
    );

    if (!isZipcodeAvailable) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Lieferung an diese Postleitzahl ist nicht verfügbar!', 'warning');
      return; // Stop execution
    }

    this.orderData = {
      user_id: localStorage.getItem('userId'),
      username: this.userData.username,
      email: this.userData.email,
      delivery_date: this.SubscriptionForm.value.delivery_date,
      address:
        (this.SubscriptionForm.value.address &&
          this.SubscriptionForm.value.zipcode &&
          this.userData.ort)
          ? `${this.SubscriptionForm.value.address},${this.SubscriptionForm.value.zipcode},${this.userData.ort}`
          : `${this.userData.address || ''},${this.userData.zipcode || ''},${this.userData.ort || ''}`,
      contact: this.userData.phone,
      deliveryFee: this.deliveryFee,
      instruction: this.SubscriptionForm.value.instruction,
      price: this.itemTotal,
      tips: this.tips || 0,
      productDetails: this.products,
      zipcode: enteredZipcode,
      ort: this.userData.ort,
      paymentType: this.SubscriptionForm.value.paymentType,
      deliveryDayOption: this.SubscriptionForm.value.delivery_day_option
    };

    this.dataService.subscriptionCheck(this.orderData.user_id).subscribe(
      (response) => {
        this.isLoading = false; // ✅ Stop loading when user already has subscription
        if (response.status) {
          Swal.fire(
            'Bitte beachten Sie!',
            'Sie haben bereits eine Dauerbestellung angelegt.<br><br>' +
            'Falls Sie etwas ändern möchten:<br>' +
            'Gehen Sie zu <b>Mein Konto → Dauerbestellung</b> und klicken Sie auf das grüne Bearbeiten-Symbol, damit Sie Produkte hinzufügen oder löschen können.<br><br>' +
            'Danke!',
            'warning'
          );
        }
      },
      (error) => {
        // ✅ Keep loading until PayPal request completes
        localStorage.setItem("subscriptionOrderData", JSON.stringify(this.orderData));

        const notification = {
          title: "New Subscription Order!",
          desc: `New Subscription Order By ${this.userData.username} from ${this.orderData.address}`,
          status: 'unread'
        };
        const payload = { userId: localStorage.getItem("userId") };

        this.dataService.createPaypalReference(payload).subscribe(
          (res: any) => {
            debugger
            if (res.redirectUrl && res.typeId) {
              localStorage.setItem("paypalTypeId", res.typeId);
              // localStorage.setItem("paypalPaymentId", res.paymentId);

              // 👉 Redirect full browser
              debugger
              window.location.href = res.redirectUrl;
            } else {
              Swal.fire('Fehler!', 'PayPal Initialisierung fehlgeschlagen!', 'error');
            }
          },
          (error) => {
            this.isLoading = false; // ✅ Stop here (failure)
            Swal.fire('Fehler!', 'PayPal Anfrage fehlgeschlagen!', 'error');
          }
        );
      }
    );
  }


  clearSubscriptionCartAndNotify() {
    if (!this.userId) return;

    this.dataService.deleteUserProductFromCart(this.userId).subscribe(
      (response) => {
        if (response.status) {
          console.log("Cart cleared successfully");

          const notification = {
            title: "New Subscription Order!",
            desc: `New Subscription Order By User ID: ${this.userId}`,
            status: 'unread'
          };

          // Notify admin
          this.dataService.notifyToAdmin(notification).subscribe(
            (response) => {
              if (response.status) {
                console.log("Admin notified");
              }
            },
            (error) => {
              console.log("Failed to notify admin", error);
            }
          );

          // ✅ Remove localStorage data
          localStorage.removeItem('subscriptionOrderId');
          localStorage.removeItem('subscriptionTotalAmount');

          // ✅ Use Angular Router and then reload
          this.router.navigateByUrl('/subscribe-order-dashboard').then(() => {
            setTimeout(() => {
              window.location.reload();
              this.cdr.detectChanges();
            }, 1500);
          });

        }
      },
      (error) => {
        console.log("Failed to clear cart");
      }
    );
  }




}
@Component({
  selector: 'app-inline-dialog',
  template: `
    <div class="dialog-container">
      <h2 class="dialog-title">SEPA-Mandate</h2>
      <p class="dialog-content">{{ data.declaration }}</p>
      
      <div class="dialog-actions">
        <button mat-button color="primary" (click)="closeDialog()">Schließen</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      border-radius: 12px;
      background-color: white;
      text-align: center;
    }

    .dialog-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .dialog-content {
      font-size: 16px;
      color: #333;
      margin-bottom: 20px;
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
    }

    button {
      border-radius: 8px;
      padding: 8px 16px;
    }
  `]
})
export class InlineDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<InlineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  closeDialog() {
    this.dialogRef.close();
  }
}