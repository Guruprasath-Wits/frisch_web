import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoboneComponent } from './jobone.component';

describe('JoboneComponent', () => {
  let component: JoboneComponent;
  let fixture: ComponentFixture<JoboneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JoboneComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoboneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
