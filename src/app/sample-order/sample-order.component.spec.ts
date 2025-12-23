import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleOrderComponent } from './sample-order.component';

describe('SampleOrderComponent', () => {
  let component: SampleOrderComponent;
  let fixture: ComponentFixture<SampleOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
