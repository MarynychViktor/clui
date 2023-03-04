import { Component, OnInit } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  greetingMessage = "";

  greet(event: SubmitEvent, name: string): void {
    event.preventDefault();

    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    invoke<string>("greet", { name }).then((text) => {
      this.greetingMessage = text;
    });
  }

  spawn() {
    invoke<string>("spawn").then(res => {
      console.error('spawn result' ,res);
    })
  }

  ngOnInit(): void {
    console.log('started listener');
    listen("data-event", event => {
      console.log("event listener ", event);
    }).then(res => {
      console.log('listen res');
    }).catch(e => {
      console.log('listen e', e);
    });
  }
}
