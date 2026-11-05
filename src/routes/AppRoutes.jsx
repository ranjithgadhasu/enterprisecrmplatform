import { Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../features/dashboard/DashboardPage";
import LeadsPage from "../features/leads/LeadsPage";
import PipelinePage from "../features/pipeline/PipelinePage";
import CustomersPage from "../features/customers/CustomersPage";
import TasksPage from "../features/tasks/TasksPage";
import ActivitiesPage from "../features/activities/ActivitiesPage";
import ReportsPage from "../features/reports/ReportsPage";
import SettingsPage from "../features/settings/SettingsPage";
import { Button } from "../components/ui/ui";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-copper">404</p>
        <h1 className="mt-2 font-display text-5xl">This page left the desk.</h1>
        <p className="mt-3 text-sm text-muted">The route does not exist. The rest of the book is still here.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Back to overview</Button>
        </Link>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
