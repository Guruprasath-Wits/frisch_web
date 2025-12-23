import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaypalSubscriptionSuccessComponent } from './paypal-subscription-success.component';

describe('PaypalSubscriptionSuccessComponent', () => {
  let component: PaypalSubscriptionSuccessComponent;
  let fixture: ComponentFixture<PaypalSubscriptionSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaypalSubscriptionSuccessComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaypalSubscriptionSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
