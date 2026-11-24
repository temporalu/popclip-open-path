// #popclip
// identifier: com.temporalu.popclip.open-path
// name: Open Path
// icon: symbol:folder
// popclipVersion: 6285
// entitlements: [script]
// requirements: [path]
// description: Open the selected macOS path in Finder, or hold ⇧ Shift while clicking to open a new iTerm2 (preferred) or Terminal window at that path.
// keywords: finder terminal iterm open path folder

/**
 * Whether a path should be treated as a directory for opening purposes.
 * App bundles are technically directories, but opening them in Finder
 * should reveal them, and a terminal should not cd into them.
 */
function treatAsDirectory(path: string, isDirOnDisk: boolean): boolean {
  return isDirOnDisk && !path.endsWith(".app");
}

/** Whether the given path is a directory on disk (read-only check). */
async function isDirectory(path: string): Promise<boolean> {
  const out = await $`if [ -d ${path} ]; then echo dir; else echo file; fi`;
  return `${out}`.trim() === "dir";
}

/**
 * The `path` requirement already hands us an absolute path with `~` and
 * `..` expanded; just drop stray whitespace and wrapping quotes.
 */
function cleanPath(raw: string): string {
  return raw.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
}

/** Parent directory of a path; handles trailing slashes and the filesystem root. */
function parentDirectory(path: string): string {
  const i = path.replace(/\/+$/, "").lastIndexOf("/");
  return i <= 0 ? "/" : path.slice(0, i);
}

// AppleScript: open a new iTerm2 window at the path if iTerm2 is installed,
// otherwise report "terminal" so the caller can fall back to Terminal.app.
const openTerminalScript = `
on openPath(thePath)
	if exists (application id "com.googlecode.iterm2") then
		tell application id "com.googlecode.iterm2"
			create window with default profile
			tell current session of current window
				write text "cd " & quoted form of thePath
			end tell
			activate
		end tell
		return "iterm2"
	end if
	return "terminal"
end openPath`;

/**
 * Open a new terminal window at the path: iTerm2 if installed, otherwise
 * Terminal.app. If iTerm2 scripting fails (e.g. automation permission
 * denied), fall back to Terminal via `open`, which needs no permission.
 */
async function openTerminalAt(path: string): Promise<void> {
  try {
    const used = await popclip.runAppleScript(openTerminalScript, {
      handler: "openPath",
      parameters: [path],
    });
    if (`${used}` !== "iterm2") {
      await $`open -a Terminal ${path}`;
    }
  } catch (error) {
    await $`open -a Terminal ${path}`;
  }
}

defineExtension({
  action: async (input) => {
    const path = cleanPath(input.matchedText);
    const isDir = treatAsDirectory(path, await isDirectory(path));
    if (popclip.modifiers.shift) {
      await openTerminalAt(isDir ? path : parentDirectory(path));
    } else if (isDir) {
      await $`open ${path}`;
    } else {
      await $`open -R ${path}`; // reveal and select in Finder
    }
  },
  test: async () => {
    let failures = 0;
    const check = (label: string, actual: unknown, expected: unknown) => {
      const ok = actual === expected;
      if (!ok) failures++;
      print(`${ok ? "ok  " : "FAIL"} ${label}`);
    };
    // pure decision logic
    check("directory is a directory", treatAsDirectory("/Users/me/Projects", true), true);
    check("file is not a directory", treatAsDirectory("/etc/hosts", false), false);
    check("app bundle is not a directory", treatAsDirectory("/Applications/Safari.app", true), false);
    check("parent of a file", parentDirectory("/Users/me/notes.md"), "/Users/me");
    check("parent at filesystem root", parentDirectory("/single"), "/");
    check("parent of a path with trailing slash", parentDirectory("/tmp/"), "/");
    check("cleanPath trims whitespace", cleanPath("  /tmp\n"), "/tmp");
    check("cleanPath strips quotes", cleanPath('"/Library/Application Support"'), "/Library/Application Support");
    // read-only filesystem probes through the same shell path the action uses
    check("isDirectory /tmp", await isDirectory("/tmp"), true);
    check("isDirectory /etc/hosts", await isDirectory("/etc/hosts"), false);
    check("isDirectory path with spaces", await isDirectory("/Library/Application Support"), true);
    if (failures > 0) throw new Error(`${failures} test(s) failed`);
    print("all tests passed");
  },
});
