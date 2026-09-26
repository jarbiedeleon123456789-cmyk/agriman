import { notFound, redirect } from "next/navigation";
import { Card, EmptyState } from "@/components/ui";
import { AssignmentsSection, RequestsSection, SchedulingSection } from "@/components/sections/ops";
import { EquipmentAdminSection, MaintenanceSection, ResourcesSection } from "@/components/sections/inventory";
import {
  AnnouncementsAdminSection,
  AssociationsSection,
  BarangaysSection,
  DiagnosticsDashboardSection,
  FarmersSection,
  MeetingsSection,
  ProgramsSection,
} from "@/components/sections/community";
import {
  AuditLogsSection,
  DashboardMapSection,
  FarmsSection,
  MarketSection,
  NotificationsSection,
  ProfileSection,
  ReportsSection,
  SettingsSection,
  UsersSection,
} from "@/components/sections/admin";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const ACCESS: Record<string, string[] | "all"> = {
  requests: "all",
  harvester: "all",
  calendar: "all",
  diagnostics: "all",
  assignments: ["operator", "admin", "staff"],
  equipment: ["admin", "staff"],
  resources: ["admin", "staff"],
  maintenance: ["operator", "admin", "staff"],
  farmers: ["admin", "staff", "association", "barangay", "auditor"],
  associations: ["admin", "staff", "association", "auditor"],
  barangays: ["admin", "staff", "barangay", "auditor"],
  announcements: "all",
  meetings: "all",
  programs: "all",
  profile: "all",
  farms: ["farmer", "association", "admin", "staff"],
  notifications: "all",
  map: "all",
  market: "all",
  reports: ["admin", "staff", "auditor"],
  users: ["admin"],
  "audit-logs": ["admin", "auditor"],
  settings: ["admin"],
};

export default async function DashboardSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { section } = await params;
  const rawSp = await searchParams;
  const sp: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(rawSp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allowed = ACCESS[section];
  if (!allowed) notFound();
  if (allowed !== "all" && !allowed.includes(user.role)) {
    return (
      <Card title="🔒 Access restricted">
        <EmptyState
          icon="🛡️"
          title="Your role does not have access to this module"
          hint="Role-based access control limits each account to the functions required by its responsibilities. Contact the MAO administrator if you need additional access."
        />
      </Card>
    );
  }

  switch (section) {
    case "requests":
      return <RequestsSection user={user} sp={sp} />;
    case "harvester":
      return <SchedulingSection user={user} sp={sp} harvesterOnly />;
    case "calendar":
      return <SchedulingSection user={user} sp={sp} harvesterOnly={false} />;
    case "diagnostics":
      return <DiagnosticsDashboardSection user={user} />;
    case "assignments":
      return <AssignmentsSection user={user} />;
    case "equipment":
      return <EquipmentAdminSection />;
    case "resources":
      return <ResourcesSection />;
    case "maintenance":
      return <MaintenanceSection user={user} />;
    case "farmers":
      return <FarmersSection user={user} sp={sp} />;
    case "associations":
      return <AssociationsSection />;
    case "barangays":
      return <BarangaysSection />;
    case "announcements":
      return <AnnouncementsAdminSection user={user} />;
    case "meetings":
      return <MeetingsSection user={user} />;
    case "programs":
      return <ProgramsSection user={user} />;
    case "profile":
      return <ProfileSection user={user} />;
    case "farms":
      return <FarmsSection user={user} />;
    case "notifications":
      return <NotificationsSection user={user} />;
    case "map":
      return <DashboardMapSection user={user} sp={sp} />;
    case "market":
      return <MarketSection user={user} />;
    case "reports":
      return <ReportsSection sp={sp} />;
    case "users":
      return <UsersSection user={user} />;
    case "audit-logs":
      return <AuditLogsSection sp={sp} />;
    case "settings":
      return <SettingsSection />;
    default:
      notFound();
  }
}
