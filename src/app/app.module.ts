import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { CliService } from "./cli.service";
import { invoke } from "@tauri-apps/api/tauri";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [
    CliService,
    {
      provide: APP_INITIALIZER,
      useFactory: (cliService: CliService) => {
        return cliService.initialize;
      },
      deps: [CliService],
      multi: true,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
