import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscribeOrderDashboardComponent } from './subscribe-order-dashboard.component';

describe('SubscribeOrderDashboardComponent', () => {
  let component: SubscribeOrderDashboardComponent;
  let fixture: ComponentFixture<SubscribeOrderDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubscribeOrderDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscribeOrderDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
