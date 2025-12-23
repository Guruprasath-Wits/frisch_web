import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelledjobsComponent } from './cancelledjobs.component';

describe('CancelledjobsComponent', () => {
  let component: CancelledjobsComponent;
  let fixture: ComponentFixture<CancelledjobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CancelledjobsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CancelledjobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
