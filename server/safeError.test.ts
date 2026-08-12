import { describe, expect, it } from "vitest";
import { toSafeChineseActionError } from "../client/src/lib/safeError";

describe("toSafeChineseActionError", () => {
  it("preserves a server-provided Chinese safe message", () => {
    expect(toSafeChineseActionError(new Error("PDF 导出服务暂时不可用，请稍后重试。"), "后备提示")).toBe("PDF 导出服务暂时不可用，请稍后重试。");
  });

  it("replaces raw English transport messages with the operation-specific fallback", () => {
    expect(toSafeChineseActionError(new Error("simulated offline"), "PDF 导出未完成，请检查网络连接后重试。")).toBe("PDF 导出未完成，请检查网络连接后重试。");
  });

  it("uses the fallback for unexpected non-error values", () => {
    expect(toSafeChineseActionError({ code: "ETIMEDOUT" }, "档案操作未完成，请稍后重试。")).toBe("档案操作未完成，请稍后重试。");
  });
});
