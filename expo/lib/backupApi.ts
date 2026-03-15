const getBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!url) {
    console.warn("[backupApi] EXPO_PUBLIC_RORK_API_BASE_URL is not set");
    return "";
  }
  return url;
};

export interface BackupPayload {
  deviceId: string;
  profile: unknown;
  checkIns: unknown[];
  painEntries: unknown[];
  muscleGroups: unknown[];
  streak: number;
  program: unknown;
}

export interface BackupResponse {
  success: boolean;
  backedUpAt: string;
}

export interface RestoreResponse {
  found: boolean;
  data: (BackupPayload & { backedUpAt: string }) | null;
}

export interface BackupStatusResponse {
  hasBackup: boolean;
  backedUpAt: string | null;
}

export async function saveBackup(payload: BackupPayload): Promise<BackupResponse> {
  const fallback: BackupResponse = { success: false, backedUpAt: new Date().toISOString() };

  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      console.log("[backupApi] Skipping backup - API URL not configured");
      return fallback;
    }

    console.log("[backupApi] Saving backup for device:", payload.deviceId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[backupApi] Save failed:", response.status, errorText);
      return fallback;
    }

    const result = await response.json();
    console.log("[backupApi] Backup saved at:", result.backedUpAt);
    return result as BackupResponse;
  } catch {
    console.log("[backupApi] Backup unavailable (network error) - data is safe locally");
    return fallback;
  }
}

export async function restoreBackup(deviceId: string): Promise<RestoreResponse> {
  const fallback: RestoreResponse = { found: false, data: null };

  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      console.log("[backupApi] Skipping restore - API URL not configured");
      return fallback;
    }

    console.log("[backupApi] Restoring backup for device:", deviceId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/backup/${encodeURIComponent(deviceId)}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[backupApi] Restore failed:", response.status, errorText);
      return fallback;
    }

    const result = await response.json();
    console.log("[backupApi] Restore result - found:", result.found);
    return result as RestoreResponse;
  } catch {
    console.log("[backupApi] Restore unavailable (network error)");
    return fallback;
  }
}

export async function getBackupStatus(deviceId: string): Promise<BackupStatusResponse> {
  const fallback: BackupStatusResponse = { hasBackup: false, backedUpAt: null };

  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      console.log("[backupApi] Skipping status check - API URL not configured");
      return fallback;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/backup/${encodeURIComponent(deviceId)}/status`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallback;
    }

    const result = await response.json();
    return result as BackupStatusResponse;
  } catch {
    console.log("[backupApi] Status check unavailable (network error)");
    return fallback;
  }
}
