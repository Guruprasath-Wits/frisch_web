import { Component, OnDestroy, OnInit ,HostListener} from '@angular/core';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  settings: any = {};
  userId: any
  cartData: any[] = []
  fileUrl=this.dataService.fileUrl;
  preventFetching: boolean = false;
  loginStatus: boolean = false
  isLogin = this.authService.isLoggedIn
  private authSubcription!: Subscription
    menuVisible = false;

    
    toggleMenu() {
      this.menuVisible = !this.menuVisible;
    }
  
    onMenuItemClick() {
      this.menuVisible = false;
    }
    

    closeOffcanvas() {
    const offcanvasEl = document.getElementById('mobileMenu');

    if (offcanvasEl) {
      const offcanvas =
        bootstrap.Offcanvas.getInstance(offcanvasEl) ||
        new bootstrap.Offcanvas(offcanvasEl);

      offcanvas.hide();
    }
  }
    
  
    // onMenuItemClick() {
    //   if (window.innerWidth <= 768) {
    //     this.menuVisible = false;
    //     document.body.style.overflow = 'auto'; 
    //   }
    // }

    // @HostListener('window:resize', ['$event'])
    // onResize(event: any) {
    //   if (event.target.innerWidth > 768) {
    //     this.menuVisible = false;
    //   }
    // }
    

  constructor(private dataService: DataService, private authService: AuthService, private router: Router) { }

  ngOnInit() {
    if (localStorage.getItem('userId')) {

      // this.dataService.cartLoad?.subscribe((res:any)=>{
      //   console.log(res)
      //   this.loadCartData()
      // })
      this.dataService.cartLoad1.subscribe((res: any) => {
      if (res) {
        this.loadCartData();
      }
    });

       
    this.dataService.cartCleared$.subscribe((shouldClear) => {
      console.log("📢 Cart clear event received:", shouldClear);
      if (shouldClear) {
        this.clearCartAfterPayment();
      }
    });
      this.loadCartData()
    }
    this.loadSettingsData()

    this.authSubcription = this.authService.isLoggedIn.subscribe((status) => {
      this.loginStatus = status;
    })
  }

  ngOnDestroy() {
    this.authSubcription.unsubscribe();
  }

  logOut() {
    this.cartData = [];
    this.authService.logout()
    this.router.navigate(['/auth'])
    console.log("logout---");
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

  loadCartData() {
    if (this.preventFetching) {
      console.log("Cart fetching is disabled after clearing.");
      return;
    }

    if (!this.authService.isLoggedIn) {
      console.warn("User is not logged in. Skipping cart fetch.");
      return;
    }

    this.userId = localStorage.getItem('userId');
    console.log("Fetching cart data for userId:", this.userId);

    if (!this.userId) {
      console.error("User ID is null or undefined!");
      return;
    }

    this.dataService.getCartData(this.userId).subscribe(
      (response) => {
        console.log("API Response:", response);

        if (response?.status && response.card?.length) {
          this.cartData = response.card;
          console.log("Updated cartData:", this.cartData);
          // this.fetchProductDetails();
        } else {
          console.warn("Cart is empty or response is invalid.");
          this.cartData = [];
        }
      },
      (error) => {
        console.error("Error fetching cart data:", error);
        this.cartData = [];
      }
    );
  }

  clearCartAfterPayment() {
    console.log("✅ Cart data cleared successfully!");
    this.cartData = [];
    this.preventFetching = true; // ✅ Prevent re-fetching
    console.log("🛑 preventFetching set to:", this.preventFetching);

    // Force UI update
    setTimeout(() => {
      console.log("📌 Cart should be empty now:", this.cartData);
    }, 1000);
  }

}
