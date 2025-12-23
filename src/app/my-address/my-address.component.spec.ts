import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAddressComponent } from './my-address.component';

describe('MyAddressComponent', () => {
  let component: MyAddressComponent;
  let fixture: ComponentFixture<MyAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyAddressComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
