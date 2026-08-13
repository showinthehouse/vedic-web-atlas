import { describe, expect, it } from "vitest";
import { getPythonExecutable } from "./pythonRuntime";

describe("Python runtime selection", () => {
  it("uses python3 by default for local and container compatibility", () => {
    expect(getPythonExecutable({})).toBe("python3");
  });

  it("uses the explicitly configured interpreter for CI parity", () => {
    expect(getPythonExecutable({ PYTHON_BIN: "python" })).toBe("python");
    expect(getPythonExecutable({ PYTHON_BIN: "  /opt/python/bin/python  " })).toBe("/opt/python/bin/python");
  });
});
