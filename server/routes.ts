import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import tenantRoutes from "./routes/tenants";
import documentRoutes from "./routes/documents";
import reportRoutes from "./routes/reports";
import roomRoutes from "./routes/rooms";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use("/api/auth", authRoutes);
  
  // Main application routes
  app.use("/api/properties", propertyRoutes);
  app.use("/api/tenants", tenantRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/rooms", roomRoutes);

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
