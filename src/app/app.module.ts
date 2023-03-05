import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { ProjectService } from "./project.service";
import { invoke } from "@tauri-apps/api/tauri";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { NgTerminalModule } from "ng-terminal";
import { ProjectsComponent } from './projects/projects.component';
import { ProjectConsoleComponent } from './project-console/project-console.component';
import { RouterModule } from "@angular/router";
import { MatListModule } from "@angular/material/list";
import { MatRippleModule } from "@angular/material/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatBadgeModule } from "@angular/material/badge";

@NgModule({
  declarations: [AppComponent, ProjectsComponent, ProjectConsoleComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    NgTerminalModule,
    RouterModule.forRoot([
      {
        path: '',
        component: ProjectsComponent,
        children: [
          {
            path: ':id',
            component: ProjectConsoleComponent
          }
        ]
      }
    ]),
    MatListModule,
    MatRippleModule,
    MatProgressBarModule,
    MatBadgeModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (cliService: ProjectService) => {
        return async () => {
          const processes = (await invoke<any[]>('initialize')).map(
            ({id, name, executable, workdir, is_running: isRunning}) => ({id, name, executable, workdir, isRunning}));
          cliService.initialize(processes);
        };
      },
      deps: [ProjectService],
      multi: true,
    }
  ],
  bootstrap: [AppComponent],
  exports: [RouterModule]
})
export class AppModule {
}
