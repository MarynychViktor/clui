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
export class ProjectsComponent {
  constructor(
    readonly projectService: ProjectService
  ) {
  }

  spawn(process: Cmd) {
    invoke<string>("spawn", { id: process.id });
  }

  stop(process: Cmd) {
    invoke<string>("stop", { id: process.id });
  }
}
