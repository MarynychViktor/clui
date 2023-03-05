use std::collections::HashMap;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use serde::Deserialize;
use tokio::process::{Command};
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

impl Project {
  pub fn spawn(self: Arc<Self>) -> UnboundedReceiver<String> {
    let (can_tx, mut can_rx) = mpsc::channel::<()>(12);
    {
      *self.cancel_tx.lock().unwrap() = Some(can_tx);
    }

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
    let (tx, rx) = mpsc::unbounded_channel();
    let is_running = self.is_running.clone();
    //
    // tokio::spawn(async move {
    //   println!("Waiting for project due to the request");
    //   while let Some(x) = can_rx.recv().await {
    //     println!("Received someting from can_rx.recv()");
    //   }
    //   println!("Exited endind channel waiter");
    //
    //   is_running.store(false, Ordering::SeqCst);
    //   // child.wait().await
    //   //   .expect("child process encountered an error");
    //
    // });
    // tokio::spawn(async move {
    //    child.wait().await
    // });
    tokio::spawn(async move {
      select! {
        _ = child.wait() => {
          println!("Exited from project gracefully")
        }
        _ = can_rx.recv() => {
          println!("Force canceled project");
          match child.try_wait() {
            Ok(Some(_)) => {},
            _ => {
              child.kill().await.unwrap();
              child.wait().await.unwrap();
            }
          }
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
    let sender = {
      self.cancel_tx.lock().unwrap().take()
    };

    match sender {
      Some(x) => {
        println!("Send to stop sender");
        tokio::spawn(async move {
          x.send(()).await.unwrap();
        });
      },
      None => {
        println!("Failed to stop project, sender is missing")
      }
    }
  }
}
