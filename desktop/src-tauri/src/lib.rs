//! UniRep desktop shell.
//!
//! The shell is deliberately thin: the interface is the same exported web build
//! the browser and the phone use, loaded from `app/dist`. The repertory database
//! and the sql.js WASM engine sit next to it in that directory, so the app works
//! with the network unplugged and never makes a request.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("UniRep failed to start");
}
