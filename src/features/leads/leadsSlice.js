import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { seed } from "../../data/seed";
import { STAGES } from "../../data/constants";
import { request } from "../../services/api";
import { uid } from "../../utils/id";
import { addCustomer } from "../customers/customersSlice";
import { addDeal } from "../pipeline/pipelineSlice";
import { addActivity } from "../activities/activitiesSlice";

function normalizeLead(input, existing = {}) {
  const tags = Array.isArray(input.tags)
    ? input.tags
    : String(input.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
  return {
    ...existing,
    ...input,
    tags,
    score: Number(input.score) || 0,
    value: Number(input.value) || 0,
    updatedAt: new Date().toISOString(),
  };
}

export const createLead = createAsyncThunk("leads/create", async (input) => {
  const record = normalizeLead({
    ...input,
    id: uid("lead"),
    createdAt: new Date().toISOString(),
  });
  await request("post", "/leads", record);
  return record;
});

export const updateLead = createAsyncThunk("leads/update", async (input) => {
  const record = normalizeLead(input, { id: input.id, createdAt: input.createdAt });
  await request("patch", `/leads/${input.id}`, record);
  return record;
});

export const deleteLead = createAsyncThunk("leads/delete", async (id) => {
  await request("delete", `/leads/${id}`);
  return id;
});

export const convertLead = createAsyncThunk("leads/convert", async ({ lead, dealValue, closeDate, stage = "discovery" }, { dispatch, getState }) => {
  await request("post", `/leads/${lead.id}/convert`, { dealValue, closeDate, stage });
  const customers = getState().customers.items;
  const existing = customers.find((customer) => customer.company.toLowerCase() === lead.company.toLowerCase());
  let customerId = existing?.id;
  if (!existing) {
    const customer = {
      id: uid("cus"),
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone || "",
      plan: "Growth",
      arr: Number(dealValue) || 0,
      health: "steady",
      status: "onboarding",
      ownerId: "leo",
      industry: lead.industry,
      location: lead.location || "",
      since: new Date().toISOString(),
      notes: `Converted from lead. ${lead.notes || ""}`.trim(),
      website: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(addCustomer(customer));
    customerId = customer.id;
  }
  const stageMeta = STAGES.find((item) => item.id === stage) || STAGES[0];
  const deal = {
    id: uid("deal"),
    title: `${lead.company} engagement`,
    company: lead.company,
    value: Number(dealValue) || 0,
    stage,
    probability: stageMeta.probability,
    ownerId: lead.ownerId === "priya" ? "maya" : lead.ownerId,
    closeDate,
    contact: lead.name,
    contactEmail: lead.email,
    priority: "high",
    notes: lead.notes || "Opened from a converted lead.",
    leadId: lead.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  dispatch(addDeal(deal));
  dispatch(
    addActivity({
      id: uid("act"),
      type: "deal",
      title: `Converted ${lead.name} at ${lead.company}`,
      description: `Opened a ${stageMeta.label.toLowerCase()} deal and handed the account to the desk.`,
      createdAt: new Date().toISOString(),
      userId: getState().settings.profile.id || "maya",
      relatedLabel: lead.company,
      relatedType: "deal",
      relatedId: deal.id,
      unread: true,
    }),
  );
  return { leadId: lead.id, customerId, dealId: deal.id };
});

const leadsSlice = createSlice({
  name: "leads",
  initialState: { items: seed.leads, status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createLead.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.status = "idle";
        state.items.unshift(action.payload);
      })
      .addCase(createLead.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not save lead";
      })
      .addCase(updateLead.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.status = "idle";
        const index = state.items.findIndex((lead) => lead.id === action.payload.id);
        if (index >= 0) state.items[index] = { ...state.items[index], ...action.payload };
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not update lead";
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.items = state.items.filter((lead) => lead.id !== action.payload);
      })
      .addCase(convertLead.pending, (state) => {
        state.status = "loading";
      })
      .addCase(convertLead.fulfilled, (state, action) => {
        state.status = "idle";
        const lead = state.items.find((item) => item.id === action.payload.leadId);
        if (lead) {
          lead.status = "converted";
          lead.updatedAt = new Date().toISOString();
        }
      })
      .addCase(convertLead.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message || "Could not convert lead";
      });
  },
});

export default leadsSlice.reducer;
