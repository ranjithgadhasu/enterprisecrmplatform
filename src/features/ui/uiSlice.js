import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: false,
    commandOpen: false,
    notificationsOpen: false,
    syncing: false,
    lastSynced: null,
  },
  reducers: {
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setCommandOpen(state, action) {
      state.commandOpen = action.payload;
      if (action.payload) state.notificationsOpen = false;
    },
    toggleCommand(state) {
      state.commandOpen = !state.commandOpen;
      if (state.commandOpen) state.notificationsOpen = false;
    },
    setNotificationsOpen(state, action) {
      state.notificationsOpen = action.payload;
      if (action.payload) state.commandOpen = false;
    },
    setSyncing(state, action) {
      state.syncing = action.payload;
    },
    setLastSynced(state, action) {
      state.lastSynced = action.payload;
      state.syncing = false;
    },
  },
});

export const {
  setSidebarOpen,
  toggleSidebar,
  setCommandOpen,
  toggleCommand,
  setNotificationsOpen,
  setSyncing,
  setLastSynced,
} = uiSlice.actions;
export default uiSlice.reducer;
