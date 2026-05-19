import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { FormBuilder, FormGroup,Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-userprofile',
  templateUrl: './userprofile.component.html',
  styleUrls: ['./userprofile.component.css']
})
export class UserprofileComponent implements OnInit {

  constructor(private fb: FormBuilder, private dataService: DataService, private router:Router) { }

  profileForm!: FormGroup

  userId: any
  userData: any = {}

  updatedUserData: any = {}
  passwordIsValid: boolean = true
  passwordMatch: boolean = true

  ngOnInit(): void {
    this.loadUserData();

    this.initializeForms();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      fname: [],
      lname: [],
      email: [],
      phone: [],
      // '', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{22}$/)]
     ban_no: [],
      dob: [],
      address: [],
      zipcode: [],
      old_password: [],
      new_password: ['',[Validators.required]],
      confirm_password: []
    })
  }

    get ban_no() {
    return this.profileForm.get('ban_no');
  }

  passwordKeyup(): void {
    const password = this.profileForm.get('new_password')?.value;
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    this.passwordIsValid = passwordPattern.test(password);
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('new_password')?.value;
    const confirmPassword = form.get('confirm_password')?.value;
    if (password != confirmPassword) {
      this.passwordMatch = false;
    } else {
      this.passwordMatch = true;
    }
  }
password : any
loginData : any
  loadUserData() {
    this.userId = localStorage.getItem('userId');
     this.loginData = localStorage.getItem('loginData');
this.password = JSON.parse(this.loginData)?.password
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

  updateProfile() {
    if(!this.passwordMatch){
      //  Swal.fire('erroe', 'Enter same password', 'warning')
      return 
    }
    if(this.password != this.profileForm.value.new_password){
      Swal.fire('Fehler', 'Ungültiges Passwort', 'warning')
      return
    }
    this.userId = localStorage.getItem('userId');

    console.log(this.userId);

    this.updatedUserData = {
      fname: this.profileForm.value.fname || this.userData.fname,
      lname: this.profileForm.value.lname || this.userData.lname,
      email: this.profileForm.value.email || this.userData.email,
      phone: this.profileForm.value.phone || this.userData.phone,
      dob: this.profileForm.value.dob || this.userData.dob,
      address: this.profileForm.value.address || this.userData.address,
      zipcode: this.profileForm.value.zipcode || this.userData.zipcode,
      password: this.profileForm.value.new_password || this.userData.password,
      IBAN: this.profileForm.value.ban_no ||this.userData.ban_no,
      ban_no: this.profileForm.value.ban_no ||this.userData.ban_no
    }

    console.log(this.updatedUserData);


    this.dataService.updateUserData(this.userId, this.updatedUserData).subscribe(
      (response) => {
        if (response.status) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Profil aktualisiert",
            showConfirmButton: false,
            timer: 1500
          });

          this.router.navigate(['/userprofile'])
        }
      },
      (error) => {
        console.log("Failed to Update !!!", error);

      }
    )
  }


}
