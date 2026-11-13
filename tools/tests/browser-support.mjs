import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

export async function startServer(port) {
  mkdirSync('tools/preview', { recursive: true });
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '', spawnError;
  server.stdout.on('data', chunk => { output += chunk.toString(); });
  server.stderr.on('data', chunk => { output += chunk.toString(); });
  server.once('error', error => { spawnError = error; });
  try {
    // CI can color or redirect Vite's startup message. Check the actual HTTP
    // endpoint instead of relying on terminal formatting or a particular stream.
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null) throw new Error(`Vite exited (${server.exitCode}): ${output}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000) });
        await response.arrayBuffer();
        if (response.ok) return server;
      } catch { /* The server is still starting. */ }
      await delay(100);
    }
    throw new Error(`Vite startup timed out: ${output}`);
  } catch (error) {
    server.kill();
    throw error;
  }
}

export function launchBrowser() {
  return chromium.launch({
    // CI uses Playwright's pinned Chromium; CHROME_PATH is an optional local override.
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
}
