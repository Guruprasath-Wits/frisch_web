import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VacationPauseComponent } from './vacation-pause.component';

describe('VacationPauseComponent', () => {
  let component: VacationPauseComponent;
  let fixture: ComponentFixture<VacationPauseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VacationPauseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VacationPauseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
