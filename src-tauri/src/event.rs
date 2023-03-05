use crate::cli::ProjectId;

#[derive(Clone, serde::Serialize)]
pub enum ApplicationEvent {
  Start(ProjectId),
  Data(ProjectId, String),
  Exit(ProjectId),
}
