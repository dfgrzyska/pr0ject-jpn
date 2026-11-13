import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

export async function startServer(port) {
  mkdirSync('tools/preview', { recursive: true });
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error(`Vite startup timed out: ${output}`)), 15000);
      const fail = error => { clearTimeout(timeout); reject(error); };
      server.stdout.on('data', chunk => {
        output += chunk.toString();
        if (output.includes('Local:')) { clearTimeout(timeout); resolve(); }
      });
      server.stderr.on('data', chunk => { output += chunk.toString(); });
      server.once('exit', code => fail(new Error(`Vite exited (${code}): ${output}`)));
      server.once('error', fail);
    });
    return server;
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
