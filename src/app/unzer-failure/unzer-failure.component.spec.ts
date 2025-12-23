import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnzerFailureComponent } from './unzer-failure.component';

describe('UnzerFailureComponent', () => {
  let component: UnzerFailureComponent;
  let fixture: ComponentFixture<UnzerFailureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnzerFailureComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnzerFailureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
