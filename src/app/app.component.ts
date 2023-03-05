import { AfterViewInit, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { CliService } from "./cli.service";
import { Cmd } from "./command";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { debounce, interval, Subject, tap, throttle } from "rxjs";
import { NgTerminal } from "ng-terminal";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import { WebglAddon } from 'xterm-addon-webgl';
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
})
export class AppComponent implements OnInit, AfterViewInit {
  // @ts-ignore
  @ViewChild('term', {static: false}) child: NgTerminal;
  term = new Terminal({cols: 125, rows: 50});
  fitAddon: FitAddon;

  constructor(readonly projectService: CliService, private zone: NgZone) {
    this.term = new Terminal();
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.fitAddon.activate(this.term);
  }

  spawn(process: Cmd) {
    console.log('spawning ', process.name);
    invoke<string>("spawn", { id: process.id }).then(res => {
      console.error('spawn result' ,res);
    })
  }

  stop(process: Cmd) {
    console.log('stopping ', process.name);
    invoke<string>("stop", { id: process.id }).then(res => {
      console.error('stop result' ,res);
    })
  }
  async ngOnInit() {
    const es = await this.eventSource();
    es.pipe(
      // tap(event => {console.log('next event', event)})
    )
      .subscribe((event) => {
        this.projectService.handleEvent(event);
      });
    // listen("events", event => {
    //   console.log("event listener ", event.payload);
    // }).then(res => {
    //   console.log('listen res');
    // }).catch(e => {
    //   console.log('listen e', e);
    // });
  }
  ngAfterViewInit(){
    // this.child.onData().subscribe((input) => {
    //   if (input === '\r') { // Carriage Return (When Enter is pressed)
    //     this.child.write(this.prompt);
    //   } else if (input === '\u007f') { // Delete (When Backspace is pressed)
    //     if (this.child.underlying.buffer.active.cursorX > 2) {
    //       this.child.write('\b \b');
    //     }
    //   } else if (input === '\u0003') { // End of Text (When Ctrl and C are pressed)
    //     this.child.write('^C');
    //     this.child.write(this.prompt);
    //   }else
    //     this.child.write(input);
    // });
    // @ts-ignore
    const addon = new WebglAddon();
    this.term.loadAddon(addon);
    this.term.open(document.getElementById('term') as HTMLElement);
    this.fitAddon.fit();
    this.term.onResize((evt) => {
      console.log('xterm on resize', evt)
      this.fitAddon.fit();
    });
    window.onresize = () => {
      this.fitAddon.fit();
    }

    const out = this.projectService.output.get(0);
    console.log('out is ', this.projectService.output);
    let i = 0 ;

    if (out) {
      let x = 0;
      out.
        pipe(
        debounce(() => interval(200)),
          throttle(
            () => interval(200)),
        )
        .subscribe((data: any) => {
        this.term.clear();
        // @ts-ignore
        // data.forEach((line) => {
        // });
            this.term.write(data.join("\r\n"));
        console.log('rerendered terminal', x)
      });
    }

  }

  async eventSource(): Promise<Subject<{type: string, payload: any}>> {
    const subject = new Subject<{type: string, payload: any}>();
    const unlisten = await listen("events", (event: any) => {
      this.zone.run(() => {
        const [type, payload] = Object.entries(event.payload)[0] as [k: string, payload: any[]];
        subject.next({
          type,
          payload
        });
      });
    });
    return subject;
  }
}
