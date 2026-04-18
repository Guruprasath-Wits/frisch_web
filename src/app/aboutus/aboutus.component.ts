import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.component.html',
  styleUrls: ['./aboutus.component.css']
})
export class AboutusComponent implements OnInit {
  constructor(private titleService: Title, private metaService: Meta) { }

  ngOnInit() {
    this.titleService.setTitle('Über uns - Frisch für Sie');
    this.metaService.updateTag({ name: 'description', content: 'Erfahren Sie mehr über Frisch für Sie, Ihren zuverlässigen Lieferservice für frische Backwaren und Lebensmittel.' });
  }
}
