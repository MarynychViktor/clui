use std::collections::HashMap;
use std::os::unix::io::FromRawFd;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use std::sync::atomic::AtomicBool;
use tokio::process::{Child, Command};
use tokio::sync::{mpsc};
use tokio::sync::mpsc::{Sender, UnboundedReceiver};
use tokio::io::AsyncBufReadExt;
use tokio::select;

#[derive(Debug)]
pub struct Descriptor {
  pub name: String,
  pub executable: String,
  pub workdir: String,
}

pub struct Project {
  pub name: String,
  pub executable: String,
  pub workdir: String,
  pub is_running: AtomicBool,
  cancel_tx: Sender<()>
}

pub type Projects = HashMap<String, Arc<Project>>;

const PROCESS_DELAY: u64 = 100;

impl Project {
  pub fn spawn(&mut self) -> UnboundedReceiver<String> {
    let (can_tx, can_rx) = mpsc::channel::<()>(1);
    self.cancel_tx = can_tx;

    let stderr_io = unsafe {
      Stdio::from_raw_fd(1)
    };

    let mut child = Command::new("/bin/bash")
      .kill_on_drop(true)
      .arg("-c")
      .arg(self.descriptor.executable.as_str())
      .current_dir(self.descriptor.workdir.as_str())
      .stdout(Stdio::piped())
      .stderr(stderr_io)
      .stdin(Stdio::null())
      .spawn().unwrap();

    let stdout = child.stdout.take().unwrap();
    let (tx, mut rx) = mpsc::unbounded_channel();
    let reader = tokio::io::BufReader::new(stdout);

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
      // child.wait().await
      //   .expect("child process encountered an error");

    });

    tokio::spawn(async move {
      while let Some(line) = reader.lines().next_line().await.unwrap() {
        tx.send(line).expect("Failed to send a message");
      }
    });

    rx
  }

  pub fn stop(&self) {
    self.cancel_tx.send(());
  }
}
