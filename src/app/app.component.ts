import { Component, OnInit } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { CliService } from "./cli.service";
import { Cmd } from "./command";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {

  constructor(readonly projectService: CliService) {
  }

  spawn(process: Cmd) {
    console.log('spawning ', process.name);
    invoke<string>("spawn", { id: process.id }).then(res => {
      console.error('spawn result' ,res);
    })
  }

  ngOnInit(): void {
    listen("events", event => {
      console.log("event listener ", event);
    }).then(res => {
      console.log('listen res');
    }).catch(e => {
      console.log('listen e', e);
    });
  }
}
