import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayWaterConsumptionComponent } from './display-water-consumption.component';

describe('DisplayWaterConsumptionComponent', () => {
  let component: DisplayWaterConsumptionComponent;
  let fixture: ComponentFixture<DisplayWaterConsumptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayWaterConsumptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DisplayWaterConsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
