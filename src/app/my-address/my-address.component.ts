import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-my-address',
  templateUrl: './my-address.component.html',
  styleUrls: ['./my-address.component.css']
})
export class MyAddressComponent {
  addresses: any[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.dataService.getAddress().subscribe(
      (response: any) => {
        this.addresses = response.address; // Adjust according to API response structure
        console.log(this.addresses)
      },
      (error) => {
        console.error('Error fetching addresses:', error);
      }
    );
  }

  deleteAddress(id: number): void {
    Swal.fire({
      title: 'Bist du sicher?',
      text: 'Diese Adresse wird dauerhaft gelöscht!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ja, löschen!',
      cancelButtonText: 'Abbrechen'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.deleteAddress(id).subscribe(
          () => {
            this.addresses = this.addresses.filter(addr => addr.id !== id);
            
            // Show success alert after deletion
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Adresse erfolgreich gelöscht',
              showConfirmButton: false,
              timer: 1500
            });
          },
          (error) => {
            console.error('Error deleting address:', error);
            
            // Show error alert if deletion fails
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: 'Adresse konnte nicht gelöscht werden. Bitte versuche es erneut.',
            });
          }
        );
      }
    });}
}
