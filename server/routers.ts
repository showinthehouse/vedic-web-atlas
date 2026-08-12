import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateVedicChart } from "./vedicEngine";

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
  astrology: router({
    calculate: publicProcedure
      .input(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          time: z.string().regex(/^\d{2}:\d{2}$/),
          placeName: z.string().min(1).max(120),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          timezone: z.number().min(-14).max(14),
          calendar: z.enum(["GREGORIAN", "JULIAN"]),
          ayanamsa: z.enum(["LAHIRI", "RAMAN", "KP", "TRUE_PUSHYA"]),
          divisionalFactor: z.number().int().min(1).max(300),
        })
      )
      .mutation(({ input }) => calculateVedicChart(input)),
  }),
});

export type AppRouter = typeof appRouter;
