import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StripeSubscriptionSuccessComponent } from './stripe-subscription-success.component';

describe('StripeSubscriptionSuccessComponent', () => {
  let component: StripeSubscriptionSuccessComponent;
  let fixture: ComponentFixture<StripeSubscriptionSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StripeSubscriptionSuccessComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StripeSubscriptionSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
