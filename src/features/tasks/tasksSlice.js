import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { seed } from "../../data/seed";
import { request } from "../../services/api";
import { uid } from "../../utils/id";

export const createTask = createAsyncThunk("tasks/create", async (input) => {
  const record = {
    ...input,
    id: uid("task"),
    status: input.status || "open",
    createdAt: new Date().toISOString(),
  };
  await request("post", "/tasks", record);
  return record;
});

export const updateTask = createAsyncThunk("tasks/update", async (input) => {
  const record = { ...input, updatedAt: new Date().toISOString() };
  await request("patch", `/tasks/${input.id}`, record);
  return record;
});

export const deleteTask = createAsyncThunk("tasks/delete", async (id) => {
  await request("delete", `/tasks/${id}`);
  return id;
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState: { items: seed.tasks, status: "idle", error: null },
  reducers: {
    setTaskStatus(state, action) {
      const task = state.items.find((item) => item.id === action.payload.id);
      if (task) task.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = "idle";
        state.items.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not save task";
      })
      .addCase(updateTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = "idle";
        const index = state.items.findIndex((task) => task.id === action.payload.id);
        if (index >= 0) state.items[index] = { ...state.items[index], ...action.payload };
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not update task";
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((task) => task.id !== action.payload);
      });
  },
});

export const { setTaskStatus } = tasksSlice.actions;
export default tasksSlice.reducer;
