import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TEAM } from "../data/constants";
import { money } from "../utils/format";

export function useDeskState() {
  const leads = useSelector((state) => state.leads);
  const pipeline = useSelector((state) => state.pipeline);
  const customers = useSelector((state) => state.customers);
  const tasks = useSelector((state) => state.tasks);
  const activities = useSelector((state) => state.activities);
  const settings = useSelector((state) => state.settings);
  return useMemo(
    () => ({ leads, pipeline, customers, tasks, activities, settings }),
    [leads, pipeline, customers, tasks, activities, settings],
  );
}

export function useWorkspace() {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings);
  const profile = settings.profile;
  const team = useMemo(
    () =>
      TEAM.map((member) =>
        member.id === profile.id
          ? { ...member, name: profile.name, email: profile.email, role: profile.role, phone: profile.phone, photo: profile.photo || member.photo }
          : member,
      ),
    [profile],
  );
  const formatMoney = (value) => money(value, settings.company.currency || "USD");
  const owner = (id) => team.find((member) => member.id === id);
  return { dispatch, settings, profile, team, formatMoney, owner, currency: settings.company.currency || "USD" };
}

export function useThemeSync() {
  const theme = useSelector((state) => state.settings.appearance.theme);
  const density = useSelector((state) => state.settings.appearance.density);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.density = density || "comfortable";
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
  }, [theme, density]);
}
