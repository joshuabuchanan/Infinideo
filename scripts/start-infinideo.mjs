import net from "node:net";
import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = 3001;
const appDirectory = fileURLToPath(new URL("..", import.meta.url));
const privateLanAddress = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .find(({ address, family, internal }) =>
    family === "IPv4" &&
    !internal &&
    !address.startsWith("169.254.") &&
    (/^10\./.test(address) || /^192\.168\./.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address)),
  )?.address;

function printAddresses() {
  console.log(`Local: http://localhost:${port}`);
  if (privateLanAddress) {
    console.log(`Network: http://${privateLanAddress}:${port}`);
  } else {
    console.log(`Network: no private LAN IPv4 detected; use localhost on this PC (server listens on all interfaces)`);
  }
}

function keepAlive() {
  setInterval(() => {}, 2 ** 31 - 1);
}

const probe = net.createConnection({ host: "127.0.0.1", port });

probe.once("connect", () => {
  probe.destroy();
  console.log(`Infinideo is already running on port ${port}; reusing it.`);
  printAddresses();
  keepAlive();
});

probe.once("error", () => {
  const server = spawn("bun", ["run", "dev", "--", "--port", String(port)], {
    cwd: appDirectory,
    stdio: "inherit",
    windowsHide: true,
  });

  printAddresses();

  server.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });

  server.on("close", (code) => process.exit(code ?? 1));
});
