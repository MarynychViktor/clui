import { Injectable } from "@angular/core";
import { Cmd } from "./command";
import { BehaviorSubject, filter, interval, map, merge, Observable, of, ReplaySubject, retry, Subject } from "rxjs";

const PROJECT_OUT_MAX_LEN = 2000;
const PROCESS_UPDATE_INTERVAL = 200;

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private initialized = false;
  private projects: BehaviorSubject<Cmd[]> = new BehaviorSubject<Cmd[]>([]);
  readonly projects$ = this.projects.asObservable();
  private outputSources: Map<number, string[]> = new Map();
  private projectsBuffer: Map<number, string[]> = new Map();
  private _activeProjectId?: number;

  initialize(processes: Cmd[]) {
    if (this.initialized) {
      throw new Error("Already initialized");
    }

    this.initialized = true;
    processes.forEach(({id}) => {
      this.outputSources.set(id, []);
      this.projectsBuffer.set(id, []);
    });

    if (processes.length > 0) {
      this._activeProjectId = processes[0].id;
    }

    this.projects.next(processes.sort((a, b) => a.id - b.id));
  }

  get activeProject() {
    return this._activeProjectId as number;
  }

  set activeProject(id: number) {
    this._activeProjectId = id;
  }

  projectSource(id: number): Observable<string[]> {
    return merge(
      interval(PROCESS_UPDATE_INTERVAL).pipe(
        filter(() => (this.projectsBuffer.get(id) as string[]).length > 0),
        map(() => {
          const buff = this.projectsBuffer.get(id) as string[];
          this.projectsBuffer.set(id, []);
          return buff;
        })
      ),
      of(this.outputSources.get(id) as string[])
    );
    // return (this.outputSources.get(id) as Subject<string[]>);
  }

  handleEvent({type, payload}: {type: string, payload: any}) {
    switch (type) {
      case 'Start':
        const projects = this.projects.value.map(({ id, isRunning, ...rest }) => {
          let started = id === payload ? true : isRunning;
          return {id, isRunning: started, ...rest};
        });
        // @ts-ignore
        this.projects.next(projects.sort((a, b) => a.id - b.id));
        break;
      case 'Exit':
        const projects2 = this.projects.value.map(({ id, isRunning, ...rest }) => {
          let started = id === payload ? false : isRunning;
          return {id, isRunning: started, ...rest};
        });
        // @ts-ignore
        this.projects.next(projects2.sort((a, b) => a.id - b.id));
        break;
      case 'Data':
        const [id, data] = payload;
        let output = this.outputSources.get(id) as string[];
        output.push(data);

        if (output.length > PROJECT_OUT_MAX_LEN) {
          output.splice(0, output.length - Math.floor(PROJECT_OUT_MAX_LEN / 2));
        }

        this.outputSources.set(id, output);

        if (this.activeProject == id) {
          const buff = this.projectsBuffer.get(id) as string[];
          buff.push(data);
          this.projectsBuffer.set(id, buff);
        }
        break;
    }
  }
}
