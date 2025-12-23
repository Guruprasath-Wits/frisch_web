import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ActivatedRoute, Route } from '@angular/router';
import { DataService } from '../data.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-products-details',
    templateUrl: './products-details.component.html',
    styleUrls: ['./products-details.component.css']
})
export class ProductsDetailsComponent implements OnInit {

    constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router, private authService:AuthService) { }

    fileUrl = this.dataService.fileUrl;
    product: any = {};
    productId!: number;
    CartData: any[] = []

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.productId = +params['id'];
            this.fetchProductDetails(this.productId);
        });
    }

    fetchProductDetails(productId: number): void {
        this.dataService.getProductById(this.productId).subscribe(
            (response) => {
                if (response.status) {
                    this.product = response.product;
                    console.log(this.product);
                    
                }
            },
            (error) => {
                console.log('Error fetching data in Product by Id: ', error);
            }
        )
    }

    openDatePicker() {
        Swal.fire({
            title: 'Wählen Sie einen Liefertermin',
            html: `
                <div>
                    <label for="date-input">Wählen Sie ein Datum:</label>
                    <input type="date" id="date-input" class="form-control" min="${this.getTodayDate()}" />
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirm Order',
            preConfirm: () => {
                const dateInput: HTMLInputElement | null = document.getElementById('date-input') as HTMLInputElement;
                if (dateInput) {
                    const selectedDate = new Date(dateInput.value);
                    const dayOfWeek = selectedDate.getUTCDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                        Swal.showValidationMessage('Die Lieferung erfolgt nur am Wochenende (Samstag und Sonntag). Bitte wählen Sie einen Wochenendtermin aus.');
                        return false;
                    }
                    return dateInput.value;
                }
                return null;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const selectedDate = result.value;
                if (selectedDate) {
                    Swal.fire(`Bestellung bestätigt für ${selectedDate}!`);
                }
            }
        });
    }

    getTodayDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    moveToCart(productId: number) {
        if (this.authService.isLoggedIn) {
            // this.CartData.push(productId);
            // this.CartData.push(localStorage.getItem('userId'));
            let userId: any = localStorage.getItem('userId')
            const cart_data: any = {
                user_id: JSON.parse(userId),
                product_id: productId,
            }
            console.log(this.CartData);
            this.dataService.addToCart(cart_data).subscribe(
                (response) => {
                    if (response.status) {
                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            title: "In den Warenkorb legen Erfolg",
                            showConfirmButton: false,
                            timer: 1500,
                        });
                        window.location.reload();
                    } else {
                        Swal.fire('Fehler!', response.message || 'Das Hinzufügen zum Warenkorb ist fehlgeschlagen.', 'error');
                    }
                },
                (error) => {
                    console.error('Error adding to cart:', error);
                    Swal.fire({
                        position: 'top-end',
                        icon: 'warning',
                        title: "Das Produkt ist bereits im Warenkorb vorhanden!!!",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    // window.location.reload();
                    // Swal.fire('Error!', 'An error occurred. Please try again.', 'error');
                }
            );
        } else {
            Swal.fire('Fehler!', 'Bitte melden Sie sich an, um Artikel in den Warenkorb zu legen!!!', 'error');
            this.router.navigate(['/auth'])
        }
    }
}
