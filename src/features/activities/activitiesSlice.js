import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { seed } from "../../data/seed";
import { request } from "../../services/api";
import { uid } from "../../utils/id";

export const createActivity = createAsyncThunk("activities/create", async (input, { getState }) => {
  const record = {
    unread: true,
    userId: getState().settings.profile.id || "maya",
    relatedType: "note",
    relatedId: "",
    relatedLabel: "",
    ...input,
    id: uid("act"),
    createdAt: new Date().toISOString(),
  };
  await request("post", "/activities", record);
  return record;
});

const activitiesSlice = createSlice({
  name: "activities",
  initialState: { items: seed.activities, status: "idle", error: null },
  reducers: {
    addActivity(state, action) {
      state.items.unshift(action.payload);
    },
    markActivityRead(state, action) {
      const item = state.items.find((activity) => activity.id === action.payload);
      if (item) item.unread = false;
    },
    markAllRead(state) {
      state.items.forEach((activity) => {
        activity.unread = false;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createActivity.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createActivity.fulfilled, (state, action) => {
        state.status = "idle";
        state.items.unshift(action.payload);
      })
      .addCase(createActivity.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not log activity";
      });
  },
});

export const { addActivity, markActivityRead, markAllRead } = activitiesSlice.actions;
export default activitiesSlice.reducer;
