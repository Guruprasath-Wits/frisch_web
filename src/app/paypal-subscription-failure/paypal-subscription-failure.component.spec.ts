import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaypalSubscriptionFailureComponent } from './paypal-subscription-failure.component';

describe('PaypalSubscriptionFailureComponent', () => {
  let component: PaypalSubscriptionFailureComponent;
  let fixture: ComponentFixture<PaypalSubscriptionFailureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaypalSubscriptionFailureComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaypalSubscriptionFailureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
