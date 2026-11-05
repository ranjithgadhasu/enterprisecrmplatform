import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { CURRENCIES, FISCAL_MONTHS, TIMEZONES } from "../../data/constants";
import { updateAppearance, updateCompany, updateNotifications, updateProfile } from "./settingsSlice";
import { clearPersistedState } from "../../app/storage";
import { buildMetrics } from "../dashboard/metrics";
import { useDeskState, useWorkspace } from "../../hooks/useWorkspace";
import { exportJson } from "../../services/exporters";
import { PageHeader, SectionCard } from "../../components/common/common";
import { Button, ConfirmDialog, Modal, SelectInput, TextInput } from "../../components/ui/ui";

const profileSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  role: yup.string().trim().required("Role is required"),
  phone: yup.string().trim().default(""),
  timezone: yup.string().required("Timezone is required"),
  photo: yup.string().trim().default(""),
});

const companySchema = yup.object({
  name: yup.string().trim().required("Company name is required"),
  legalName: yup.string().trim().required("Legal name is required"),
  website: yup.string().trim().default(""),
  currency: yup.string().required("Currency is required"),
  fiscalStart: yup.string().required("Fiscal start is required"),
  timezone: yup.string().required("Timezone is required"),
});

export default function SettingsPage() {
  const state = useDeskState();
  const { dispatch, settings, team, formatMoney, profile } = useWorkspace();
  const metrics = buildMetrics(state, { team });
  const [confirmReset, setConfirmReset] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);

  const profileForm = useForm({ resolver: yupResolver(profileSchema), defaultValues: profile });
  const companyForm = useForm({ resolver: yupResolver(companySchema), defaultValues: settings.company });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The house"
        title="Settings"
        description="Profile, currency, and the small preferences that change how the desk speaks. Everything stays in this browser."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Your profile">
          <form
            className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2"
            onSubmit={profileForm.handleSubmit((values) => {
              dispatch(updateProfile(values));
              toast.success("Profile saved");
            }, () => toast.error("Check the highlighted fields"))}
          >
            <TextInput label="Name" error={profileForm.formState.errors.name?.message} {...profileForm.register("name")} />
            <TextInput label="Role" error={profileForm.formState.errors.role?.message} {...profileForm.register("role")} />
            <TextInput label="Email" error={profileForm.formState.errors.email?.message} {...profileForm.register("email")} />
            <TextInput label="Phone" error={profileForm.formState.errors.phone?.message} {...profileForm.register("phone")} />
            <SelectInput label="Timezone" options={TIMEZONES.map((item) => ({ value: item, label: item }))} error={profileForm.formState.errors.timezone?.message} {...profileForm.register("timezone")} />
            <TextInput label="Photo URL" hint="Optional. Initials show if it fails." error={profileForm.formState.errors.photo?.message} {...profileForm.register("photo")} />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Company">
          <form
            className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2"
            onSubmit={companyForm.handleSubmit((values) => {
              dispatch(updateCompany(values));
              toast.success("Company saved");
            }, () => toast.error("Check the highlighted fields"))}
          >
            <TextInput label="Desk name" error={companyForm.formState.errors.name?.message} {...companyForm.register("name")} />
            <TextInput label="Legal name" error={companyForm.formState.errors.legalName?.message} {...companyForm.register("legalName")} />
            <TextInput label="Website" error={companyForm.formState.errors.website?.message} {...companyForm.register("website")} />
            <SelectInput label="Currency" hint="Used across every figure." options={CURRENCIES.map((item) => ({ value: item, label: item }))} error={companyForm.formState.errors.currency?.message} {...companyForm.register("currency")} />
            <SelectInput label="Fiscal year starts" options={FISCAL_MONTHS.map((item) => ({ value: item, label: item }))} error={companyForm.formState.errors.fiscalStart?.message} {...companyForm.register("fiscalStart")} />
            <SelectInput label="Company timezone" options={TIMEZONES.map((item) => ({ value: item, label: item }))} error={companyForm.formState.errors.timezone?.message} {...companyForm.register("timezone")} />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Save company</Button>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Appearance">
          <div className="grid grid-cols-2 gap-3 p-5">
            {["light", "dark"].map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => dispatch(updateAppearance({ theme }))}
                className={`rounded-2xl border p-4 text-left ${settings.appearance.theme === theme ? "border-copper" : "border-line"}`}
              >
                <span className={`mb-3 block h-12 rounded-xl ${theme === "light" ? "bg-[#f3efe6]" : "bg-[#1c1712]"}`} />
                <span className="text-sm capitalize">{theme}</span>
              </button>
            ))}
            <div className="col-span-2">
              <p className="mb-2 text-xs text-muted">Density</p>
              <div className="flex gap-2">
                {["comfortable", "compact"].map((density) => (
                  <Button key={density} variant={settings.appearance.density === density ? "primary" : "secondary"} onClick={() => dispatch(updateAppearance({ density }))}>
                    {density}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notifications">
          <div className="space-y-3 p-5">
            {[
              ["dealMoved", "Deal moved", "Toast when a card changes stage."],
              ["taskDue", "Task cleared", "Toast when a task is marked done."],
              ["leadAssigned", "Lead added", "Toast when a new lead lands."],
              ["weeklyDigest", "Weekly digest", "Keep a Monday summary ready."],
            ].map(([key, label, hint]) => (
              <label key={key} className="flex items-start justify-between gap-3 rounded-2xl bg-paper px-3 py-3">
                <span>
                  <span className="block text-sm">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.notifications[key])}
                  onChange={(event) => dispatch(updateNotifications({ [key]: event.target.checked }))}
                  className="mt-1 h-4 w-4 accent-[#c6532a]"
                />
              </label>
            ))}
            <Button variant="secondary" onClick={() => setDigestOpen(true)} disabled={!settings.notifications.weeklyDigest}>
              {settings.notifications.weeklyDigest ? "Preview digest" : "Digest is paused"}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Data">
          <div className="space-y-3 p-5 text-sm text-muted">
            <p>{state.leads.items.length} leads · {state.pipeline.items.length} deals · {state.customers.items.length} customers · {state.tasks.items.length} tasks</p>
            <p>Stored locally under northline.crm.v1. No server, no database.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => { exportJson("northline-workspace.json", state); toast.success("Workspace exported"); }}>Export JSON</Button>
              <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset demo data</Button>
            </div>
          </div>
        </SectionCard>
      </div>

      <Modal open={digestOpen} title="Monday digest" eyebrow="Preview" onClose={() => setDigestOpen(false)}>
        <div className="space-y-3 text-sm">
          <p className="text-muted">Prepared for {profile.name}. This is a local preview, not an email.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-paper p-3"><p className="text-xs text-muted">Booked this month</p><p className="font-display text-2xl">{formatMoney(metrics.wonThisMonth)}</p></div>
            <div className="rounded-2xl bg-paper p-3"><p className="text-xs text-muted">Verbal</p><p className="font-display text-2xl">{formatMoney(metrics.verbalValue)}</p></div>
            <div className="rounded-2xl bg-paper p-3"><p className="text-xs text-muted">New leads</p><p className="font-display text-2xl">{metrics.newLeads.length}</p></div>
            <div className="rounded-2xl bg-paper p-3"><p className="text-xs text-muted">Overdue tasks</p><p className="font-display text-2xl">{metrics.overdueTasks.length}</p></div>
          </div>
          <ul className="space-y-2">
            {metrics.attention.slice(0, 3).map((deal) => (
              <li key={deal.id} className="rounded-2xl border border-line px-3 py-2">{deal.company} · {formatMoney(deal.value)}</li>
            ))}
          </ul>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        title="Reset the demo desk?"
        body="Local changes will be cleared and the original book will load again."
        confirmLabel="Reset"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          clearPersistedState();
          window.location.reload();
        }}
      />
    </div>
  );
}
