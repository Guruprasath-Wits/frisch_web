import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualAddressComponent } from './manual-address.component';

describe('ManualAddressComponent', () => {
  let component: ManualAddressComponent;
  let fixture: ComponentFixture<ManualAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualAddressComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
