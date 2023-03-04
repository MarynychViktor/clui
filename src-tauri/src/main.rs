// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window};
use tokio::runtime::Handle;
use clui::cli::{Project, Descriptor, Projects};


#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

#[tokio::main]
async fn main() {
  let projects = Projects::new();
  tauri::Builder::default()
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
      main_window.open_devtools();
      Ok(())
    })
    .manage(projects)
    .invoke_handler(tauri::generate_handler![initialize, spawn])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
