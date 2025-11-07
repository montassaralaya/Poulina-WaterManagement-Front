import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterCostChartComponent } from './water-cost-chart.component';

describe('WaterCostChartComponent', () => {
  let component: WaterCostChartComponent;
  let fixture: ComponentFixture<WaterCostChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterCostChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WaterCostChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
