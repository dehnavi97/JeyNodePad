use std::process::Command;
use std::collections::HashMap;
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use std::net::TcpStream;
use std::io::{Read, Write};
use tauri::{AppHandle, Emitter, State, Manager};
use tokio::sync::Mutex;
use ssh2::Session;

struct SshSession {
    tx: std::sync::mpsc::Sender<String>,
}

struct SshState {
    sessions: Arc<Mutex<HashMap<String, SshSession>>>,
}

#[derive(serde::Serialize, Clone)]
struct SshOutput {
    id: String,
    output: String,
}

#[tauri::command]
async fn ssh_connect(
    app: AppHandle,
    state: State<'_, SshState>,
    id: String,
    ip: String,
    port: u16,
    user: String,
    pass: Option<String>,
) -> Result<(), String> {
    let (tx, rx) = std::sync::mpsc::channel::<String>();

    let id_clone = id.clone();
    let app_handle = app.clone();

    // Store the sender in the state
    let mut sessions = state.sessions.lock().await;
    sessions.insert(id.clone(), SshSession { tx });

    thread::spawn(move || {
        let run_ssh = || -> Result<(), String> {
            let tcp = TcpStream::connect(format!("{}:{}", ip, port)).map_err(|e| e.to_string())?;
            tcp.set_read_timeout(Some(Duration::from_millis(100))).map_err(|e| e.to_string())?;

            let mut sess = Session::new().map_err(|e| e.to_string())?;
            sess.set_tcp_stream(tcp);
            sess.handshake().map_err(|e| e.to_string())?;

            if let Some(p) = pass {
                sess.userauth_password(&user, &p).map_err(|e| e.to_string())?;
            } else {
                // Try agent or something else? For now just fail if no password
                return Err("Authentication failed: No password provided".to_string());
            }

            if !sess.authenticated() {
                return Err("Authentication failed".to_string());
            }

            let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
            channel.request_pty("xterm", None, None).map_err(|e| e.to_string())?;
            channel.shell().map_err(|e| e.to_string())?;

            sess.set_blocking(false);

            loop {
                // Check if we should close (if Sender is dropped or explicit close - though here we just check for messages)
                while let Ok(msg) = rx.try_recv() {
                    if msg == "__CLOSE__" {
                        return Ok(());
                    }
                    if let Err(e) = channel.write_all(msg.as_bytes()) {
                        eprintln!("Failed to write to channel: {}", e);
                        return Err(e.to_string());
                    }
                    let _ = channel.flush();
                }

                let mut buf = [0; 4096];
                match channel.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let output = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = app_handle.emit("ssh-output", SshOutput { id: id_clone.clone(), output });
                    }
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                        thread::sleep(Duration::from_millis(50));
                    }
                    Err(e) => {
                        eprintln!("Read error: {}", e);
                        break;
                    }
                }
            }
            Ok(())
        };

        if let Err(e) = run_ssh() {
            let _ = app_handle.emit("ssh-output", SshOutput {
                id: id_clone.clone(),
                output: format!("\r\n[JeyNode Error]: {}\r\n", e)
            });
        }

        // Clean up session from state when thread exits
        let app_handle_for_cleanup = app_handle.clone();
        let id_for_cleanup = id_clone.clone();
        tokio::spawn(async move {
            if let Some(state) = app_handle_for_cleanup.try_state::<SshState>() {
                let mut sessions = state.sessions.lock().await;
                sessions.remove(&id_for_cleanup);
            }
        });
    });

    Ok(())
}

#[tauri::command]
async fn ssh_write(state: State<'_, SshState>, id: String, data: String) -> Result<(), String> {
    let sessions = state.sessions.lock().await;
    if let Some(session) = sessions.get(&id) {
        session.tx.send(data).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Session not found".to_string())
    }
}

#[tauri::command]
async fn ssh_close(state: State<'_, SshState>, id: String) -> Result<(), String> {
    let mut sessions = state.sessions.lock().await;
    if let Some(session) = sessions.remove(&id) {
        let _ = session.tx.send("__CLOSE__".to_string());
    }
    Ok(())
}

#[tauri::command]
async fn ping_server(ip: String) -> Result<f64, String> {
    let output = if cfg!(windows) {
        Command::new("ping")
            .args(["-n", "1", &ip])
            .output()
            .map_err(|e| e.to_string())?
    } else {
        Command::new("ping")
            .args(["-c", "1", &ip])
            .output()
            .map_err(|e| e.to_string())?
    };

    if !output.status.success() {
        return Err("Ping failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse time=XX.X ms
    if let Some(time_idx) = stdout.find("time=") {
        let after_time = &stdout[time_idx + 5..];
        if let Some(ms_idx) = after_time.find(" ms") {
            let time_str = &after_time[..ms_idx];
            if let Ok(time) = time_str.trim().parse::<f64>() {
                return Ok(time);
            }
        }
    }

    // Windows usually uses "time<1ms" or "time=1ms"
    if cfg!(windows) {
         if let Some(time_idx) = stdout.find("time") {
            let after_time = &stdout[time_idx + 4..];
            let time_str: String = after_time.chars()
                .skip_while(|c| !c.is_digit(10))
                .take_while(|c| c.is_digit(10) || *c == '.')
                .collect();
            if let Ok(time) = time_str.parse::<f64>() {
                return Ok(time);
            }
         }
    }

    Err("Could not parse ping output".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SshState {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![ping_server, ssh_connect, ssh_write, ssh_close])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
