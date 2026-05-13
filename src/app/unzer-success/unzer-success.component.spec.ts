import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnzerSuccessComponent } from './unzer-success.component';

describe('UnzerSuccessComponent', () => {
  let component: UnzerSuccessComponent;
  let fixture: ComponentFixture<UnzerSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnzerSuccessComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnzerSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});