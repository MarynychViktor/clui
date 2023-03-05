import { Component, OnInit } from '@angular/core';
import { Cmd } from "../command";
import { invoke } from "@tauri-apps/api/tauri";
import { ProjectService } from "../project.service";
import { ActivatedRoute, NavigationEnd, Router, Routes } from "@angular/router";

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.sass']
})
export class ProjectsComponent implements OnInit {
  constructor(
    readonly projectService: ProjectService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        console.log('event', e.url)
      }
    });
    // this.activeRoute.params.subscribe(p => console.log('xxxx', p));
  }

  spawn(process: Cmd) {
    invoke<string>("spawn", { id: process.id });
  }

  stop(process: Cmd) {
    invoke<string>("stop", { id: process.id });
  }
}
