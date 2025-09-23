import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWaterConsumptionComponent } from './create-water-consumption.component';

describe('CreateWaterConsumptionComponent', () => {
  let component: CreateWaterConsumptionComponent;
  let fixture: ComponentFixture<CreateWaterConsumptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWaterConsumptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateWaterConsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
