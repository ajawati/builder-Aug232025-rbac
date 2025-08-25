import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { insertUserSchema, insertProjectSchema, insertMcpServerSchema, insertChatMessageSchema } from "@shared/schema";
import { requirePermission } from "./permissions-middleware";
import { PERMISSIONS } from "@shared/permissions";

// Placeholder authentication middleware (replace with real auth in production)
import { storage } from "./storage";
// Simulated auth middleware: reads user ID from Authorization header and attaches user
async function fakeAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (authHeader && typeof authHeader === "string") {
    const userId = authHeader.replace("Bearer ", "");
    const user = await storage.getUser(userId);
    if (user) {
      req.user = user;
    }
  }
  next();
}

// Simple persona-based rate limiting middleware (in-memory, dev only)
function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // limits per minute
  const limits: Record<string, number> = {
    super_admin: Infinity,
    builder: 120,
    end_user: 60,
    anonymous: 30,
  };

  const key = req.headers["authorization"] ? String(req.headers["authorization"]).replace("Bearer ", "") : req.ip || "anon";
  // attach a map to process for simplicity
  const store = (global as any).__rateLimitStore || ((global as any).__rateLimitStore = new Map<string, { count: number; resetAt: number; persona: string }>());

  const now = Date.now();
  const entry = store.get(key);
  // determine persona for limit selection
  const persona = (req as any).user?.persona || "anonymous";
  const limit = limits[persona] ?? limits.anonymous;

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + 60_000, persona });
    return next();
  }

  if (entry.count >= limit) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  entry.count += 1;
  store.set(key, entry);
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Attach fake auth middleware globally (replace with real auth in production)
  app.use((req, res, next) => fakeAuth(req, res, next));
  // Attach simple persona-based rate limiter to /api
  app.use('/api', rateLimitMiddleware);
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      // Return a fake token (user ID) and user info (without password)
      res.json({
        token: user.id,
        user: { ...user, password: undefined },
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const user = (req as any).user;
      // if no auth attached, still accept userId query for backward compat
      const userId = user?.id || (req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      if (user?.persona === "super_admin") {
        const all = await storage.getAllProjects();
        return res.json(all);
      }

      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requirePermission(PERMISSIONS.CREATE_PROJECTS), async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      // Attach owner and tenant based on authenticated user when available
      const user = (req as any).user;
      const payload = { ...validatedData } as any;
      if (user) {
        payload.userId = user.id;
        if (user.tenant) payload.tenant = user.tenant;
      }
      const project = await storage.createProject(payload);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = (req as any).user;

      // If not super_admin, enforce ownership when updating
      if (user?.persona !== "super_admin") {
        const existing = await storage.getProject(req.params.id);
        if (!existing) return res.status(404).json({ error: "Project not found" });
        if (existing.userId !== user.id) return res.status(403).json({ error: "Forbidden" });
      }

      const project = await storage.updateProject(req.params.id, updates);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // MCP Server routes
  app.get("/api/mcp-servers", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.id || (req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      if (user?.persona === "super_admin") {
        const all = await storage.getAllMcpServers();
        return res.json(all);
      }

      const servers = await storage.getMcpServers(userId);
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MCP servers" });
    }
  });

  app.post("/api/mcp-servers", requirePermission(PERMISSIONS.CREATE_PROJECTS), async (req, res) => {
    try {
      const validatedData = insertMcpServerSchema.parse(req.body);
      const user = (req as any).user;
      const payload = { ...validatedData } as any;
      if (user) {
        payload.userId = user.id;
        if (user.tenant) payload.tenant = user.tenant;
      }
      const server = await storage.createMcpServer(payload);
      res.status(201).json(server);
    } catch (error) {
      res.status(400).json({ error: "Invalid server data" });
    }
  });

  app.put("/api/mcp-servers/:id", requirePermission(PERMISSIONS.EDIT_PROJECTS), async (req, res) => {
    try {
      const updates = req.body;
      const user = (req as any).user;

      // enforce ownership for non-super_admins
      if (user?.persona !== "super_admin") {
        const existing = await storage.getMcpServer(req.params.id);
        if (!existing) return res.status(404).json({ error: "Server not found" });
        if (existing.userId !== user.id) return res.status(403).json({ error: "Forbidden" });
      }

      const server = await storage.updateMcpServer(req.params.id, updates);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ error: "Failed to update server" });
    }
  });

  app.delete("/api/mcp-servers/:id", requirePermission(PERMISSIONS.DELETE_PROJECTS), async (req, res) => {
    try {
      const deleted = await storage.deleteMcpServer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete server" });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);

      // Simulate AI response for user messages
      if (validatedData.sender === "user") {
        setTimeout(async () => {
          const aiResponses = [
            "I'll help you build that application. Let me analyze your requirements and suggest the best approach with the right MCP servers and components.",
            "Great idea! I can create a app for you. Would you like me to start with the core functionality or focus on specific features first?",
            "Perfect! I'll design an application that meets your needs. Let me recommend the optimal tech stack and MCP server configuration for this project.",
            "I can create a app for you that tracks user analytics. Let me understand your requirements:\n\n**What specific metrics do you want to track?**\n• Real-time engagement metrics and revenue tracking\n• User activity, engagement rates, revenue visualization\n• Conversion analysis and funnel metrics\n• Performance benchmarks and growth indicators\n\nShall I start building the dashboard structure with these features?"
          ];

          const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
          await storage.createChatMessage({
            userId: validatedData.userId,
            sender: "ai",
            message: randomResponse
          });
        }, 1000);
      }

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated via admin panel
      const { password, ...safeUpdates } = updates;

      const updatedUser = await storage.updateUser(id, safeUpdates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deletion of demo user
      if (id === "demo-user-id") {
        return res.status(403).json({ error: "Cannot delete demo user" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Marketplace routes
  app.get("/api/marketplace", async (req, res) => {
    try {
      const apps = await storage.getMarketplaceApps();
      res.json(apps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketplace apps" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
