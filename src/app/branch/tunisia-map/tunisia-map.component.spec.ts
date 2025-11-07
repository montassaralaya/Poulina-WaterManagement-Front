import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TunisiaMapComponent } from './tunisia-map.component';

describe('TunisiaMapComponent', () => {
  let component: TunisiaMapComponent;
  let fixture: ComponentFixture<TunisiaMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TunisiaMapComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TunisiaMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
