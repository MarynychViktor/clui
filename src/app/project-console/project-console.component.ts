import { AfterViewInit, Component } from '@angular/core';
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { ProjectService } from "../project.service";
import { WebglAddon } from "xterm-addon-webgl";
import { debounce, interval, map, merge, Subject, Subscription, switchMap, tap, throttle } from "rxjs";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-project-console',
  templateUrl: './project-console.component.html',
  styleUrls: ['./project-console.component.sass']
})
export class ProjectConsoleComponent implements AfterViewInit {
  term = new Terminal();
  fitAddon?: FitAddon;
  webglAddon?: WebglAddon;
  private resize = new Subject();
  private resizeSub?: Subscription;

  constructor(
    readonly projectService: ProjectService,
    private route: ActivatedRoute
  ) {
    this.term = new Terminal();
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.fitAddon.activate(this.term);
    this.webglAddon = new WebglAddon();
    this.term.loadAddon(this.webglAddon);
    this.webglAddon.activate(this.term);
  }

  ngAfterViewInit(){
    this.term.open(document.getElementById('term') as HTMLElement);
    window.onresize = () => { this.resize.next(null) };
    this.term.onResize((evt) => this.fitAddon?.fit());

    this.route.params.pipe(
      map((params) => parseInt(params['id'])),
      tap((id) => this.projectService.activeProject = id),
      switchMap((id) => this.projectService.projectSource(id)),
      // todo: config
      debounce(() => interval(200)),
      throttle(() => interval(200)),
    )
      .subscribe((data: string[]) => {
        console.log('ngAfterViewInit subscribe', data);
          this.term.clear();
          data.forEach((line) => {
            this.term.writeln(line);
          });
        });

    // todo: values to config
    this.resizeSub = merge(this.resize, interval(1000))
      .pipe(
        debounce(() => interval(200)),
        throttle(() => interval(200)),
      )
      .subscribe(() => {
        if (this.term && this.fitAddon) {
          this.fitAddon.fit();
        }
      });
  }
}
