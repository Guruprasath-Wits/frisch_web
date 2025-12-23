import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingjobsComponent } from './pendingjobs.component';

describe('PendingjobsComponent', () => {
  let component: PendingjobsComponent;
  let fixture: ComponentFixture<PendingjobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingjobsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingjobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
