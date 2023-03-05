use std::sync::atomic::Ordering;
use tauri::{command, Window};
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
