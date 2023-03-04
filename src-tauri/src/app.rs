use std::sync::{Arc, Mutex};
use crate::cli::Project;

pub struct App {
  pub projects: Vec<Arc<Mutex<Project>>>
}
