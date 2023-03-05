import { Injectable, NgZone } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { Cmd } from "./command";

const CMD_INIT_ENDPOINT = 'initialize'

@Injectable({
  providedIn: 'root',
})
export class CliService {
  private cliProcesses: Cmd[] = [];
  private initialized = false;

  get processes() {
    return this.cliProcesses;
  }

  initialize(processes: Cmd[]) {
    if (this.initialized) {
      throw new Error("Already initialized");
    }
    this.initialized = true;
    this.cliProcesses = processes;
  }
}
