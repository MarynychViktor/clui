import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { CliService } from "./cli.service";
import { invoke } from "@tauri-apps/api/tauri";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule],
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
