import { Component, OnInit } from '@angular/core';
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { ProjectService } from "../project.service";
import {
  debounce, delay,
  interval,
  map,
  merge,
  Subject,
  Subscription,
  switchMap,
  tap,
  throttle,
} from "rxjs";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-project-console',
  templateUrl: './project-console.component.html',
  styleUrls: ['./project-console.component.sass']
})
export class ProjectConsoleComponent implements OnInit {
  // @ts-ignore
  term: Terminal;
  fitAddon?: FitAddon;
  private resize = new Subject();
  private resizeSub?: Subscription;
  private subscription?: Subscription;

  constructor(
    readonly projectService: ProjectService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.subscription = this.route.params.pipe(
      map((params) => parseInt(params['id'])),
      tap((id) => {
        this.term?.clear();
        this.term?.dispose();
        setTimeout(() => this.projectService.activeProject = id)
      }),
      delay(50),
      tap(() => {
        this.setUpTerm();
        this.fitAddon?.fit();

        window.onresize = () => { this.resize.next(null); };
        this.term.onResize((evt) => this.fitAddon?.fit());
      }),
      tap(() => {
        this.term.clear();
        this.term.reset();
      }),
      switchMap((id) => this.projectService.projectSource(id)),
    )
      .subscribe((buff: string[]) => {
        const {baseY, viewportY} = this.term.buffer.active;
        const shouldScroll = baseY ===  viewportY;

        if (buff.length) {
          this.term.write(`${buff.join("\r\n")}\r\n`);
        }

        if (shouldScroll) {
          this.term.scrollToBottom();
        }
      });

    this.resizeSub = merge(this.resize, interval(500))
      .pipe(
        debounce(() => interval(150)),
        throttle(() => interval(150)),
      )
      .subscribe(() => {
        if (this.term && this.fitAddon) {
          this.fitAddon.fit();
        }
      });
  }

  private setUpTerm() {
    this.term = new Terminal({
      allowTransparency: false,
      fontFamily: 'Roboto Mono',
      fontSize: 15,
      scrollback: 2000,
      disableStdin: true,
      convertEol: false,
    });
    this.term.attachCustomKeyEventHandler(function () {return false})
    this.term.open(document.getElementById('term') as HTMLElement);
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);

  }
}
