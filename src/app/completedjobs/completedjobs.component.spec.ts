import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletedjobsComponent } from './completedjobs.component';

describe('CompletedjobsComponent', () => {
  let component: CompletedjobsComponent;
  let fixture: ComponentFixture<CompletedjobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompletedjobsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletedjobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
