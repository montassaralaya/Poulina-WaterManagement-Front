import { TestBed } from '@angular/core/testing';

import { WaterConsumptionService } from './water-consumption.service';

describe('WaterConsumptionService', () => {
  let service: WaterConsumptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaterConsumptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
