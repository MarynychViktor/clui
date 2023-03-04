import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { Cmd } from "./command";

const CMD_INIT_ENDPOINT = 'initialize'

@Injectable()
export class CliService {
  private cliProcesses: Cmd[] = [];

  async initialize() {
    await invoke<{name: string, is_running: boolean}[]>(CMD_INIT_ENDPOINT).then((cmds) => {
      console.log('command res', cmds);
      this.cliProcesses = cmds.map(({name, is_running: isRunning}) => ({name, isRunning}))
      console.log('command res', this.cliProcesses);
    });
  }
}
