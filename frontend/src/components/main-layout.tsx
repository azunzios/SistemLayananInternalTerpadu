// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Dashboard } from "./dashboard";
import {
  CreateTicket,
  TicketList,
  TicketDetail,
  MyTicketsView,
} from "@/components/views/tickets";
import { ZoomBooking, ZoomManagementView } from "@/components/views/zoom";
import { UserManagement, ReportsView } from "@/components/views/admin";
import { ProfileSettings } from "@/components/views/shared";
import {
  WorkOrderList,
  TeknisiWorkOrderList,
} from "@/components/views/work-orders";
import { BmnAssetManagement } from "./bmn-asset-management";
import {
  getActiveRole,
  refreshTicketsFromApi,
  loadDataFromApiOnce,
} from "@/lib/storage";
import { buildRoute, isValidRole } from "@/routing/constants";
import type { User } from "@/types";

interface MainLayoutProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

export type ViewType =
  | "dashboard"
  | "create-ticket-perbaikan"
  | "create-ticket-zoom"
  | "tickets"
  | "my-tickets"
  | "ticket-detail"
  | "zoom-booking"
  | "zoom-management"
  | "users"
  | "bmn-assets"
  | "work-orders"
  | "reports"
  | "profile"
  | "settings";

/**
 * Menentukan default view berdasarkan role pengguna
 */
export const getDefaultViewForRole = (role: string): ViewType => {
  switch (role) {
    case "super_admin":
      return "dashboard"; // Super admin lihat dashboard dengan overview semua

    case "admin_layanan":
      return "tickets"; // Admin layanan langsung ke daftar tiket untuk review

    case "admin_penyedia":
      return "work-orders"; // Admin penyedia langsung ke work orders

    case "teknisi":
      return "tickets"; // Teknisi lihat tiket yang assigned ke dia

    case "pegawai":
    default:
      return "my-tickets"; // Pegawai lihat tiket miliknya
  }
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  onLogout,
  onUserUpdate,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ role?: string }>();
  const roleParam = params.role || "";

  // Parse ticket ID dari URL path jika ada (format: /:role/ticket-detail/:id)
  const parseTicketId = (): string | null => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    // pathParts: [role, 'ticket-detail', id]
    if (pathParts.length >= 3 && pathParts[1] === "ticket-detail") {
      return pathParts[2];
    }
    return null;
  };

  const selectedTicketId = parseTicketId();

  // Validate role from URL matches user's role
  useEffect(() => {
    if (!roleParam || !isValidRole(roleParam)) {
      // Invalid role, redirect to user's actual role
      navigate(buildRoute("/:role/dashboard", currentUser.role), {
        replace: true,
      });
      return;
    }

    if (roleParam !== currentUser.role) {
      // Role in URL doesn't match user's role - redirect to correct role
      navigate(buildRoute("/:role/dashboard", currentUser.role), {
        replace: true,
      });
      return;
    }
  }, [roleParam, currentUser.role, navigate]);

  // Derive current view from URL pathname
  const getViewFromPath = (): ViewType => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    // pathParts[0] = role, pathParts[1] = menu, pathParts[2+] = detail
    if (pathParts.length >= 2) {
      const menu = pathParts[1];
      if (menu.startsWith("ticket-detail")) return "ticket-detail";
      return menu as ViewType;
    }
    return "dashboard" as ViewType;
  };

  const currentView = getViewFromPath();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Track previous view di sessionStorage untuk persist saat navigate ke detail dari dialog
  React.useEffect(() => {
    if (currentView !== "ticket-detail") {
      sessionStorage.setItem("previousView", currentView);
    }
  }, [currentView]);

  // Centralized refresh: on refreshKey change, update tickets cache once
  React.useEffect(() => {
    if (refreshKey > 0) {
      (async () => {
        try {
          await refreshTicketsFromApi();
        } catch (e) {
          console.warn("⚠️ Failed to refresh tickets in MainLayout:", e);
        }
      })();
    }
  }, [refreshKey]);

  React.useEffect(() => {
    const roleToLoad = getActiveRole(currentUser.id) || currentUser.role;
    loadDataFromApiOnce(roleToLoad).catch((err) => {
      console.warn("⚠️ Failed to preload datasets for active role", err);
    });
  }, [currentUser.id, currentUser.role]);

  const handleNavigate = (view: ViewType, ticketId?: string) => {
    if (view === "ticket-detail" && ticketId) {
      navigate(buildRoute("/:role/ticket-detail/:id", roleParam, ticketId));
    } else {
      const routeMap: Record<ViewType, string> = {
        dashboard: "/:role/dashboard",
        "create-ticket-perbaikan": "/:role/create-ticket-perbaikan",
        "create-ticket-zoom": "/:role/create-ticket-zoom",
        tickets: "/:role/tickets",
        "my-tickets": "/:role/my-tickets",
        "ticket-detail": "/:role/tickets",
        "zoom-booking": "/:role/zoom-booking",
        "zoom-management": "/:role/zoom-management",
        "work-orders": "/:role/work-orders",
        users: "/:role/users",
        "bmn-assets": "/:role/bmn-assets",
        reports: "/:role/reports",
        profile: "/:role/profile",
        settings: "/:role/settings",
      };
      const path = buildRoute(routeMap[view], roleParam);
      navigate(path);
    }
  };

  const handleRoleSwitch = () => {
    const activeRole = (getActiveRole(currentUser.id) ||
      currentUser.role) as any;
    loadDataFromApiOnce(activeRole).catch((err) => {
      console.warn("⚠️ Failed to load datasets for active role", err);
    });
    setRefreshKey((prev) => prev + 1);
    const defaultView = getDefaultViewForRole(activeRole);
    const path = buildRoute(
      defaultView === "ticket-detail"
        ? "/:role/dashboard"
        : `/:role/${defaultView}`,
      roleParam
    );
    navigate(path);
  };

  const handleViewTicketDetail = (ticketId: string) => {
    navigate(buildRoute("/:role/ticket-detail/:id", roleParam, ticketId));
  };

  const handleBackToList = () => {
    // Baca previousView dari sessionStorage (di-set setiap kali view berubah)
    // Ini memastikan back button selalu ke view yang sebelumnya
    const savedPreviousView = sessionStorage.getItem("previousView");

    // Tentukan back view: jika sebelumnya ke my-tickets, kembali ke my-tickets
    // Jika zoom-booking/zoom-management, kembali ke situ. Otherwise default ke tickets
    let backView: ViewType = "tickets";
    if (savedPreviousView === "my-tickets") {
      backView = "my-tickets";
    } else if (savedPreviousView === "zoom-booking") {
      backView = "zoom-booking";
    } else if (savedPreviousView === "zoom-management") {
      backView = "zoom-management";
    }

    const path = buildRoute(`/:role/${backView}`, roleParam);
    navigate(path);
  };

  const renderContent = () => {
    // Get active role untuk permission check
    const activeRole = getActiveRole(currentUser.id) || currentUser.role;

    // DEBUG: Log untuk troubleshooting multi-role
    console.log("🎯 MAIN LAYOUT DEBUG:", {
      "getActiveRole()": getActiveRole(currentUser.id),
      "currentUser.role": currentUser.role,
      "currentUser.roles": currentUser.roles,
      "activeRole (final)": activeRole,
      sessionStorage: sessionStorage.getItem(
        `bps_active_role_${currentUser.id}`
      ),
    });

    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onViewTicket={handleViewTicketDetail}
          />
        );

      case "create-ticket-perbaikan":
        return (
          <CreateTicket
            currentUser={currentUser}
            ticketType="perbaikan"
            onTicketCreated={() => {
              setRefreshKey((prev) => prev + 1);
              handleNavigate("my-tickets");
            }}
            onCancel={() => handleNavigate("dashboard")}
          />
        );

      case "create-ticket-zoom":
        return (
          <CreateTicket
            currentUser={currentUser}
            ticketType="zoom_meeting"
            onTicketCreated={() => {
              setRefreshKey((prev) => prev + 1);
              handleNavigate("my-tickets");
            }}
            onCancel={() => handleNavigate("dashboard")}
          />
        );

      case "tickets":
        return (
          <TicketList
            currentUser={currentUser}
            activeRole={activeRole as any}
            viewMode="all"
            onViewTicket={handleViewTicketDetail}
          />
        );

      case "my-tickets":
        return (
          <MyTicketsView
            currentUser={currentUser}
            activeRole={activeRole as any}
            onViewTicket={handleViewTicketDetail}
          />
        );

      case "ticket-detail":
        if (!selectedTicketId) {
          handleNavigate("tickets");
          return null;
        }
        return (
          <TicketDetail
            ticketId={selectedTicketId}
            currentUser={currentUser}
            activeRole={activeRole as any}
            onBack={handleBackToList}
            onNavigate={handleNavigate}
          />
        );

      case "zoom-booking":
        return (
          <ZoomBooking
            currentUser={currentUser}
            isManagement={false}
            onNavigate={handleNavigate}
            onViewTicket={handleViewTicketDetail}
          />
        );

      case "zoom-management":
        // Only Admin Layanan and Super Admin can access Zoom Management
        if (activeRole !== "admin_layanan" && activeRole !== "super_admin") {
          handleNavigate("dashboard");
          return null;
        }
        return (
          <ZoomManagementView
            onNavigate={handleNavigate}
            onViewTicket={handleViewTicketDetail}
          />
        );

      case "users":
        // Only Super Admin can access User Management
        if (activeRole !== "super_admin") {
          handleNavigate("dashboard");
          return null;
        }
        return <UserManagement currentUser={currentUser} />;

      case "bmn-assets":
        // Only Super Admin can access BMN Asset Management
        if (activeRole !== "super_admin") {
          handleNavigate("dashboard");
          return null;
        }
        return <BmnAssetManagement currentUser={currentUser} />;

      case "work-orders":
        // Hanya Teknisi dan Admin Penyedia yang bisa akses Work Order
        if (activeRole === "teknisi") {
          return <TeknisiWorkOrderList currentUser={currentUser} />;
        } else if (
          activeRole === "admin_penyedia" ||
          activeRole === "super_admin"
        ) {
          return <WorkOrderList currentUser={currentUser} />;
        } else {
          // Admin Layanan dan role lain tidak bisa akses Work Order
          handleNavigate("dashboard");
          return null;
        }

      case "reports":
        // Only Super Admin and Admin Penyedia can access Reports
        if (activeRole !== "super_admin" && activeRole !== "admin_penyedia") {
          handleNavigate("dashboard");
          return null;
        }
        return <ReportsView currentUser={currentUser} />;

      case "profile":
      case "settings":
        return (
          <ProfileSettings
            currentUser={currentUser}
            onUserUpdate={onUserUpdate}
            onNavigate={handleNavigate}
          />
        );

      default:
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onViewTicket={handleViewTicketDetail}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen" key={refreshKey}>
      {/* Mobile-only top shadow to separate header from viewport */}
      <div className="relative max-md:shadow-[0_-16px_40px_rgba(15,23,42,0.32)] max-md:z-10">
        {/* Header */}
        <Header
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigate={handleNavigate}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onRoleSwitch={handleRoleSwitch}
        />
      </div>

      <div className="flex flex-1 overflow-hidden max-md:overflow-visible relative bg-blue">
        {/* Sidebar */}
        <Sidebar
          currentUser={currentUser}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Spacer for collapsed sidebar - Hidden on mobile */}
        {sidebarCollapsed && <div className="w-[72px] flex-shrink-0 max-md:hidden" />}

        {/* Main Content with rounded corner */}
        <main className="flex-1 overflow-y-scroll [scrollbar-gutter:stable] bg-[#f1f3f4] rounded-tl-3xl max-md:rounded-tr-3xl max-md:shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <div className="p-6">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};
