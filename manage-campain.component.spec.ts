import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCampainComponent } from './manage-campain.component';

describe('ManageCampainComponent', () => {
  let component: ManageCampainComponent;
  let fixture: ComponentFixture<ManageCampainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCampainComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageCampainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
