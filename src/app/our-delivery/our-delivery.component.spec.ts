import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurDeliveryComponent } from './our-delivery.component';

describe('OurDeliveryComponent', () => {
  let component: OurDeliveryComponent;
  let fixture: ComponentFixture<OurDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurDeliveryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
