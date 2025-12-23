import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionOrderComponent } from './subscription-order.component';

describe('SubscriptionOrderComponent', () => {
  let component: SubscriptionOrderComponent;
  let fixture: ComponentFixture<SubscriptionOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubscriptionOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
