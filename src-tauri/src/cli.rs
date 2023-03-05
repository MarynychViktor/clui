use std::collections::HashMap;
use std::os::unix::io::FromRawFd;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use serde::Deserialize;
use tokio::process::{Child, Command};
use tokio::sync::{mpsc};
use tokio::sync::mpsc::{Sender, UnboundedReceiver};
use tokio::io::AsyncBufReadExt;
use tokio::select;

#[derive(Debug, Deserialize)]
pub struct Descriptor {
  pub name: String,
  pub executable: String,
  pub workdir: String,
}

pub struct Project {
  pub name: String,
  pub executable: String,
  pub workdir: String,
  pub is_running: Arc<AtomicBool>,
  pub cancel_tx: Mutex<Option<Sender<()>>>
}

impl Project {
  pub fn new(name: String, executable: String, workdir: String) -> Self {
    Self {
      name,
      executable,
      workdir,
      is_running: Arc::new(AtomicBool::new(false)),
      cancel_tx: Mutex::new(None)
    }
  }
}

pub type ProjectId = i16;
pub type Projects = HashMap<ProjectId, Arc<Project>>;

const PROCESS_DELAY: u64 = 100;

impl Project {
  pub fn spawn(self: Arc<Self>) -> UnboundedReceiver<String> {
    let (can_tx, mut can_rx) = mpsc::channel::<()>(1);
    {
      *self.cancel_tx.lock().unwrap() = Some(can_tx);
    }

    let stderr_io = unsafe {
      Stdio::from_raw_fd(2)
    };

    let mut child = Command::new("/bin/bash")
      .kill_on_drop(true)
      .arg("-c")
      .arg(self.executable.as_str())
      .current_dir(self.workdir.as_str())
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .stdin(Stdio::null())
      .spawn().unwrap();

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let (tx, mut rx) = mpsc::unbounded_channel();
    let is_running = self.is_running.clone();

    tokio::spawn(async move {
      select! {
        _ = child.wait() => {
          println!("Canceling project due to exit")
        }
        _ = can_rx.recv() => {
          match child.try_wait() {
            Ok(Some(_)) => {},
            _ => {
              child.kill().await;
              child.wait().await;
            }
          }
          println!("Canceling project due to the request")
        }
      }

      is_running.store(false, Ordering::SeqCst);
      // child.wait().await
      //   .expect("child process encountered an error");

    });
    let is_running = self.is_running.clone();

    let stdout_tx = tx.clone();
    tokio::spawn(async move {
      is_running.store(true, Ordering::SeqCst);
      let mut lines = tokio::io::BufReader::new(stdout).lines();

      while let Some(line) = lines.next_line().await.unwrap() {
        stdout_tx.send(line).expect("Failed to send a message");
      }
    });

    let stderr_tx = tx.clone();
    tokio::spawn(async move {
      let mut lines = tokio::io::BufReader::new(stderr).lines();

      while let Some(line) = lines.next_line().await.unwrap() {
        stderr_tx.send(line).expect("Failed to send a message");
      }
    });

    rx
  }

  pub fn stop(&self) {
    match &*self.cancel_tx.lock().unwrap() {
      Some(x) => {
        x.send(());
      },
      None => {
        println!("Failed to stop project, sender is missing")
      }
    }
  }
}
