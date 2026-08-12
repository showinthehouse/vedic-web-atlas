import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateVedicChart, calculateVedicCompatibility } from "./vedicEngine";
import { resolveCity, searchCities } from "./location";
import * as db from "./db";
import { clearLocalSession, hashPassword, setLocalSession, verifyPassword } from "./localAuth";
import { TRPCError } from "@trpc/server";
import { createPdfReport } from "./pdfReport";

const chartInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  placeName: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.number().min(-14).max(14),
  calendar: z.enum(["GREGORIAN", "JULIAN"]),
  ayanamsa: z.enum(["LAHIRI", "RAMAN", "KP", "TRUE_PUSHYA"]),
  divisionalFactor: z.number().int().min(1).max(300),
});

const profileInput = chartInput.extend({
  label: z.string().trim().min(1).max(120),
  timeZoneId: z.string().max(80).optional(),
  notes: z.string().max(3000).optional(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,48}$/), password: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      if (await db.getUserByUsername(input.username)) throw new TRPCError({ code: "CONFLICT", message: "该用户名已被使用。" });
      const user = await db.createLocalUser(input.username, await hashPassword(input.password));
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "账户创建失败，请稍后再试。" });
      await setLocalSession(ctx.res, user.id);
      return user;
    }),
    login: publicProcedure.input(z.object({ username: z.string().trim().toLowerCase().min(3).max(48), password: z.string().min(1).max(128) })).mutation(async ({ ctx, input }) => {
      const user = await db.getUserByUsername(input.username);
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码不正确。" });
      await db.touchLocalUser(user.id); await setLocalSession(ctx.res, user.id);
      return user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      clearLocalSession(ctx.res);
      return {
        success: true,
      } as const;
    }),
  }),
  astrology: router({
    calculate: publicProcedure
      .input(chartInput)
      .mutation(({ input }) => calculateVedicChart(input)),
    compare: protectedProcedure.input(z.object({ left: chartInput, right: chartInput })).mutation(({ input }) => calculateVedicCompatibility(input.left, input.right)),
  }),
  location: router({
    search: publicProcedure.input(z.object({ query: z.string().trim().min(3).max(120) })).query(({ input }) => searchCities(input.query)),
    resolve: publicProcedure.input(z.object({
      placeId: z.string().min(1),
      queryLabel: z.string().max(180).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      calendar: z.enum(["GREGORIAN", "JULIAN"]),
    })).mutation(({ input }) => resolveCity(input)),
  }),
  reports: router({
    pdf: publicProcedure.input(z.object({ result: z.any(), comparison: z.any().optional() })).mutation(({ input }) => createPdfReport(input)),
  }),
  profiles: router({
    list: protectedProcedure.query(({ ctx }) => db.listBirthProfiles(ctx.user.id)),
    create: protectedProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
      await db.createBirthProfile({
        userId: ctx.user.id,
        label: input.label,
        birthDate: input.date,
        birthTime: input.time,
        calendar: input.calendar,
        placeName: input.placeName,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        timezone: String(input.timezone),
        timeZoneId: input.timeZoneId,
        ayanamsa: input.ayanamsa,
        divisionalFactor: input.divisionalFactor,
        notes: input.notes,
      });
      return db.listBirthProfiles(ctx.user.id);
    }),
    update: protectedProcedure.input(profileInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await db.updateBirthProfile(ctx.user.id, input.id, {
        label: input.label, birthDate: input.date, birthTime: input.time, calendar: input.calendar,
        placeName: input.placeName, latitude: String(input.latitude), longitude: String(input.longitude), timezone: String(input.timezone),
        timeZoneId: input.timeZoneId, ayanamsa: input.ayanamsa, divisionalFactor: input.divisionalFactor, notes: input.notes,
      });
      return db.listBirthProfiles(ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await db.deleteBirthProfile(ctx.user.id, input.id);
      return db.listBirthProfiles(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
