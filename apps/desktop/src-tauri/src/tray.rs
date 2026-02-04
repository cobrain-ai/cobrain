// System Tray Implementation for CoBrain Desktop

use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

pub fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> Result<TrayIcon<R>, Box<dyn std::error::Error>> {
    let open_item = MenuItem::with_id(app, "open", "Open CoBrain", true, None::<&str>)?;
    let capture_item = MenuItem::with_id(app, "capture", "Quick Capture", true, Some("Ctrl+Shift+Space"))?;
    let separator = MenuItem::with_id(app, "sep", "-", false, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, Some("Ctrl+Q"))?;

    let menu = Menu::with_items(app, &[&open_item, &capture_item, &separator, &quit_item])?;

    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("CoBrain - Your AI Second Brain")
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "capture" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.eval("window.location.href = '/capture'");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(tray)
}
