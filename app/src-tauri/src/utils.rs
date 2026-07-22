use std::process::{Command, Stdio};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use crate::types::CmdResult;

pub fn run_cmd(program: &str, args: &[&str]) -> CmdResult {
    let mut cmd = Command::new(program);
    cmd.args(args);
    cmd.stdin(Stdio::null());
    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    match cmd.output() {
        Ok(output) => CmdResult {
            ok: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        },
        Err(err) => CmdResult {
            ok: false,
            stdout: String::new(),
            stderr: err.to_string(),
        },
    }
}

pub fn detect_os() -> String {
    if cfg!(target_os = "windows") { "windows".to_string() }
    else if cfg!(target_os = "macos") { "macos".to_string() }
    else if cfg!(target_os = "linux") { "linux".to_string() }
    else { "unknown".to_string() }
}

pub fn command_exists(name: &str) -> bool {
    if cfg!(target_os = "windows") {
        run_cmd("where", &[name]).ok
    } else {
        run_cmd("which", &[name]).ok
    }
}

pub fn detect_arch() -> String {
    std::env::consts::ARCH.to_string()
}
