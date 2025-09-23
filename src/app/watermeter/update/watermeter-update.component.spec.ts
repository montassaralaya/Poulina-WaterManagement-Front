import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatermeterUpdateComponent } from './watermeter-update.component';

describe('WatermeterUpdateComponent', () => {
  let component: WatermeterUpdateComponent;
  let fixture: ComponentFixture<WatermeterUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatermeterUpdateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WatermeterUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
