import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSubscribeComponent } from './edit-subscribe.component';

describe('EditSubscribeComponent', () => {
  let component: EditSubscribeComponent;
  let fixture: ComponentFixture<EditSubscribeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSubscribeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSubscribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
