import { Component,ViewChild, ElementRef } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @ViewChild('iframeContainer') iframe!: ElementRef;

  constructor(private dataService: DataService) { }
  settings: any = {};
  // areas: any[] = [];

  today: Date = new Date()
  year = this.today.getFullYear();

  ngOnInit() {
    this.loadSettingsData()
    // this.loadDeliveryAreas()
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

  updateIframe(newUrl: string) {
    if (newUrl) {
      this.iframe.nativeElement.src = newUrl; // Load new URL inside iframe
    }
  }
  

  // loadDeliveryAreas() {
  //   this.dataService.getDeliveryAreas().subscribe(
  //     (response) => {
  //       if (response.status) {
  //         this.areas = response.area;
  //         console.log(this.areas);
  //       }
  //     },
  //     (error) => {
  //       console.log('Error fetching data in delivery areas:', error);
  //     }
  //   )
  // }

}
