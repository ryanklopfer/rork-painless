import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

const backupStore = new Map<string, {
  deviceId: string;
  profile: unknown;
  checkIns: unknown[];
  painEntries: unknown[];
  muscleGroups: unknown[];
  streak: number;
  program: unknown;
  backedUpAt: string;
}>();

app.get("/", (c) => {
  return c.json({ status: "ok", message: "RehabFlow API is running" });
});

app.post("/backup", async (c) => {
  try {
    const body = await c.req.json();
    const { deviceId } = body;

    if (!deviceId || typeof deviceId !== "string") {
      return c.json({ error: "deviceId is required" }, 400);
    }

    const backupData = {
      deviceId,
      profile: body.profile ?? null,
      checkIns: body.checkIns ?? [],
      painEntries: body.painEntries ?? [],
      muscleGroups: body.muscleGroups ?? [],
      streak: body.streak ?? 0,
      program: body.program ?? null,
      backedUpAt: new Date().toISOString(),
    };

    console.log("[backup] Saving backup for device:", deviceId);
    backupStore.set(deviceId, backupData);

    return c.json({ success: true, backedUpAt: backupData.backedUpAt });
  } catch (err) {
    console.error("[backup] Error saving backup:", err);
    return c.json({ error: "Failed to save backup" }, 500);
  }
});

app.get("/backup/:deviceId", (c) => {
  const deviceId = c.req.param("deviceId");

  if (!deviceId) {
    return c.json({ error: "deviceId is required" }, 400);
  }

  console.log("[backup] Restoring backup for device:", deviceId);
  const data = backupStore.get(deviceId);

  if (!data) {
    return c.json({ found: false, data: null });
  }

  return c.json({ found: true, data });
});

app.get("/backup/:deviceId/status", (c) => {
  const deviceId = c.req.param("deviceId");

  if (!deviceId) {
    return c.json({ error: "deviceId is required" }, 400);
  }

  const data = backupStore.get(deviceId);

  if (!data) {
    return c.json({ hasBackup: false, backedUpAt: null });
  }

  return c.json({ hasBackup: true, backedUpAt: data.backedUpAt });
});

export default app;
