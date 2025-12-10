import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { ScrollArea } from "./ui/scroll-area";
import {
  Home,
  TicketIcon,
  Wrench,
  Video,
  Users,
  BarChart3,
  FolderKanban,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { User } from "@/types";
import type { ViewType } from "./main-layout";
import { getActiveRole } from "@/lib/storage";

interface SidebarProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  roles: string[];
  submenu?: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onNavigate,
  collapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  /* Responsive Logic with max-md preference */
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // 768px matches Tailwind 'md'
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getViewFromPath = (): ViewType => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2) {
      const menu = pathParts[1];
      if (menu.startsWith("ticket-detail")) return "ticket-detail";
      return menu as ViewType;
    }
    return "dashboard" as ViewType;
  };

  const currentView = getViewFromPath();
  const activeRole = getActiveRole(currentUser.id) || currentUser.role;
  const menuItems = getMenuItemsForRole(activeRole as any);

  const showExpanded = !collapsed || isHovered;

  const targetWidth = isMobile
    ? (collapsed ? 0 : "90vw")
    : (showExpanded ? 260 : 72);

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <AnimatePresence>
        {
          isMobile && !collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onToggleCollapse}
              className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm md:hidden"
            />
          )
        }
      </AnimatePresence >

      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (collapsed ? -500 : 0) : 0,
          width: isMobile ? "90vw" : targetWidth,
        }}
        transition={{
          type: "tween",
          duration: isMobile ? (collapsed ? 0.3 : 0.5) : 0.25,
          ease: isMobile ? "easeInOut" : "easeInOut",
        }}
        className={`
          flex flex-col bg-white
          
          // Base (Desktop) Styles
          ${!collapsed ? "md:relative md:h-full" : "md:absolute md:left-0 md:top-0 md:bottom-0 md:z-40"}
          md:overflow-hidden
          
          // Mobile Override Styles (max-md)
          max-md:fixed max-md:top-0 max-md:bottom-0 max-md:left-0 max-md:z-[100] max-md:h-screen
          max-md:shadow-2xl max-md:will-change-transform
        `}
        onMouseEnter={() => !isMobile && collapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          boxShadow: !isMobile && collapsed && isHovered ? "4px 0 12px rgba(0,0,0,0.08)" : undefined
        }}
      >
{/* Mobile Close Button */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 h-[72px] bg-blue-50 md:hidden border-b border-gray-100">
            <span className="font-bold text-xl">Sigap-ti</span>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-full hover:bg-gray-100/80 text-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        )}

        <ScrollArea className="flex-1 py-3 px-3">
          <nav className={`flex flex-col gap-2 ${isMobile ? "max-md:pt-2" : ""}`}>
            {menuItems.map((item, index) => (
              <SidebarMenuItem
                key={item.id}
                item={item}
                currentView={currentView}
                showExpanded={showExpanded || (isMobile && !collapsed)}
                onClick={() => {
                  onNavigate(item.id);
                  if (isMobile) onToggleCollapse();
                }}
                index={index}
                isMobile={isMobile}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </ScrollArea>
      </motion.aside>
    </>
  );
};

// Menu Item Component
interface SidebarMenuItemProps {
  item: MenuItem;
  currentView: ViewType;
  showExpanded: boolean;
  onClick: () => void;
  index: number;
  isMobile: boolean;
  collapsed: boolean;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  currentView,
  showExpanded,
  onClick,
  index,
  isMobile,
  collapsed,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const isActive = currentView === item.id;
  const Icon = item.icon;

  // Background styles - only show button effect for active or collapsed state
  const getBackground = () => {
    if (isActive) {
      return isHovered
        ? "radial-gradient(ellipse at center, #cceaff 0%, #b5dff8 60%, #a0d4f0 100%)"
        : "radial-gradient(ellipse at center, #d8f0ff 0%, #C2E7FF 60%, #b5e0fc 100%)";
    }
    // Inactive: only show effect when collapsed OR hovered
    if (!showExpanded) {
      return isHovered
        ? "radial-gradient(ellipse at center, rgba(245,247,250,1) 0%, rgba(235,238,242,0.9) 60%, rgba(225,228,232,0.7) 100%)"
        : "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(248,249,251,0.7) 60%, rgba(240,242,245,0.5) 100%)";
    }
    // Expanded + inactive: transparent unless hovered
    return isHovered
      ? "radial-gradient(ellipse at center, rgba(245,247,250,0.8) 0%, rgba(235,238,242,0.6) 60%, rgba(225,228,232,0.4) 100%)"
      : "transparent";
  };

  const getBoxShadow = () => {
    if (isActive) {
      return isHovered
        ? "inset 0 0 10px rgba(255,255,255,0.95), inset 0 0 3px rgba(100,180,230,0.4), 0 0 2px rgba(0,0,0,0.12)"
        : "inset 0 0 8px rgba(255,255,255,0.9), inset 0 0 2px rgba(100,180,230,0.3), 0 0 1px rgba(0,0,0,0.1)";
    }
    // Inactive: only show shadow when collapsed OR hovered
    if (!showExpanded) {
      return isHovered
        ? "inset 0 0 8px rgba(255,255,255,0.9), inset 0 0 2px rgba(0,0,0,0.04)"
        : "inset 0 0 6px rgba(255,255,255,0.8), inset 0 0 1px rgba(0,0,0,0.02)";
    }
    // Expanded + inactive: no shadow unless hovered
    return isHovered
      ? "inset 0 0 6px rgba(255,255,255,0.7), inset 0 0 1px rgba(0,0,0,0.02)"
      : "none";
  };

  const getBorder = () => {
    if (isActive) {
      return isHovered
        ? "1px solid rgba(140,200,235,0.7)"
        : "1px solid rgba(160,210,240,0.6)";
    }
    // Inactive: only show border when collapsed OR hovered
    if (!showExpanded) {
      return isHovered
        ? "1px solid rgba(190,195,200,0.5)"
        : "1px solid rgba(210,215,220,0.4)";
    }
    // Expanded + inactive: no border unless hovered
    return isHovered
      ? "1px solid rgba(200,205,210,0.3)"
      : "1px solid transparent";
  };

  // Icon position is absolutely fixed - never moves
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-12 flex items-center m-0 p-0 relative max-md:justify-start max-md:px-4"
    >
      {/* Icon container - absolute on desktop, relative flex on mobile */}
      <div className="absolute left-3 flex items-center justify-center w-6 h-6 z-10 max-md:static max-md:mr-3 max-md:flex-shrink-0">
        <Icon
          className={`h-5 w-5 max-md:h-6 max-md:w-6 ${isActive ? "text-[#001D35]" : isHovered ? "text-[#3c4043]" : "text-[#5F6368]"
            }`}
          strokeWidth={isActive ? 2.5 : 2}
          fill="none"
        />
      </div>

      {/* Pill background - 3D button effect with uniform light from all sides */}
      <div
        className={`
          rounded-full cursor-pointer overflow-hidden
          ${showExpanded ? "w-full h-full" : "w-12 h-8"}
          max-md:w-full max-md:h-full max-md:rounded-lg
          ${isMobile && !collapsed ? 'transition-none' : 'transition-all duration-200 ease-out'}
        `}
        style={{
          background: getBackground(),
          boxShadow: getBoxShadow(),
          border: getBorder(),
        }}
      />

      {/* Label - positioned after icon, only when expanded */}
      {showExpanded && (
        <span
          className={`absolute left-12 text-[14px] whitespace-nowrap font-medium z-10 max-md:static max-md:text-base max-md:flex-1 ${isActive ? "text-[#001D35]" : isHovered ? "text-[#1a1a1a]" : "text-[#1F1F1F]"
            } ${isMobile && !collapsed ? '' : 'transition-colors duration-150'}`}
        >
          {item.label}
        </span>
      )}
    </button>
  );
};

type UserRole =
  | "super_admin"
  | "admin_layanan"
  | "admin_penyedia"
  | "teknisi"
  | "pegawai";

const getMenuItemsForRole = (role: UserRole): MenuItem[] => {
  // Define menu items based on roles
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      roles: [
        "super_admin",
        "admin_layanan",
        "admin_penyedia",
        "teknisi",
        "pegawai",
      ],
    },
    {
      id: "create-ticket-perbaikan",
      label: "Perbaikan Barang",
      icon: Wrench,
      roles: ["pegawai"],
    },
    {
      id: "zoom-booking",
      label: "Booking Zoom",
      icon: Video,
      roles: ["pegawai"],
    },
    {
      id: "my-tickets",
      label: "Tiket Saya",
      icon: TicketIcon,
      roles: ["pegawai", "teknisi"],
    },
    {
      id: "tickets",
      label: "Kelola Tiket",
      icon: TicketIcon,
      roles: ["super_admin", "admin_layanan", "admin_penyedia"],
    },
    {
      id: "zoom-management",
      label: "Kelola Zoom",
      icon: Video,
      roles: ["admin_layanan", "super_admin"],
    },
    {
      id: "work-orders",
      label: "Work Order",
      icon: FolderKanban,
      roles: ["admin_penyedia", "teknisi"],
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      roles: ["super_admin"],
    },
    {
      id: "bmn-assets",
      label: "Asset BMN",
      icon: Package,
      roles: ["super_admin"],
    },
    {
      id: "reports",
      label: "Kartu Kendali",
      icon: BarChart3,
      roles: ["super_admin", "admin_penyedia"],
    },
  ];

  // Filter menu items based on user role
  return menuItems.filter((item) => item.roles.includes(role));
};
