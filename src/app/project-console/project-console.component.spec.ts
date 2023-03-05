import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectConsoleComponent } from './project-console.component';

describe('ProjectConsoleComponent', () => {
  let component: ProjectConsoleComponent;
  let fixture: ComponentFixture<ProjectConsoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectConsoleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
