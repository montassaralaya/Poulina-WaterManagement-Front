import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatermeterListComponent } from './watermeter-list.component';

describe('WatermeterListComponent', () => {
  let component: WatermeterListComponent;
  let fixture: ComponentFixture<WatermeterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatermeterListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WatermeterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
