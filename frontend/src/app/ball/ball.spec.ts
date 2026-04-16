import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ball } from './ball';

describe('Ball', () => {
  let component: Ball;
  let fixture: ComponentFixture<Ball>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ball],
    }).compileComponents();

    fixture = TestBed.createComponent(Ball);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
