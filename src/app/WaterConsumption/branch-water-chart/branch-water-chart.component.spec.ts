import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchWaterChartComponent } from './branch-water-chart.component';

describe('BranchWaterChartComponent', () => {
  let component: BranchWaterChartComponent;
  let fixture: ComponentFixture<BranchWaterChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchWaterChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BranchWaterChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
