// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use std::sync::atomic::Ordering;
use tauri::{Manager};
use clui::cli::{Descriptor, Projects, ProjectId, Project};

#[tokio::main]
async fn main() {
  let data = std::fs::read_to_string("/home/vmaryn/projects/tauri/clui/config.json").unwrap();
  let descriptors: Vec<Descriptor> = serde_json::from_str(data.as_str()).unwrap();
  let mut projects = Projects::new();

  descriptors.iter().enumerate().for_each(|(idx, desc)| {
    projects.insert(idx as ProjectId, Arc::new(Project::new(
      desc.name.clone(),
      desc.executable.clone(),
      desc.workdir.clone(),
    )));
  });

  let app = tauri::Builder::default()
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        let main_window = app.get_window("main").unwrap();
        main_window.open_devtools();
      }
      Ok(())
    })
    .manage(projects)
    .invoke_handler(tauri::generate_handler![
      clui::commands::initialize,
      clui::commands::spawn,
      clui::commands::stop
    ])
    .build(tauri::generate_context!())
    .expect("error while building tauri application");

  app.run(|app_handle, e| {
    match  e {
      tauri::RunEvent::ExitRequested  { api, ..} => {
        let state = app_handle.state::<Projects>();
        println!("***Stopping running projects");
        for (_, project) in state.iter() {
          if project.is_running.load(Ordering::Relaxed) {
            project.stop();
          }
        }
        ()
      },
      _ => ()
    }

    });
}
