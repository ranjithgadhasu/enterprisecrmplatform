export const STORAGE_KEY = "northline.crm.v1";
export const STORAGE_VERSION = 1;

export function readPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (parsed?.version !== STORAGE_VERSION) return undefined;
    if (!Array.isArray(state?.leads?.items)) return undefined;
    if (!Array.isArray(state?.pipeline?.items)) return undefined;
    if (!Array.isArray(state?.customers?.items)) return undefined;
    if (!Array.isArray(state?.tasks?.items)) return undefined;
    if (!Array.isArray(state?.activities?.items)) return undefined;
    if (!state?.settings?.profile || !state?.settings?.company) return undefined;
    if (state.ui) {
      state.ui.commandOpen = false;
      state.ui.notificationsOpen = false;
      state.ui.sidebarOpen = false;
      state.ui.syncing = false;
    }
    return state;
  } catch {
    return undefined;
  }
}

export function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}
