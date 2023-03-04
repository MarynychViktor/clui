use tauri::{command, Window};
use tokio::runtime::Handle;
use crate::cli::Projects;

#[derive(Clone, serde::Serialize)]
struct CmdDto {
  pub name: String,
  pub is_running: bool,
}

#[command]
pub fn initialize() -> Vec<CmdDto> {
  let mut res = vec![];
  res.push(CmdDto {
    name: "test cmd1".into(),
    is_running: false
  });
  res.push(CmdDto {
    name: "test cmd2".into(),
    is_running: true
  });
  println!("initialize called");
  res
}

#[command]
async fn spawn(name: String, projects: tauri::State<'_, Projects>, window: Window) -> String {
  let project = projects.get(&name).unwrap().clone();

  let mut data_rx = project.lock().unwrap().spawn();
  let handle = Handle::current();

  std::thread::spawn(move || {
    handle.spawn(async move {
      while let Some(data) = data_rx.recv().await {
        println!("Data received {}", data);
        window.emit("data-event", Payload { message: data }).unwrap();
      }
    });
  });

  "Spawned cmd".to_string()
}
