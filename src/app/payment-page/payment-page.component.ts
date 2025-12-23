import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StripeCardComponent, StripeService } from 'ngx-stripe';
import { StripeCardElementOptions, StripeElementsOptions } from '@stripe/stripe-js';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.css']
})
export class PaymentPageComponent implements OnInit {
  paymentForm!: FormGroup;
  stripeCardValid: boolean = false;

  @ViewChild(StripeCardComponent) card!: StripeCardComponent;

  // Stripe Card Options
  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#666EE8',
        color: '#31325F',
        fontWeight: '300',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': {
          color: '#CFD7E0'
        }
      }
    }
  };

  // Stripe Elements Options
  elementsOptions: StripeElementsOptions = {
    locale: 'en'
  };

  constructor(private fb: FormBuilder, private stripeService: StripeService) {}

  ngOnInit() {
    this.paymentForm = this.fb.group({
      name: ['', [Validators.required]]
    });
  }

  // Handle card changes
  onChange(event: any) {
    this.stripeCardValid = event.complete;
  }

  // Buy method
  buy() {
    if (!this.validForm) return;

    const name = this.paymentForm.value.name;
    this.stripeService
      .createToken(this.card.element, { name })
      .subscribe((result: any) => {
        if (result.token) {
          console.log('Token created:', result.token.id);
        } else if (result.error) {
          console.error('Error:', result.error.message);
        }
      });
  }

  // Getter for form validity
  get validForm() {
    return this.paymentForm.valid && this.stripeCardValid;
  }
}
