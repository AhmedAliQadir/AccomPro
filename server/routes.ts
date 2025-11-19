import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import tenantRoutes from "./routes/tenants";
import documentRoutes from "./routes/documents";
import reportRoutes from "./routes/reports";
import roomRoutes from "./routes/rooms";
import staffRoutes from "./routes/staff";
import incidentsRoutes from "./routes/incidents";
import complianceRoutes from "./routes/compliance";
import supportNotesRoutes from "./routes/support-notes";
import organizationsRoutes from "./routes/organizations";
import organizationSettingsRoutes from "./routes/organization-settings";
import adminRoutes from "./routes/admin";
import supportDashboardRoutes from "./routes/support-dashboard";
import usersRoutes from "./routes/users";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use("/api/auth", authRoutes);
  
  // Platform admin routes
  app.use("/api/organizations", organizationsRoutes);
  app.use("/api/organization", organizationSettingsRoutes);
  app.use("/api/admin", adminRoutes);
  
  // Main application routes
  app.use("/api/properties", propertyRoutes);
  app.use("/api/tenants", tenantRoutes);
  app.use("/api/tenancies", tenantRoutes); // Mount tenancy routes separately
  app.use("/api/documents", documentRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/users", usersRoutes);
  
  // Multi-tenant feature routes
  app.use("/api/staff", staffRoutes);
  app.use("/api/incidents", incidentsRoutes);
  app.use("/api/compliance", complianceRoutes);
  app.use("/api/support-notes", supportNotesRoutes);
  app.use("/api/support", supportDashboardRoutes);

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
