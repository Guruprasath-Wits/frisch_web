
import { Component, OnInit, ElementRef, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';


declare var google: any;

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  currentLocationAddress: string = '';
  res: any;
  signupForm!: FormGroup;
  @ViewChild('addressInput', { static: false }) addressInputRef!: ElementRef;
  isLoading = false;
  loginForm!: FormGroup;
  otpForm!: FormGroup;

  isLogin: boolean = true;
  showOtpForm: boolean = false;
  resData: any;
  loginPasswordValid: boolean = true;
  SignPasswordValid: boolean = true;
  postcodes: any[] = [];
  showLoginPassword: boolean = false
  LoginPasswordField: string = 'password'

  showSignupPassword: boolean = false
  SignupPasswordField: string = 'password'
  settings: any = {};


  constructor(private route: ActivatedRoute, private http: HttpClient, private fb: FormBuilder, private ngZone: NgZone, private dataService: DataService, private router: Router, private authService: AuthService) {
    authService.checkLoginStatus();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: { [x: string]: any; }) => {
      const mode = params['mode'];
      if (mode === 'signup') {
        this.showSignup();  // ✅ show signup
      } else {
        this.showLogin();   // ✅ show login
      }

    });
    this.authService.checkLoginStatus()
    this.initializeForms();
    this.loadSettingsData()
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

  private initializeForms(): void {
    this.signupForm = this.fb.group({
      fname: [null, Validators.required],
      lname: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, ''],
      address: [null, Validators.required],
      street: [null, Validators.required],
      zipcode: [null, Validators.required],
      ort: [null, Validators.required],
      floor: [null], // Etage
      lift_availability: [null], // Aufzug vorhanden
      dob: [null, Validators.required], // Geburtsdatum
      role_id: [4],
      password: [null, Validators.required],
      confirmPassword: [null, Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
      acceptTerm: [false, Validators.requiredTrue],
    }, { validator: this.passwordMatchValidator });

    console.log(this.signupForm);

    this.loginForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, Validators.required]
    });

    this.otpForm = this.fb.group({
      otp: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

  }

  showLoginPass() {
    this.showLoginPassword = true
    this.LoginPasswordField = 'text'
  }

  hideLoginPass() {
    this.showLoginPassword = false
    this.LoginPasswordField = 'password'
  }

  showSignupPass() {
    this.showSignupPassword = true
    this.SignupPasswordField = 'text'
  }

  hideSignupPass() {
    this.showSignupPassword = false
    this.SignupPasswordField = 'password'
  }

  onSignupPasswordKeyup(): void {
    const password = this.signupForm.get('password')?.value;
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*()\-_\+=\{\}\[\]?\/\\|<>])[A-Za-z\d!@#$%&*()\-_\+=\{\}\[\]?\/\\|<>]{8,}$/;
    this.SignPasswordValid = passwordPattern.test(password);
  }

  onLoginPasswordKeyup(): void {
    const password = this.loginForm.get('password')?.value;
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*()\-_\+=\{\}\[\]?\/\\|<>])[A-Za-z\d!@#$%&*()\-_\+=\{\}\[\]?\/\\|<>]{8,}$/;
    this.loginPasswordValid = passwordPattern.test(password);
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { mismatch: true };
  }

  showLogin(): void {
    this.isLogin = true;
  }

  showSignup(): void {
    this.isLogin = false;
  }

  switchToSignup(event: Event): void {
    event.preventDefault();
    this.isLogin = false;
  }

  switchToLogin(event: Event): void {
    event.preventDefault();
    this.isLogin = true;
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
          this.signupForm.patchValue({
            address: formattedAddress,
            // lat: latitude,
            // lng: longitude
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

  onSignupSubmit(): void {
    this.isLoading = true;

    if (!this.postcodes || this.postcodes.length === 0) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Liefergebiete konnten nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error');
      return;
    }

    // Check zipcode availability
    const enteredZipcode = this.signupForm.value.zipcode;
    if (!enteredZipcode) {
      this.isLoading = false;
      this.signupForm.get('zipcode')?.markAsTouched();
      return;
    }
    
    this.signupForm.get('zipcode')?.setValue(enteredZipcode);

    const isZipcodeAvailable = this.postcodes.some((area: any) =>
      area.zipcode?.toString() === enteredZipcode.toString()
    );

    if (!isZipcodeAvailable) {
      this.isLoading = false;
      Swal.fire('Lieferung an diese Postleitzahl ist nicht verfügbar!');
      return;
    }

    // Validate form
    if (this.signupForm.invalid) {
      this.isLoading = false;
      this.signupForm.markAllAsTouched();
      return;
    }

    // ✅ Always enforce default role_id before sending
    this.signupForm.patchValue({ role_id: 4 });

    this.dataService.CreateUser(this.signupForm.value).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('Signup API Response:', res);

        if (res.status === true) {
          Swal.fire('Erfolg!', res.message, 'success');
          this.showOtpForm = true;
        } else {
          Swal.fire('Fehler!', res.message || 'Die Anmeldung ist fehlgeschlagen', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Signup API Error:', error);

        const backendMessage =
          error?.error?.message ||
          error?.message ||
          'Etwas ist schiefgelaufen.';

        Swal.fire('Fehler!', backendMessage, 'error');
      }
    });
  }

  onOtpSubmit(): void {
    this.isLoading = true;
    if (this.otpForm.valid) {
      this.dataService.VerifyOtp(this.otpForm.value).subscribe({
        next: (res: any) => {
          this.isLoading = false;

          if (res.status === true) {
            Swal.fire('Erfolg!', 'Bestätigungscode erfolgreich verifiziert!', 'success').then(() => {
              // ✅ Login with signupForm data
              const loginPayload = {
                email: this.signupForm.get('email')?.value,
                password: this.signupForm.get('password')?.value
              };

              this.dataService.LoginUser(loginPayload).subscribe({
                next: (loginRes: any) => {
                  if (loginRes?.status) {
                    // ✅ Save login data
                    localStorage.setItem('token', loginRes.token || '');
                    localStorage.setItem('userId', loginRes.user?.id || '');
                    localStorage.setItem('user', JSON.stringify(loginRes.user));

                    this.authService.login();
                    this.signupForm.reset();
                    this.otpForm.reset();

                    this.router.navigate(['/']).then(() => {
                      window.location.reload();
                    });
                  } else {
                    Swal.fire('Fehler!', loginRes.message || 'Fehler bei der Anmeldung', 'error');
                  }
                },
                error: () => {
                  Swal.fire('Fehler!', 'Beim Anmelden nach OTP ist ein Fehler aufgetreten.', 'error');
                }
              });
            });
          } else {
            Swal.fire('Fehler!', res.message || 'Die Bestätigungscode ist fehlgeschlagen', 'error');
          }
        },
        error: () => {
          this.isLoading = false;
          Swal.fire('Fehler!', 'Bei der Bestätigungscode ist ein Fehler aufgetreten', 'error');
        }
      });
    } else {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Bitte geben Sie ein gültiges 6-stelliges Bestätigungscode ein.', 'error');
    }
  }


  onLoginSubmit(): void {
    this.isLoading = true;
    localStorage.setItem('loginData', JSON.stringify(this.loginForm.value));

    if (!this.loginForm.valid) {
      this.isLoading = false;
      Swal.fire('Fehler!', 'Bitte geben Sie gültige Anmeldedaten ein.', 'error');
      return;
    }

    this.dataService.LoginUser(this.loginForm.value).subscribe({
      next: (res: any) => {
        console.log(res);
        this.isLoading = false;
        if (res?.status) {
          localStorage.setItem('token', res.token || '');
          localStorage.setItem('userId', res.user?.id || '');
          localStorage.setItem('user', res);

          Swal.fire('Erfolg!', 'Anmeldung erfolgreich!', 'success').then(() => {
            this.requestLocationPermission();
          });

          this.authService.login();
          this.router.navigate(['/']).then(() => {

            window.location.reload();
          });
        } else {
          Swal.fire('Fehler!', res.message || 'Fehler bei der Anmeldung', 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Fehler!', 'Beim Anmelden ist ein Fehler aufgetreten.', 'error');
      }
    });
  }

  //   onLoginSubmit(): void {
  //     this.isLoading = true;
  //      localStorage.setItem('loginData', JSON.stringify(this.loginForm.value));

  //     if (!this.loginForm.valid) {
  //       Swal.fire('Fehler!', 'Bitte geben Sie gültige Anmeldedaten ein.', 'error');
  //       return;
  //     }
  //     this.dataService.LoginUser(this.loginForm.value).subscribe(
  //   (resData: any) => {
  //     this.isLoading = false;
  //     this.resData = resData;

  //     if (this.resData?.status) {
  //       localStorage.setItem('authToken', resData.token || '');
  //       // localStorage.setItem('roleId', String(this.resData.user?.role_id || ''));
  //       // localStorage.setItem('currentUser', String(this.resData.user?.id || ''));

  //       Swal.fire('Erfolg!', 'Anmeldung erfolgreich!', 'success').then(() => {
  //         this.requestLocationPermission();
  //         this.authService.login();
  //         this.router.navigate(['/']).then(() => {
  //           window.location.reload();
  //         });
  //       });


  //     } else {
  //       Swal.fire('Fehler!', resData.message || 'Fehler bei der Anmeldung', 'error');

  //     }
  //   },
  //   (err: any) => {
  //     console.error(err);
  //     this.isLoading = false;
  //     Swal.fire('Login Failed', 'An error occurred during login. Please try again.', 'error');

  //   }
  // );


  //     // this.dataService.LoginUser(this.loginForm.value).subscribe({
  //     //   next: (res: any) => {
  //     //     console.log(res);
  //     //     this.isLoading = false;
  //     //     if (res?.status) {
  //     //       localStorage.setItem('token', res.token || '');
  //     //       localStorage.setItem('userId', res.user?.id || '');
  //     //       localStorage.setItem('user', res);

  //     //       Swal.fire('Erfolg!', 'Anmeldung erfolgreich!', 'success').then(() => {
  //     //         this.requestLocationPermission(); 
  //     //       });

  //     //       this.authService.login();
  //     //        this.router.navigate(['/']).then(() => {

  //     //       window.location.reload();
  //     //     });
  //     //     } else {
  //     //       Swal.fire('Fehler!', res.message || 'Fehler bei der Anmeldung', 'error');
  //     //     }
  //     //   },
  //     //   error: () => {
  //     //     this.isLoading = false;
  //     //     Swal.fire('Fehler!', 'Beim Anmelden ist ein Fehler aufgetreten.', 'error');
  //     //   }
  //     // });
  //   }

  requestLocationPermission(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Geolocation success:", position);

          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

          localStorage.setItem("latitude", latitude.toString());
          localStorage.setItem("longitude", longitude.toString());

          this.getAddressFromCoordinates(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);

          let errorMessage = "Fehler beim Abrufen des Standorts.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Standortzugriff wurde verweigert.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Standortinformationen sind nicht verfügbar.";
              break;
            case error.TIMEOUT:
              errorMessage = "Zeitüberschreitung beim Abrufen des Standorts.";
              break;
            default:
              errorMessage = "Ein unbekannter Fehler ist aufgetreten.";
              break;
          }

          Swal.fire({
            title: 'Fehler!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'ok'
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      Swal.fire({
        title: 'Fehler!',
        text: 'Ihr Gerät unterstützt keine Standortbestimmung.',
        icon: 'error',
        confirmButtonText: 'ok'
      });
    }
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


  getAddressFromCoordinates(lat: number, lng: number): void {
    const apiKey = 'AIzaSyC3W5rxhAe_8jiR9NjhbFSq6yU0b4N1WQI';
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'OK' && data.results.length > 0) {
          const address = data.results[0].formatted_address;
          console.log("Address:", address);
          this.currentLocationAddress = address;
          localStorage.setItem("currentAddress", address);
        } else {
          console.error("No address found for the given coordinates.");
        }
      })
      .catch(error => {
        console.error("Error fetching address:", error);
      });
  }



  forgetPassword(): void {
    // Open SweetAlert modal to get the email
    Swal.fire({
      title: 'Passwort vergessen',
      input: 'email',
      // inputLabel: 'Wir haben Ihnen einen Link geschickt, über den Sie Ihr Passwort eingeben können.',
      inputPlaceholder: 'Geben Sie Ihre E-Mail-Adresse ein',
      showCancelButton: true,
      cancelButtonText: 'Verwerfen',
      confirmButtonText: 'Senden',
      inputValidator: (value) => {
        if (!value) {
          return 'Bitte geben Sie Ihre E-Mail-Adresse ein!';
        }
        // Optional: You can also validate the email format
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailPattern.test(value)) {
          return 'Bitte geben Sie eine gültige E-Mail-Adresse ein!';
        }
        return null;  // No validation errors
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const email = result.value;  // Get email value

        // Now, call your service to send the email to the API
        this.sendEmailToApi(email);  // Replace with your actual service call
      }
    });
  }

  sendEmailToApi(email: any): void {

    console.log(email);

    // Call your service to handle API request for the password reset
    this.dataService.resetPassword(email).subscribe(
      response => {
        Swal.fire({
          title: 'Erfolg!',
          text: 'Ein Link zum Vergessen des Passworts wurde an Ihre E-Mail-Adresse gesendet.',
          icon: 'success',
        });
      },
      error => {
        Swal.fire({
          title: 'Fehler!',
          text: 'Der Link „Passwort vergessen“ konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
          icon: 'error',
        });
      }
    );
  }
}