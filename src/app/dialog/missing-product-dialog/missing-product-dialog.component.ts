import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { DataService } from '../../data.service';

@Component({
  selector: 'app-missing-product-dialog',
  templateUrl: './missing-product-dialog.component.html',
  styleUrls: ['./missing-product-dialog.component.css']
})
export class MissingProductDialogComponent implements OnInit {

  missingProductText: string = '';
  userData: any = {};

  constructor(public dialogRef: MatDialogRef<MissingProductDialogComponent>, private dataService: DataService) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.dataService.getUserData(userId).subscribe(
        (response: any) => {
          if (response.status && response.user) {
            this.userData = response.user;
            console.log('Missing Product - Loaded User Data from API:', this.userData);
          } else {
            this.loadFromLocalStorage();
          }
        },
        (error) => {
          console.error('Error fetching user data from API:', error);
          this.loadFromLocalStorage();
        }
      );
    } else {
      this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    const user = localStorage.getItem('users');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        this.userData = Array.isArray(parsedUser) ? parsedUser[0] : parsedUser;
        console.log('Missing Product - Loaded User Data from LocalStorage (Fallback):', this.userData);
      } catch (e) {
        console.error('Error parsing user data from localStorage', e);
      }
    }
  }

  submit() {
    if (!this.missingProductText.trim()) {
      Swal.fire('Warnung', 'Bitte geben Sie ein Produkt ein.', 'warning');
      return;
    }

    const payload = {
      first_name: this.userData.fname || '',
      last_name: this.userData.lname || '',
      email: this.userData.email || '',
      mobile_number: this.userData.phone || '',
      message: this.missingProductText
    };

    console.log('UserData used for payload:', this.userData);
    console.log('Sending Payload:', payload);

    this.dataService.postMissingProduct(payload).subscribe(
      (response) => {
        console.log('Backend Response:', response);
        if (response.status) {
          Swal.fire({
            title: 'Vielen Dank!',
            text: 'Wir haben Ihre Anfrage erhalten.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.dialogRef.close();
          });
        } else {
          Swal.fire('Fehler', 'Etwas ist schief gelaufen. Bitte versuchen Sie es später erneut.', 'error');
        }
      },
      (error) => {
        console.error('Error submitting missing product:', error);
        Swal.fire({
          title: 'Fehler!',
          text: 'Die Anfrage konnte nicht gesendet werden. Bitte prüfen Sie die Konsole.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
  }
}
