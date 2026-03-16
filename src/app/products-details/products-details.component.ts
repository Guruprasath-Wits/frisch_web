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

    constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router, private authService: AuthService) { }

    fileUrl = this.dataService.fileUrl;
    CartData: any[] = [];
    allCategories: any[] = [];
    isAgeVerified: boolean = false;
    product: any = {};
    productId!: number;
    userData: any = {};

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.productId = +params['id'];
            this.fetchProductDetails(this.productId);
        });
        this.loadCategories();
        this.loadUserData();
    }

    loadCategories(): void {
        this.dataService.getCategoryData().subscribe(
            (response) => {
                if (response.status) {
                    this.allCategories = response.category;
                }
            }
        );
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

    loadUserData() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            this.dataService.getUserData(userId).subscribe(
                (response: any) => {
                    if (response.status && response.user) {
                        this.userData = response.user;
                    }
                },
                (error: any) => {
                    console.error('Error fetching user data:', error);
                }
            );
        }
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
        if (localStorage.getItem('isLoggedIn') === 'true') {
            const catIds = String(this.product.category_id).split(',').map(id => Number(id.trim()));
            const category = this.allCategories.find(c => c.id === catIds[0]);

            // Check for 18+ age verification via DATABASE (API) + Local Session
            const is18Plus = Number(this.product.is_18_plus) === 1;
            const isUserVerified = Number(this.userData?.is_age_verified) === 1 || sessionStorage.getItem('isAgeVerified') === 'true';

            console.log('--- 18+ PRODUCT CHECK ---');
            console.log('Product:', this.product.product_name, '| Verified:', isUserVerified);

            if (is18Plus && !isUserVerified) {
                this.showAgeVerification(productId);
                return;
            }

            this.executeAddToCart(productId);
        } else {
            Swal.fire('Fehler!', 'Bitte melden Sie sich an, um Artikel in den Warenkorb zu legen!!!', 'error');
            this.router.navigate(['/auth']);
        }
    }

    showAgeVerification(productId: number) {
        Swal.fire({
            title: 'Alkohol – 18+ Pflicht',
            customClass: {
                container: 'age-verification-modal'
            },
            html: `
                <div class="age-header-box">
                    <span class="age-header-text">Altersprüfung</span>
                </div>
                <p class="age-subtitle">Du hast ein alkoholhaltiges Produkt in deinen Warenkorb gelegt.<br>Die Abgabe erfolgt ausschließlich an Personen ab 18 Jahren.</p>
                
                <div class="age-section-title">Gesetzliche Grundlage</div>
                <div class="legal-box">
                    <p>Gemäß § 9 Abs. 1 Nr. 1 Jugendschutzgesetz (JuSchG) ist die Abgabe von Bier, Wein, Sekt und ähnlichen Getränken an Personen unter 16 Jahren verboten.</p>
                    <p>Gemäß § 9 Abs. 1 Nr. 2 JuSchG ist die Abgabe von Spirituosen, Alkopops und anderen Mischgetränken mit Spirituosen an Kinder und jugendliche jeglichen Alters vollständig untersagt.</p>
                    <p>Da unser Sortiment auch Produkte der letztgenannten Kategorie umfasst, gilt für alle alkoholhaltigen Artikel in unserem Shop eine einheitliche Altersgrenze von 18 Jahren.</p>
                </div>

                <div class="age-question">Bist du mindestens 18 Jahre alt?</div>

                <div class="age-checkbox-container">
                    <input type="checkbox" id="age-confirm-checkbox">
                    <label for="age-confirm-checkbox" class="age-checkbox-text">
                        Ich bestätige, dass ich mindestens 18 Jahre alt bin, und erkläre mich damit einverstanden, meinen Personalausweis, Reisepass oder Führerschein bei der Lieferung vorzuzeigen. Ich habe verstanden, dass die Bestellung ohne gültigen Altersnachweis nicht übergeben werden kann.
                    </label>
                </div>

                <div class="age-btn-group">
                    <button id="age-yes-btn" class="age-btn-yes" disabled>Ja, ich bin 18+</button>
                    <button id="age-no-btn" class="age-btn-no">Nein</button>
                </div>

                <div class="age-footer-hint">
                    <div class="hint-label">Hinweis zur Lieferung</div>
                    <p>Unser Lieferpersonal ist gesetzlich verpflichtet, das Alter der empfangenden Person bei der Übergabe anhand eines gültigen Lichtbildausweises (Personalausweis, Reisepass oder Führerschein) zu überprüfen. Ohne Altersnachweis kann die Bestellung nicht ausgehändigt werden.</p>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                const checkbox = document.getElementById('age-confirm-checkbox') as HTMLInputElement;
                const yesBtn = document.getElementById('age-yes-btn') as HTMLButtonElement;
                const noBtn = document.getElementById('age-no-btn') as HTMLButtonElement;

                const updateButton = () => {
                    if (checkbox && yesBtn) {
                        yesBtn.disabled = !checkbox.checked;
                        yesBtn.style.opacity = checkbox.checked ? '1' : '0.5';
                        yesBtn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
                    }
                };

                if (checkbox) {
                    checkbox.addEventListener('change', updateButton);
                    checkbox.addEventListener('click', updateButton);
                    checkbox.addEventListener('input', updateButton);
                }
                // Initial state update
                updateButton();

                yesBtn.addEventListener('click', () => {
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                        this.dataService.verifyAge(JSON.parse(userId)).subscribe(
                            (response) => {
                                if (response.status) {
                                    // Update both Database and Local Session for instant effect
                                    if (this.userData) this.userData.is_age_verified = 1;
                                    sessionStorage.setItem('isAgeVerified', 'true');

                                    Swal.fire({
                                        title: 'Zugang gewährt',
                                        customClass: {
                                            container: 'age-success-modal'
                                        },
                                        html: `
                                            <div class="age-success-icon">✓</div>
                                            <p class="age-success-text">Vielen Dank für deine Bestätigung. Deine Verifizierung wurde dauerhaft gespeichert.</p>
                                            <p class="small text-muted">Bitte halte deinen Ausweis bei der Lieferung bereit.</p>
                                        `,
                                        timer: 3000,
                                        timerProgressBar: true,
                                        showConfirmButton: false
                                    }).then(() => {
                                        this.executeAddToCart(productId);
                                    });
                                }
                            },
                            (error) => {
                                console.error('Error verifying age via API:', error);
                                Swal.fire('Fehler', 'Verifizierung konnte nicht gespeichert werden.', 'error');
                            }
                        );
                    }
                });

                noBtn.addEventListener('click', () => {
                    Swal.fire({
                        title: 'Zugriff verweigert',
                        text: 'Der Kauf von alkoholhaltigen Produkten ist nur für Personen ab 18 Jahren gestattet.',
                        icon: 'error',
                        confirmButtonColor: '#c9a24d'
                    });
                });
            }
        });
    }

    executeAddToCart(productId: number) {
        let userId: any = localStorage.getItem('userId');
        const cart_data: any = {
            user_id: JSON.parse(userId),
            product_id: productId,
        };

        this.dataService.addToCart(cart_data).subscribe(
            (response) => {
                if (response.status) {
                    this.dataService.cartLoad?.next("true");
                    this.dataService.cartLoad1.next(true);
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: "In den Warenkorb gelegt",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                }
            },
            (error) => {
                Swal.fire({
                    position: 'top-end',
                    icon: 'warning',
                    title: "Das Produkt ist bereits im Warenkorb vorhanden!!!",
                    showConfirmButton: false,
                    timer: 1500,
                });
            }
        );
    }
}
