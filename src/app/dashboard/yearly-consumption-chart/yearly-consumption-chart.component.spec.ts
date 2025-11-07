import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YearlyConsumptionChartComponent } from './yearly-consumption-chart.component';

describe('YearlyConsumptionChartComponent', () => {
  let component: YearlyConsumptionChartComponent;
  let fixture: ComponentFixture<YearlyConsumptionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YearlyConsumptionChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(YearlyConsumptionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
