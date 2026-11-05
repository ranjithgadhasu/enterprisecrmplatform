import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { seed } from "../../data/seed";
import { stageOf } from "../../data/constants";
import { request } from "../../services/api";
import { uid } from "../../utils/id";

function normalizeDeal(input, existing = {}) {
  const stage = input.stage || existing.stage || "discovery";
  return {
    ...existing,
    ...input,
    stage,
    value: Number(input.value) || 0,
    probability: Number(input.probability ?? stageOf(stage).probability) || 0,
    updatedAt: new Date().toISOString(),
  };
}

export const createDeal = createAsyncThunk("pipeline/create", async (input) => {
  const record = normalizeDeal({
    ...input,
    id: uid("deal"),
    createdAt: new Date().toISOString(),
  });
  await request("post", "/deals", record);
  return record;
});

export const updateDeal = createAsyncThunk("pipeline/update", async (input) => {
  const record = normalizeDeal(input, { id: input.id, createdAt: input.createdAt });
  await request("patch", `/deals/${input.id}`, record);
  return record;
});

export const deleteDeal = createAsyncThunk("pipeline/delete", async (id) => {
  await request("delete", `/deals/${id}`);
  return id;
});

export const moveDeal = createAsyncThunk("pipeline/move", async ({ id, stage }, { getState }) => {
  const current = getState().pipeline.items.find((deal) => deal.id === id);
  const next = normalizeDeal({ ...current, stage, probability: stageOf(stage).probability }, current);
  await request("patch", `/deals/${id}`, { stage, probability: next.probability });
  return next;
});

const pipelineSlice = createSlice({
  name: "pipeline",
  initialState: { items: seed.deals, status: "idle", error: null },
  reducers: {
    addDeal(state, action) {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDeal.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createDeal.fulfilled, (state, action) => {
        state.status = "idle";
        state.items.unshift(action.payload);
      })
      .addCase(createDeal.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not save deal";
      })
      .addCase(updateDeal.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateDeal.fulfilled, (state, action) => {
        state.status = "idle";
        const index = state.items.findIndex((deal) => deal.id === action.payload.id);
        if (index >= 0) state.items[index] = { ...state.items[index], ...action.payload };
      })
      .addCase(updateDeal.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not update deal";
      })
      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.items = state.items.filter((deal) => deal.id !== action.payload);
      })
      .addCase(moveDeal.fulfilled, (state, action) => {
        const index = state.items.findIndex((deal) => deal.id === action.payload.id);
        if (index >= 0) state.items[index] = { ...state.items[index], ...action.payload };
      });
  },
});

export const { addDeal } = pipelineSlice.actions;
export default pipelineSlice.reducer;
