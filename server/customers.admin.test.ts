import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as customerDb from "./db";
import type { Customer } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listCustomers: vi.fn(),
    createCustomer: vi.fn(),
  };
});

function makeContext(role: "user" | "admin" | null): TrpcContext {
  const now = new Date();
  return {
    user: role
      ? {
          id: 1,
          openId: "authorization-test-user",
          name: "Authorization Test",
          email: "authorization-test@example.com",
          loginMethod: "test",
          role,
          createdAt: now,
          updatedAt: now,
          lastSignedIn: now,
        }
      : null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const sampleCustomer = {
  customerId: "CUST-TEST",
  name: "Sample Customer",
  status: "active" as const,
};

describe("customer admin access control", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects anonymous users from listing customer records", async () => {
    const caller = appRouter.createCaller(makeContext(null));
    await expect(caller.customers.list({ search: "" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(customerDb.listCustomers).not.toHaveBeenCalled();
  });

  it("rejects signed-in non-admin users from listing customer records", async () => {
    const caller = appRouter.createCaller(makeContext("user"));
    await expect(caller.customers.list({ search: "" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(customerDb.listCustomers).not.toHaveBeenCalled();
  });

  it("lets administrators query the customer directory", async () => {
    vi.mocked(customerDb.listCustomers).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.customers.list({ search: "Mira" })).resolves.toEqual([]);
    expect(customerDb.listCustomers).toHaveBeenCalledWith("Mira");
  });

  it("rejects anonymous users from creating customer records", async () => {
    const caller = appRouter.createCaller(makeContext(null));
    await expect(caller.customers.create(sampleCustomer)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(customerDb.createCustomer).not.toHaveBeenCalled();
  });

  it("rejects signed-in non-admin users from creating customer records", async () => {
    const caller = appRouter.createCaller(makeContext("user"));
    await expect(caller.customers.create(sampleCustomer)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(customerDb.createCustomer).not.toHaveBeenCalled();
  });

  it("lets administrators create non-secret contact records", async () => {
    const now = new Date();
    const created: Customer = {
      id: 1,
      ...sampleCustomer,
      email: null,
      phone: null,
      createdAt: now,
      updatedAt: now,
    };
    vi.mocked(customerDb.createCustomer).mockResolvedValue(created);
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.customers.create(sampleCustomer)).resolves.toEqual(created);
    expect(customerDb.createCustomer).toHaveBeenCalledWith(sampleCustomer);
  });
});
