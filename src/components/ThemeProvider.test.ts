import assert from "node:assert/strict";
import test from "node:test";

import { getThemeClasses } from "./ThemeProvider";

test("light theme remains light and not dark", () => {
  assert.deepEqual(getThemeClasses("dark"), {
    dark: true,
    light: false,
    bright: false,
  });

  assert.deepEqual(getThemeClasses("light"), {
    dark: false,
    light: true,
    bright: false,
  });

  assert.deepEqual(getThemeClasses("bright"), {
    dark: false,
    light: false,
    bright: true,
  });
});
