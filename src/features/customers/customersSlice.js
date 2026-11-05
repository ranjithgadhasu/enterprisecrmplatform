import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { seed } from "../../data/seed";
import { request } from "../../services/api";
import { uid } from "../../utils/id";

function normalizeCustomer(input, existing = {}) {
  return {
    ...existing,
    ...input,
    arr: Number(input.arr) || 0,
    updatedAt: new Date().toISOString(),
  };
}

export const createCustomer = createAsyncThunk("customers/create", async (input) => {
  const record = normalizeCustomer({
    ...input,
    id: uid("cus"),
    createdAt: new Date().toISOString(),
    since: input.since || new Date().toISOString(),
  });
  await request("post", "/customers", record);
  return record;
});

export const updateCustomer = createAsyncThunk("customers/update", async (input) => {
  const record = normalizeCustomer(input, { id: input.id, createdAt: input.createdAt });
  await request("patch", `/customers/${input.id}`, record);
  return record;
});

export const deleteCustomer = createAsyncThunk("customers/delete", async (id) => {
  await request("delete", `/customers/${id}`);
  return id;
});

const customersSlice = createSlice({
  name: "customers",
  initialState: { items: seed.customers, status: "idle", error: null },
  reducers: {
    addCustomer(state, action) {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCustomer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.status = "idle";
        state.items.unshift(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not save customer";
      })
      .addCase(updateCustomer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.status = "idle";
        const index = state.items.findIndex((customer) => customer.id === action.payload.id);
        if (index >= 0) state.items[index] = { ...state.items[index], ...action.payload };
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not update customer";
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter((customer) => customer.id !== action.payload);
      });
  },
});

export const { addCustomer } = customersSlice.actions;
export default customersSlice.reducer;
