import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserpaymentsComponent } from './userpayments.component';

describe('UserpaymentsComponent', () => {
  let component: UserpaymentsComponent;
  let fixture: ComponentFixture<UserpaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserpaymentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserpaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
