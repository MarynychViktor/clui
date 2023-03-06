import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { ProjectService } from "./project.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
})
export class AppComponent implements OnInit, OnDestroy {
  private unsubscribe?: UnlistenFn;

  constructor(readonly projectService: ProjectService, private zone: NgZone) {
  }

  ngOnInit(): void {
    listen("events", (event: any) => {
      this.zone.run(() => {
        const [type, payload] = Object.entries(event.payload)[0] as [k: string, payload: any[]];
        this.projectService.handleEvent({
          type,
          payload
        });
      });
    })
      .catch((e) => console.error('Failed to subscribe to the event source'));
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
