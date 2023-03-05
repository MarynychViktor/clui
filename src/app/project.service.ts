import { Injectable, NgZone } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { Cmd } from "./command";
import { BehaviorSubject, Observable, Subject } from "rxjs";

const CMD_INIT_ENDPOINT = 'initialize'

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private initialized = false;
  private projects: BehaviorSubject<Cmd[]> = new BehaviorSubject<Cmd[]>([]);
  readonly projects$ = this.projects.asObservable();
  private outputSources: Map<number, BehaviorSubject<string[]>> = new Map();

  initialize(processes: Cmd[]) {
    if (this.initialized) {
      throw new Error("Already initialized");
    }

    this.initialized = true;
    processes.forEach(({id}) => this.outputSources.set(id, new BehaviorSubject<string[]>([])));
    this.projects.next(processes);
  }

  projectSource(id: number): Observable<string[]> {
    return (this.outputSources.get(id) as Subject<string[]>);
  }

  handleEvent({type, payload}: {type: string, payload: any}) {
    switch (type) {
      case 'Start':
        const projects = this.projects.value.map(({ id, isRunning, ...rest }) => {
          let started = id === payload ? true : isRunning;
          return {id, isRunning: started, ...rest};
        });
        console.log('project is started', projects)
        // @ts-ignore
        this.projects.next(projects);
        break;
      case 'Exit':
        const projects2 = this.projects.value.map(({ id, isRunning, ...rest }) => {
          let started = id === payload ? false : isRunning;
          return {id, isRunning: started, ...rest};
        });
        console.log('project is stopped', projects2)
        // @ts-ignore
        this.projects.next(projects2);
        break;
      case 'Data':
        const [id, data] = payload;
        const outputSource = this.outputSources.get(id) as BehaviorSubject<string[]>;
        let output = outputSource.value;
        output.push(data);

        if (output.length > 500) {
          output = output.slice(output.length - 500)
        }

        console.log('next data pushed', output);
        outputSource.next(output);
        break;
    }
  }
}
