use std::sync::atomic::Ordering;
use tauri::{Window};
use tokio::runtime::Handle;
use crate::cli::{ProjectId, Projects};
use crate::event::ApplicationEvent;

#[derive(Clone, serde::Serialize)]
pub struct ProjectDto {
  pub id: ProjectId,
  pub name: String,
  pub executable: String,
  pub workdir: String,
  pub is_running: bool,
}

#[tauri::command]
pub fn initialize(projects: tauri::State<'_, Projects>) -> Vec<ProjectDto> {
  projects.iter().map(|(a, b)| {
    ProjectDto {
      id: a.clone(),
      name: b.name.clone(),
      executable: b.executable.clone(),
      workdir: b.workdir.clone(),
      is_running: b.is_running.load(Ordering::Relaxed),
    }
  })
    .collect()
}

#[tauri::command]
pub async fn spawn(id: ProjectId, projects: tauri::State<'_, Projects>, window: Window) -> Result<(), ()> {
  let project = projects.get(&id).unwrap().clone();

  let handle = Handle::current();
  let mut receiver = project.spawn();

  std::thread::spawn(move || {
    handle.spawn(async move {
      window.emit("events", ApplicationEvent::Start(id)).unwrap();

      while let Some(data) = receiver.recv().await {
        // println!("Data received {}", data);
        window.emit("events", ApplicationEvent::Data(id, data)).unwrap();
      }

      window.emit("events", ApplicationEvent::Exit(id)).unwrap();
    });
  });

  Ok(())
}

#[tauri::command]
pub fn stop(id: ProjectId, projects: tauri::State<'_, Projects>) {
  let project = projects.get(&id).unwrap().clone();
  println!("Stop cmd called {:?}", project.name);
  project.stop();

}
