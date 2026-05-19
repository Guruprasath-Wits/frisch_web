import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent implements OnInit {

  constructor(private dataService: DataService, private titleService: Title, private metaService: Meta) { }

  faq: any[] = []

  ngOnInit(): void {
    this.titleService.setTitle('Häufig gestellte Fragen (FAQ) - Frisch für Sie');
    this.metaService.updateTag({ name: 'description', content: 'Finden Sie Antworten auf häufig gestellte Fragen zu unserem Lieferservice, unseren Produkten und dem Bestellvorgang bei Frisch für Sie.' });
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
