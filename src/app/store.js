import { configureStore } from "@reduxjs/toolkit";
import leadsReducer from "../features/leads/leadsSlice";
import pipelineReducer from "../features/pipeline/pipelineSlice";
import customersReducer from "../features/customers/customersSlice";
import tasksReducer from "../features/tasks/tasksSlice";
import activitiesReducer from "../features/activities/activitiesSlice";
import settingsReducer from "../features/settings/settingsSlice";
import uiReducer from "../features/ui/uiSlice";
import { STORAGE_KEY, STORAGE_VERSION, readPersistedState } from "./storage";

export const store = configureStore({
  reducer: {
    leads: leadsReducer,
    pipeline: pipelineReducer,
    customers: customersReducer,
    tasks: tasksReducer,
    activities: activitiesReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  preloadedState: readPersistedState(),
});

let timer;
store.subscribe(() => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      const state = store.getState();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          state,
        }),
      );
    } catch {
      /* ignore quota or private-mode failures */
    }
  }, 60);
});
