import * as yup from "yup";

const numberField = (label) =>
  yup
    .number()
    .transform((value, original) => (original === "" || original == null ? undefined : value))
    .typeError(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .required(`${label} is required`);

export const leadSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  title: yup.string().trim().required("Title is required"),
  company: yup.string().trim().required("Company is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  phone: yup.string().trim().default(""),
  source: yup.string().required("Source is required"),
  status: yup.string().required("Status is required"),
  ownerId: yup.string().required("Assign an owner"),
  industry: yup.string().required("Industry is required"),
  location: yup.string().trim().default(""),
  value: numberField("Value"),
  score: numberField("Score").max(100, "Score cannot exceed 100"),
  notes: yup.string().trim().default(""),
  tags: yup.string().trim().default(""),
});

export const dealSchema = yup.object({
  title: yup.string().trim().required("Title is required"),
  company: yup.string().trim().required("Company is required"),
  value: numberField("Value"),
  stage: yup.string().required("Stage is required"),
  probability: numberField("Probability").max(100, "Probability cannot exceed 100"),
  ownerId: yup.string().required("Assign an owner"),
  closeDate: yup.string().required("Close date is required"),
  contact: yup.string().trim().required("Contact is required"),
  contactEmail: yup.string().trim().email("Enter a valid email").required("Email is required"),
  priority: yup.string().required("Priority is required"),
  notes: yup.string().trim().default(""),
});

export const customerSchema = yup.object({
  name: yup.string().trim().required("Contact name is required"),
  company: yup.string().trim().required("Company is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  phone: yup.string().trim().default(""),
  plan: yup.string().required("Plan is required"),
  arr: numberField("ARR"),
  health: yup.string().required("Health is required"),
  status: yup.string().required("Status is required"),
  ownerId: yup.string().required("Assign an owner"),
  industry: yup.string().required("Industry is required"),
  location: yup.string().trim().default(""),
  since: yup.string().required("Customer since is required"),
  website: yup.string().trim().default(""),
  notes: yup.string().trim().default(""),
});

export const taskSchema = yup.object({
  title: yup.string().trim().required("Title is required"),
  type: yup.string().required("Type is required"),
  dueDate: yup.string().required("Due date is required"),
  priority: yup.string().required("Priority is required"),
  status: yup.string().required("Status is required"),
  ownerId: yup.string().required("Assign an owner"),
  relatedLabel: yup.string().trim().default(""),
  description: yup.string().trim().default(""),
});

export const activitySchema = yup.object({
  type: yup.string().required("Type is required"),
  title: yup.string().trim().required("Title is required"),
  description: yup.string().trim().required("Write a note"),
  relatedLabel: yup.string().trim().default(""),
  userId: yup.string().required("Choose who logged this"),
});

export const convertSchema = yup.object({
  dealValue: numberField("Deal value"),
  closeDate: yup.string().required("Close date is required"),
  stage: yup.string().required("Stage is required"),
});
