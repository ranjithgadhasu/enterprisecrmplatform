import { createSlice } from "@reduxjs/toolkit";
import { seed } from "../../data/seed";

const settingsSlice = createSlice({
  name: "settings",
  initialState: seed.settings,
  reducers: {
    updateProfile(state, action) {
      state.profile = { ...state.profile, ...action.payload };
    },
    updateCompany(state, action) {
      state.company = { ...state.company, ...action.payload };
    },
    updateNotifications(state, action) {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateAppearance(state, action) {
      state.appearance = { ...state.appearance, ...action.payload };
    },
  },
});

export const { updateProfile, updateCompany, updateNotifications, updateAppearance } = settingsSlice.actions;
export default settingsSlice.reducer;
