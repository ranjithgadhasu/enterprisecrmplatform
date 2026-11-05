import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { ACTIVITY_TYPES, CUSTOMER_STATUSES, HEALTH, INDUSTRIES, LEAD_STATUSES, PLANS, PRIORITIES, SOURCES, STAGES, TASK_STATUSES, TASK_TYPES } from "../../data/constants";
import { fromDateInput, toDateInput } from "../../utils/format";
import { Button, SelectInput, TextArea, TextInput } from "../ui/ui";
import { activitySchema, convertSchema, customerSchema, dealSchema, leadSchema, taskSchema } from "./schemas";

function ownerOptions(team) {
  return team.map((member) => ({ value: member.id, label: member.name }));
}

function FormActions({ busy, onCancel, label }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : label}
      </Button>
    </div>
  );
}

export function LeadForm({ initial, team, busy, onCancel, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(leadSchema),
    defaultValues: {
      name: "",
      title: "",
      company: "",
      email: "",
      phone: "",
      source: "Inbound",
      status: "new",
      ownerId: team[0]?.id || "maya",
      industry: INDUSTRIES[0],
      location: "",
      value: 25000,
      score: 50,
      notes: "",
      tags: "",
    },
  });
  useEffect(() => {
    reset(
      initial
        ? { ...initial, tags: (initial.tags || []).join(", ") }
        : {
            name: "",
            title: "",
            company: "",
            email: "",
            phone: "",
            source: "Inbound",
            status: "new",
            ownerId: team[0]?.id || "maya",
            industry: INDUSTRIES[0],
            location: "",
            value: 25000,
            score: 50,
            notes: "",
            tags: "",
          },
    );
  }, [initial, reset, team]);

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      onSubmit={handleSubmit(onSubmit, () => toast.error("Check the highlighted fields"))}
    >
      <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      <TextInput label="Title" error={errors.title?.message} {...register("title")} />
      <TextInput label="Company" error={errors.company?.message} {...register("company")} />
      <TextInput label="Email" type="email" error={errors.email?.message} {...register("email")} />
      <TextInput label="Phone" error={errors.phone?.message} {...register("phone")} />
      <TextInput label="Location" error={errors.location?.message} {...register("location")} />
      <SelectInput label="Source" options={SOURCES.map((item) => ({ value: item, label: item }))} error={errors.source?.message} {...register("source")} />
      <SelectInput label="Status" options={LEAD_STATUSES.map((item) => ({ value: item.id, label: item.label }))} error={errors.status?.message} {...register("status")} />
      <SelectInput label="Owner" options={ownerOptions(team)} error={errors.ownerId?.message} {...register("ownerId")} />
      <SelectInput label="Industry" options={INDUSTRIES.map((item) => ({ value: item, label: item }))} error={errors.industry?.message} {...register("industry")} />
      <TextInput label="Potential value" type="number" error={errors.value?.message} {...register("value", { valueAsNumber: true })} />
      <TextInput label="Score" type="number" min="0" max="100" error={errors.score?.message} {...register("score", { valueAsNumber: true })} />
      <div className="sm:col-span-2">
        <TextInput label="Tags" hint="Comma separated" error={errors.tags?.message} {...register("tags")} />
      </div>
      <div className="sm:col-span-2">
        <TextArea label="Notes" error={errors.notes?.message} {...register("notes")} />
      </div>
      <div className="sm:col-span-2">
        <FormActions busy={busy} onCancel={onCancel} label={initial ? "Save lead" : "Add lead"} />
      </div>
    </form>
  );
}

export function DealForm({ initial, team, busy, onCancel, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(dealSchema),
    defaultValues: {
      title: "",
      company: "",
      value: 50000,
      stage: "discovery",
      probability: 20,
      ownerId: team[0]?.id || "maya",
      closeDate: "",
      contact: "",
      contactEmail: "",
      priority: "medium",
      notes: "",
    },
  });
  useEffect(() => {
    reset(
      initial
        ? { ...initial, closeDate: toDateInput(initial.closeDate) }
        : {
            title: "",
            company: "",
            value: 50000,
            stage: "discovery",
            probability: 20,
            ownerId: team[0]?.id || "maya",
            closeDate: "",
            contact: "",
            contactEmail: "",
            priority: "medium",
            notes: "",
          },
    );
  }, [initial, reset, team]);

  return (
    <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={handleSubmit((values) => onSubmit({ ...values, closeDate: fromDateInput(values.closeDate) }), () => toast.error("Check the highlighted fields"))}>
      <TextInput label="Deal title" error={errors.title?.message} {...register("title")} />
      <TextInput label="Company" error={errors.company?.message} {...register("company")} />
      <TextInput label="Value" type="number" error={errors.value?.message} {...register("value", { valueAsNumber: true })} />
      <TextInput label="Probability" type="number" error={errors.probability?.message} {...register("probability", { valueAsNumber: true })} />
      <SelectInput label="Stage" options={STAGES.map((item) => ({ value: item.id, label: item.label }))} error={errors.stage?.message} {...register("stage")} />
      <SelectInput label="Priority" options={PRIORITIES.map((item) => ({ value: item, label: item }))} error={errors.priority?.message} {...register("priority")} />
      <SelectInput label="Owner" options={ownerOptions(team)} error={errors.ownerId?.message} {...register("ownerId")} />
      <TextInput label="Close date" type="date" error={errors.closeDate?.message} {...register("closeDate")} />
      <TextInput label="Contact" error={errors.contact?.message} {...register("contact")} />
      <TextInput label="Contact email" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
      <div className="sm:col-span-2">
        <TextArea label="Notes" error={errors.notes?.message} {...register("notes")} />
      </div>
      <div className="sm:col-span-2">
        <FormActions busy={busy} onCancel={onCancel} label={initial ? "Save deal" : "Add deal"} />
      </div>
    </form>
  );
}

export function CustomerForm({ initial, team, busy, onCancel, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(customerSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      plan: "Growth",
      arr: 24000,
      health: "steady",
      status: "active",
      ownerId: "leo",
      industry: INDUSTRIES[0],
      location: "",
      since: "",
      website: "",
      notes: "",
    },
  });
  useEffect(() => {
    reset(
      initial
        ? { ...initial, since: toDateInput(initial.since) }
        : {
            name: "",
            company: "",
            email: "",
            phone: "",
            plan: "Growth",
            arr: 24000,
            health: "steady",
            status: "onboarding",
            ownerId: "leo",
            industry: INDUSTRIES[0],
            location: "",
            since: toDateInput(new Date().toISOString()),
            website: "",
            notes: "",
          },
    );
  }, [initial, reset, team]);

  return (
    <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={handleSubmit((values) => onSubmit({ ...values, since: fromDateInput(values.since) }), () => toast.error("Check the highlighted fields"))}>
      <TextInput label="Contact" error={errors.name?.message} {...register("name")} />
      <TextInput label="Company" error={errors.company?.message} {...register("company")} />
      <TextInput label="Email" type="email" error={errors.email?.message} {...register("email")} />
      <TextInput label="Phone" error={errors.phone?.message} {...register("phone")} />
      <SelectInput label="Plan" options={PLANS.map((item) => ({ value: item, label: item }))} error={errors.plan?.message} {...register("plan")} />
      <TextInput label="ARR" type="number" error={errors.arr?.message} {...register("arr", { valueAsNumber: true })} />
      <SelectInput label="Health" options={HEALTH.map((item) => ({ value: item, label: item }))} error={errors.health?.message} {...register("health")} />
      <SelectInput label="Status" options={CUSTOMER_STATUSES.map((item) => ({ value: item, label: item }))} error={errors.status?.message} {...register("status")} />
      <SelectInput label="Owner" options={ownerOptions(team)} error={errors.ownerId?.message} {...register("ownerId")} />
      <SelectInput label="Industry" options={INDUSTRIES.map((item) => ({ value: item, label: item }))} error={errors.industry?.message} {...register("industry")} />
      <TextInput label="Location" error={errors.location?.message} {...register("location")} />
      <TextInput label="Customer since" type="date" error={errors.since?.message} {...register("since")} />
      <div className="sm:col-span-2">
        <TextInput label="Website" error={errors.website?.message} {...register("website")} />
      </div>
      <div className="sm:col-span-2">
        <TextArea label="Notes" error={errors.notes?.message} {...register("notes")} />
      </div>
      <div className="sm:col-span-2">
        <FormActions busy={busy} onCancel={onCancel} label={initial ? "Save customer" : "Add customer"} />
      </div>
    </form>
  );
}

export function TaskForm({ initial, team, busy, onCancel, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      title: "",
      type: "Follow-up",
      dueDate: "",
      priority: "medium",
      status: "open",
      ownerId: team[0]?.id || "maya",
      relatedLabel: "",
      description: "",
    },
  });
  useEffect(() => {
    reset(
      initial
        ? { ...initial, dueDate: toDateInput(initial.dueDate) }
        : {
            title: "",
            type: "Follow-up",
            dueDate: "",
            priority: "medium",
            status: "open",
            ownerId: team[0]?.id || "maya",
            relatedLabel: "",
            description: "",
          },
    );
  }, [initial, reset, team]);

  return (
    <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={handleSubmit((values) => onSubmit({ ...values, dueDate: fromDateInput(values.dueDate) }), () => toast.error("Check the highlighted fields"))}>
      <div className="sm:col-span-2">
        <TextInput label="Title" error={errors.title?.message} {...register("title")} />
      </div>
      <SelectInput label="Type" options={TASK_TYPES.map((item) => ({ value: item, label: item }))} error={errors.type?.message} {...register("type")} />
      <SelectInput label="Status" options={TASK_STATUSES.map((item) => ({ value: item, label: item }))} error={errors.status?.message} {...register("status")} />
      <TextInput label="Due date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
      <SelectInput label="Priority" options={PRIORITIES.map((item) => ({ value: item, label: item }))} error={errors.priority?.message} {...register("priority")} />
      <SelectInput label="Owner" options={ownerOptions(team)} error={errors.ownerId?.message} {...register("ownerId")} />
      <TextInput label="Related to" error={errors.relatedLabel?.message} {...register("relatedLabel")} />
      <div className="sm:col-span-2">
        <TextArea label="Description" error={errors.description?.message} {...register("description")} />
      </div>
      <div className="sm:col-span-2">
        <FormActions busy={busy} onCancel={onCancel} label={initial ? "Save task" : "Add task"} />
      </div>
    </form>
  );
}

export function ActivityForm({ initial, team, busy, onCancel, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(activitySchema),
    defaultValues: {
      type: "note",
      title: "",
      description: "",
      relatedLabel: "",
      userId: team[0]?.id || "maya",
    },
  });
  useEffect(() => {
    reset(initial || { type: "note", title: "", description: "", relatedLabel: "", userId: team[0]?.id || "maya" });
  }, [initial, reset, team]);

  return (
    <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit, () => toast.error("Check the highlighted fields"))}>
      <SelectInput label="Type" options={ACTIVITY_TYPES.map((item) => ({ value: item, label: item }))} error={errors.type?.message} {...register("type")} />
      <SelectInput label="Logged by" options={ownerOptions(team)} error={errors.userId?.message} {...register("userId")} />
      <div className="sm:col-span-2">
        <TextInput label="Title" error={errors.title?.message} {...register("title")} />
      </div>
      <div className="sm:col-span-2">
        <TextInput label="Related to" error={errors.relatedLabel?.message} {...register("relatedLabel")} />
      </div>
      <div className="sm:col-span-2">
        <TextArea label="What happened" error={errors.description?.message} {...register("description")} />
      </div>
      <div className="sm:col-span-2">
        <FormActions busy={busy} onCancel={onCancel} label="Log activity" />
      </div>
    </form>
  );
}

export function ConvertForm({ lead, busy, onCancel, onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(convertSchema),
    defaultValues: {
      dealValue: lead?.value || 0,
      closeDate: "",
      stage: "discovery",
    },
  });
  return (
    <form className="grid gap-3" onSubmit={handleSubmit((values) => onSubmit({ ...values, closeDate: fromDateInput(values.closeDate) }), () => toast.error("Check the highlighted fields"))}>
      <p className="text-sm text-muted">
        Open an account for <span className="text-ink">{lead?.company}</span> and place a deal on the board.
      </p>
      <TextInput label="Deal value" type="number" error={errors.dealValue?.message} {...register("dealValue", { valueAsNumber: true })} />
      <TextInput label="Expected close" type="date" error={errors.closeDate?.message} {...register("closeDate")} />
      <SelectInput label="Starting stage" options={STAGES.filter((stage) => !stage.id.startsWith("closed")).map((item) => ({ value: item.id, label: item.label }))} error={errors.stage?.message} {...register("stage")} />
      <FormActions busy={busy} onCancel={onCancel} label="Convert lead" />
    </form>
  );
}
