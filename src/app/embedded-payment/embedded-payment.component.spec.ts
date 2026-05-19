import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbeddedPaymentComponent } from './embedded-payment.component';

describe('EmbeddedPaymentComponent', () => {
  let component: EmbeddedPaymentComponent;
  let fixture: ComponentFixture<EmbeddedPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmbeddedPaymentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmbeddedPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
