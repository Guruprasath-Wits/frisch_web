import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(private dataService: DataService) {}

  fileurl: string = this.dataService.fileUrl;
  bannerImages: string[] = [];
  bannerImage: string = '';
  currentBannerIndex: number = 0;
  bannerInterval: any;
  imageLoaded: boolean = false;

  zipcode: string = '';
  settings: any = {};
  areas: any[] = [];
  filteredAreas: any[] = [];
  userBenefit: any[] = [];
  categories: any[] = [];

  ngOnInit() {
    this.loadCategoryData();
    this.loadSettingsData();
    this.loadDeliveryAreas();
    this.loadUserAdvantages();
  }

  ngOnDestroy() {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }

  loadCategoryData() {
    this.dataService.getCategoryData().subscribe(
      (response) => {
        if (response.status) {
          this.categories = response.category.filter(
            (item: any) => item.category_type !== 'free_trial'
          );
        }
      },
      (error) => console.log('Error fetching data in category:', error)
    );
  }

  loadSettingsData() {
    this.dataService.getSettingsData().subscribe(
      (response) => {
        if (response.status) {
          this.settings = response.setting[0];
          const bannerStr = this.settings.banner_img || '';
          this.bannerImages = bannerStr
            .split(',')
            .map((img: string) => this.fileurl + img.trim());

          if (this.bannerImages.length > 0) {
            this.preloadImages().then(() => {
              this.bannerImage = this.bannerImages[0];
              this.imageLoaded = true;
              this.startBannerRotation();
            });
          }
        }
      },
      (error) => console.log('Error fetching data in settings:', error)
    );
  }

  // ✅ preload all images (prevents gray flash)
  preloadImages(): Promise<void> {
    const promises = this.bannerImages.map(src => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    return Promise.all(promises).then(() => {});
  }

  startBannerRotation() {
    this.bannerInterval = setInterval(() => {
      this.currentBannerIndex =
        (this.currentBannerIndex + 1) % this.bannerImages.length;
      this.bannerImage = this.bannerImages[this.currentBannerIndex];
    }, 2000);
  }

  loadDeliveryAreas() {
    this.dataService.getDeliveryAreas().subscribe(
      (response) => {
        if (response.status) {
          this.areas = response.area;
        }
      },
      (error) => console.log('Error fetching delivery areas:', error)
    );
  }

  loadUserAdvantages() {
    this.dataService.getUserAdvantage().subscribe(
      (response) => {
        if (response.status) {
          this.userBenefit = response.userAdv;
        }
      },
      (error) => console.log('Error fetching user advantage:', error)
    );
  }

  checkZipCode(): void {
    if (this.zipcode) {
      this.filteredAreas = this.areas.filter(zip =>
        zip.zipcode.toString().includes(this.zipcode)
      );
    } else {
      this.filteredAreas = [];
    }
  }
}
