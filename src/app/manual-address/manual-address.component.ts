import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../data.service'; 
import { Router } from '@angular/router'; 
import Swal from 'sweetalert2';
@Component({
  selector: 'app-manual-address',
  templateUrl: './manual-address.component.html',
  styleUrls: ['./manual-address.component.css']
})
export class ManualAddressComponent {
  addressForm!: FormGroup;
  addressType: string = '';

  constructor(private fb: FormBuilder, private dataService: DataService, private router: Router){
    this.addressForm = this.fb.group({
      houseNo: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      landmark: [null],
      addressType: ['', Validators.required]
    });
  }

  setAddressType(type: string) {
    this.addressType = type;
    this.addressForm.patchValue({ addressType: type });
  }

  onSubmit() {
    if (this.addressForm.valid) {
      const formData = this.addressForm.value; // Form now includes addressType

      this.dataService.createaddress(formData).subscribe({
        next: (response) => {
          console.log('API Response:', response);
          Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: "Adresse bestätigt",
                        showConfirmButton: false,
                        timer: 1500,
                      });
          // alert('Address Confirmed! ✅');
          this.router.navigate(['/my-address']); 
        },
        error: (error) => {
          console.error('API Error:', error);
          Swal.fire({
                      position: 'top-end',
                      icon: 'warning',
                      title: "Adresse konnte nicht übermittelt werden!!!",
                      showConfirmButton: false,
                      timer: 1500,
                    });
          // alert('Failed to submit address. ❌');
        }
      });
    }
  }
}
