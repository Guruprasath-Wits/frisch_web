import { Component } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {

  constructor(private dataService: DataService) { }

  // items: number = 1
  faq: any[] = []

  ngOnInit(): void {
    this.dataService.getFaqData().subscribe(
      (response) => {
        if (response.status) {
          this.faq = response.faq;
          console.log(this.faq);
        }
      }
    )
  }

}
