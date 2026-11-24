import { cookies } from "next/headers";

export type DemoRole = "MANAGER" | "TENANT";

export interface DomoraSession {
  role: DemoRole;
  tenantId: string | null;
  displayName: string;
}

export const DEFAULT_DEMO_TENANT_EMAIL = "elena.vance@domora.demo";

export async function getServerSession(): Promise<DomoraSession> {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("domora_role")?.value;
  const tenantIdCookie = cookieStore.get("domora_tenant_id")?.value ?? null;

  if (roleCookie === "TENANT" && tenantIdCookie) {
    return {
      role: "TENANT",
      tenantId: tenantIdCookie,
      displayName: "Tenant Portal (Demo)",
    };
  }

  return {
    role: "MANAGER",
    tenantId: null,
    displayName: "Claire Moreau — Portfolio Manager",
  };
}

export async function requireManagerSession(): Promise<DomoraSession> {
  const session = await getServerSession();
  if (session.role !== "MANAGER") {
    throw new AuthorizationError(
      "Manager authorization required for this operation."
    );
  }
  return session;
}

export async function assertTenantOrManagerAccess(
  targetTenantId: string | null | undefined
): Promise<DomoraSession> {
  const session = await getServerSession();
  if (session.role === "MANAGER") {
    return session;
  }
  if (!targetTenantId || session.tenantId !== targetTenantId) {
    throw new AuthorizationError(
      "Tenants may only access their own unit, lease, payment, and maintenance records."
    );
  }
  return session;
}

export class AuthorizationError extends Error {
  public readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
