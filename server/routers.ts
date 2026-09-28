import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const customerAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access required." });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  customers: router({
    list: customerAdminProcedure
      .input(z.object({ search: z.string().trim().max(120).default("") }))
      .query(({ input }) => db.listCustomers(input.search)),
    create: customerAdminProcedure
      .input(
        z.object({
          customerId: z.string().trim().min(1).max(64),
          name: z.string().trim().min(1).max(255),
          email: z.string().trim().email().max(320).optional(),
          phone: z.string().trim().max(32).optional(),
          status: z.enum(["active", "inactive", "pending"]).default("active"),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await db.createCustomer(input);
        } catch (error) {
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ER_DUP_ENTRY"
          ) {
            throw new TRPCError({ code: "CONFLICT", message: "That customer ID already exists." });
          }
          console.error("[Customers] Failed to create customer record", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save the customer record." });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
