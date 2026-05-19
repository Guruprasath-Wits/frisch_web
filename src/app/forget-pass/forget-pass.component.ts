import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router'; // Import for accessing route parameters
import { DataService } from '../data.service';
import Swal from 'sweetalert2';

import { Router } from '@angular/router';

@Component({
  selector: 'app-forget-pass',
  templateUrl: './forget-pass.component.html',
  styleUrls: ['./forget-pass.component.css']
})
export class ForgetPassComponent implements OnInit {
  forgetPassForm: FormGroup;
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private dataService: DataService,
    private router : Router
  ) {
    this.forgetPassForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]], 
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        ]
      ],
      confirmPassword: ['']
    },
    {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Get the email parameter from the URL
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || '';
      this.forgetPassForm.patchValue({ email: this.email });
    });
  }

  // Custom validator to check if newPassword and confirmPassword match
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.forgetPassForm.valid) {
      const formData = this.forgetPassForm.value;
      const requestData = {
        email: this.email,
        newPassword: formData.newPassword
      };

      this.dataService.updatePassword(requestData).subscribe(
        (response) => {
          console.log('Password reset successful:', response);
          // alert('Password reset successfully!');
          Swal.fire({
            title: 'Erfolg!',
            text: 'Passwort erfolgreich aktualisiert.',
            icon: 'success',
          });

          this.router.navigate(['/auth']);

          
        },
        (error) => {
          console.error('Error resetting password:', error);
          // alert('Failed to reset password. Please try again.');
          Swal.fire({
            title: 'Fehler!',
            text: 'Das Paasword konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
            icon: 'error',
          });
        }
      );
    }
  }
}
