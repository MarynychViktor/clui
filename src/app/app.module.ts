import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { CliService } from "./cli.service";
import { invoke } from "@tauri-apps/api/tauri";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { NgTerminalModule } from "ng-terminal";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, MatSidenavModule, MatButtonModule, MatIconModule, NgTerminalModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (cliService: CliService) => {
        return async () => {
          const processes = (await invoke<any[]>('initialize')).map(
            ({id, name, executable, workdir, is_running: isRunning}) => ({id, name, executable, workdir, isRunning}));
          cliService.initialize(processes);
        };
      },
      deps: [CliService],
      multi: true,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
