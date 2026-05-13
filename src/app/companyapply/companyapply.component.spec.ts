import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyapplyComponent } from './companyapply.component';

describe('CompanyapplyComponent', () => {
  let component: CompanyapplyComponent;
  let fixture: ComponentFixture<CompanyapplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyapplyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyapplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
