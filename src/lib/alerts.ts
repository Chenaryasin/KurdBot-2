export function showAlert(message: string, callback?: () => void) {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.showAlert) {
    (window as any).Telegram.WebApp.showAlert(message, callback);
  } else {
    // Fallback for development/desktop browser
    alert(message);
    if (callback) callback();
  }
}

export function showConfirm(message: string, callback: (confirmed: boolean) => void) {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.showConfirm) {
    (window as any).Telegram.WebApp.showConfirm(message, callback);
  } else {
    // Fallback for development/desktop browser
    const result = confirm(message);
    callback(result);
  }
}
