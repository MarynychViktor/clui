import { Component, NgZone } from "@angular/core";
import { listen } from "@tauri-apps/api/event";
import { ProjectService } from "./project.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
})
export class AppComponent {

  constructor(readonly projectService: ProjectService, private zone: NgZone) {
    listen("events", (event: any) => {
      this.zone.run(() => {
        const [type, payload] = Object.entries(event.payload)[0] as [k: string, payload: any[]];
        this.projectService.handleEvent({
          type,
          payload
        });
      });
    })
      .then()
      .catch((e) => console.error('Failed to subscribe to the event source'));
  }
}
