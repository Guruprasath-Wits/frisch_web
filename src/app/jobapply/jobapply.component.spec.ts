import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobapplyComponent } from './jobapply.component';

describe('JobapplyComponent', () => {
  let component: JobapplyComponent;
  let fixture: ComponentFixture<JobapplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobapplyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobapplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
