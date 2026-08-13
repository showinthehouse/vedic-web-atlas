/**
 * Selects the Python executable used by all server-side astronomy helpers.
 * CI can set PYTHON_BIN=python so child processes use the same interpreter
 * that receives pip-installed dependencies from actions/setup-python.
 */
export function getPythonExecutable(env: NodeJS.ProcessEnv = process.env) {
  return env.PYTHON_BIN?.trim() || "python3";
}
