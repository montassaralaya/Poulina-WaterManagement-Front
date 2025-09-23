import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateWaterConsumptionComponent } from './update-water-consumption.component';

describe('UpdateWaterConsumptionComponent', () => {
  let component: UpdateWaterConsumptionComponent;
  let fixture: ComponentFixture<UpdateWaterConsumptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateWaterConsumptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateWaterConsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
