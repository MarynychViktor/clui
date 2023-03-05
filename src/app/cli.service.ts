import { Injectable, NgZone } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { Cmd } from "./command";
import { BehaviorSubject, Subject } from "rxjs";

const CMD_INIT_ENDPOINT = 'initialize'

@Injectable({
  providedIn: 'root',
})
export class CliService {
  private cliProcesses: BehaviorSubject<Cmd[]> = new BehaviorSubject<Cmd[]>([]);
  private initialized = false;
  private projectOutput: Map<number, string[]> = new Map();
  readonly output: Map<number, Subject<string[]>> = new Map();

  get processes() {
    return this.cliProcesses;
  }

  initialize(processes: Cmd[]) {
    if (this.initialized) {
      throw new Error("Already initialized");
    }
    this.initialized = true;
    processes.forEach(({id}) => {
      this.projectOutput.set(id, []);
      this.output.set(id, new BehaviorSubject<string[]>([]));
    });
    this.cliProcesses.next(processes);
  }

  handleEvent({type, payload}: {type: string, payload: any}) {
    switch (type) {
      case 'Start':
        const projects = this.cliProcesses.value.map(({ id, isRunning, ...rest }) => {
          let started = id === payload ? true : isRunning;
          return {id, isRunning: started, ...rest};
        });
        console.log('project is started', projects)
        // @ts-ignore
        this.cliProcesses.next(projects);
        break;
      case 'Exit':
        const projects2 = this.cliProcesses.value.map(({ id, isRunning, ...rest }) => {
          let started = id === payload ? false : isRunning;
          return {id, isRunning: started, ...rest};
        });
        console.log('project is stopped', projects2)
        // @ts-ignore
        this.cliProcesses.next(projects2);
        break;
      case 'Data':
        // console.log('data event received')
        const [id, data] = payload;
        let output = this.projectOutput.get(id) as string[];
        output.push(data);
        if (output.length > 500) {
          output = output.slice(output.length - 500)
        }

        this.projectOutput.set(id, output);
        // @ts-ignore
        this.output.get(id).next(output);
        break;
    }
  }
}
