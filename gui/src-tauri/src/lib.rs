mod session;
mod workspace;

#[tauri::command]
fn desktop_healthcheck() -> String {
    "desktop-bridge-ready".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(session::SessionRegistry::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            desktop_healthcheck,
            workspace::workspace_inspect_repository,
            workspace::commit_list_repository,
            workspace::workspace_clone_managed_repository,
            workspace::workspace_list_managed_repositories,
            session::session_create,
            session::session_start,
            session::session_get_detail,
            session::session_continue,
            session::session_abort
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
