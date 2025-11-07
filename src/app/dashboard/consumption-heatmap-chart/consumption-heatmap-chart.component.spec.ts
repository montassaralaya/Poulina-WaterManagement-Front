import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumptionHeatmapChartComponent } from './consumption-heatmap-chart.component';

describe('ConsumptionHeatmapChartComponent', () => {
  let component: ConsumptionHeatmapChartComponent;
  let fixture: ComponentFixture<ConsumptionHeatmapChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsumptionHeatmapChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsumptionHeatmapChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
