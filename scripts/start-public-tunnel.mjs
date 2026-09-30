import { spawn } from "node:child_process";
import { join } from "node:path";

const ngrokExecutable = process.platform === "win32" && process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Links", "ngrok.exe")
  : "ngrok";
const ngrokDomain = process.env.NGROK_DOMAIN;

if (!ngrokDomain) {
  console.error("Set NGROK_DOMAIN to your reserved ngrok domain before starting the public webhook tunnel.");
  process.exit(1);
}

const tunnel = spawn(ngrokExecutable, ["http", `--url=${ngrokDomain}`, "3001"], {
  stdio: ["inherit", "pipe", "pipe"],
  windowsHide: true,
});

let errorOutput = "";

tunnel.stdout.on("data", (chunk) => process.stdout.write(chunk));
tunnel.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  errorOutput += text;
  process.stderr.write(text);
});

tunnel.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

tunnel.on("close", (code) => {
  if (errorOutput.includes("ERR_NGROK_334")) {
    console.log("ngrok endpoint is already online; using the existing public tunnel.");
    setInterval(() => {}, 2 ** 31 - 1);
    return;
  }

  process.exit(code ?? 1);
});
