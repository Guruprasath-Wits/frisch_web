import { Component } from '@angular/core';
import { DataService } from '../data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-contactus',
  templateUrl: './contactus.component.html',
  styleUrls: ['./contactus.component.css']
})
export class ContactusComponent {

  constructor(private authService: AuthService, private dataService: DataService, private fb: FormBuilder, private router: Router, private titleService: Title, private metaService: Meta) { }
  isLoading = false; 
  contactForm!: FormGroup

  settings: any = {}
  contactData: any = {}
  isLogin = localStorage.getItem('isLoggedIn')

  ngOnInit() {
    this.titleService.setTitle('Kontaktieren Sie uns - Frisch für Sie');
    this.metaService.updateTag({ name: 'description', content: 'Haben Sie Fragen? Kontaktieren Sie das Team von Frisch für Sie. Wir helfen Ihnen gerne bei Ihrer Bestellung von frischen Lebensmitteln.' });
    this.loadSettingsData();
    this.initializeForm();
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

  private initializeForm() {
    this.contactForm = this.fb.group({
      gender: [null, Validators.required],
      firstname: [null, Validators.required],
      lastname: [null, Validators.required],
      email: [null, Validators.required],
      phone: [null, Validators.required],
      description: [null, Validators.required],
      declaration:[null,Validators.required]
    })
  }

  submitContact() {
    this.isLoading = true;
    this.contactData = {
      gender: this.contactForm.value.gender,
      firstname: this.contactForm.value.firstname,
      lastname: this.contactForm.value.lastname,
      email: this.contactForm.value.email,
      phone: this.contactForm.value.phone,
      description: this.contactForm.value.description,
      declaration:this.contactForm.value.declaration
    }

    console.log(this.contactData);

    this.dataService.submitContact(this.contactData).subscribe(
      (response) => {
        this.isLoading = false; 
        if (response.status) {
          Swal.fire("Erfolg!", "Kontakt erfolgreich übermittelt", "success");
          this.router.navigate(['/']);
        }
      },
      (error) => {
        this.isLoading = false; 
        console.log("contact form Failed!!!", error);
    
        // Check if error response has the "Data truncated" message
        if (error.error?.message?.includes("Data truncated")) {
          Swal.fire("Warnung!", "Daten für Spalte „Telefon“ in Zeile 1 abgeschnitten", "warning");
        } else {
          Swal.fire("Fehler!", "Etwas ist schief gelaufen. Bitte versuchen Sie es später erneut.", "error");
        }
      }
    );
    

  }

}
