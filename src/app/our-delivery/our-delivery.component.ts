import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-our-delivery',
  templateUrl: './our-delivery.component.html',
  styleUrls: ['./our-delivery.component.css']
})
export class OurDeliveryComponent implements OnInit {

  constructor(private dataService: DataService) { }

  postcodes: any[] = []

  ngOnInit() {
    this.loadDeliveryAreas();
  }

  loadDeliveryAreas() {
    this.dataService.getDeliveryAreasData().subscribe(
      (response) => {
        if (response.status) {
          this.postcodes = response.area;
          console.log(this.postcodes);
        }
      },
      (error)=>{
        console.log("Error fetching data in delivery areas: "+error);
      }
    )
  }


  // postcodes: number[] = [
  //   44141, 44143, 44149, 44225, 44227, 44229, 44263, 44265, 44267, 44269,
  //   44287, 44289, 44309, 44319, 44328, 44329, 44339, 44357, 44359, 44369,
  //   44379, 44388, 44894
  // ];
}
