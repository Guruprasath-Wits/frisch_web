import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-embedded-payment',
  templateUrl: './embedded-payment.component.html',
  styleUrls: ['./embedded-payment.component.css']
})
export class EmbeddedPaymentComponent implements OnInit {
  safePaymentUrl: SafeResourceUrl | null = null;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const url = params['url'] || null;
      this.safePaymentUrl = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
    });
  }
}