# Backend hosting switch

The frontend reads the currently published backend from `public/backend.json`
when a simulation starts. The Ubuntu computer publishes its temporary Quick
Tunnel address there. If that tunnel cannot connect, the frontend retries via
Render:

```text
https://mujocoweb-backend.onrender.com
```

As a build-time override, you can set this project environment variable in
Vercel and redeploy:

```text
VITE_BACKEND_URL=https://simulation.example.com
```

The built-in fallback is declared as `DEFAULT_BACKEND_URL` in `src/main.ts`.
The published `backend.json` URL takes precedence over that build-time default;
an explicit browser override takes precedence over both. If the configured
GPU backend cannot establish a WebSocket, the frontend retries once against
Render automatically.

The normal Vercel URL reads `public/backend.json` when starting a simulation.
To publish a new Quick Tunnel URL for all visitors, run this from the frontend
repository after starting the tunnel:

```bash
./scripts/publish-quick-tunnel.sh https://your-tunnel.trycloudflare.com
```

This commits and pushes only `public/backend.json`; Vercel must be connected to
the GitHub repository and finish deploying before visitors receive the new URL.
Git push credentials must be available on this machine. The URL changes each
time a Quick Tunnel restarts, so repeat the command after every restart.
Render remains the fallback if the published tunnel is unreachable.

For a temporary browser-only override, open the deployed frontend once with:

```text
https://mujocoweb.vercel.app/?backend=https%3A%2F%2Fyour-tunnel.example.com
```

That browser remembers the override. Return it to Render with:

```text
https://mujocoweb.vercel.app/?backend=render
```

Return to the built-in default with:

```text
https://mujocoweb.vercel.app/?backend=default
```

Only use a backend URL that you control. The public endpoint must use HTTPS;
the frontend automatically converts it to WSS for simulation streaming.

## Temporary GPU test on this Ubuntu PC

On this computer, the backend and Quick Tunnel are installed as user-level
systemd services. They start at user login and the tunnel service automatically
publishes its new URL to GitHub when it restarts. Vercel then redeploys the
frontend; no browser-specific URL is needed. Check them with:

```bash
systemctl --user status mujocoweb-backend mujocoweb-quick-tunnel
journalctl --user -u mujocoweb-quick-tunnel -f
```

User services do not start before login unless systemd lingering is enabled.
That requires administrator access and is not configured here. Keep the PC
awake and logged in for this temporary test. Publishing also depends on Git
push access from this PC and a successful Vercel deployment.

For manual startup or troubleshooting:

The backend source is in `/home/paul/PycharmProjects/dapg`. Its `run-local.sh`
starts the server on `127.0.0.1:8000` with GPU rendering by default. In one
terminal, run:

```bash
cd /home/paul/PycharmProjects/dapg
./run-local.sh
```

Check `http://127.0.0.1:8000/` locally. In a second terminal, run:

```bash
cd /home/paul/WebstormProjects/mujocoweb
./cloudflared-linux-amd64 tunnel --url http://127.0.0.1:8000
```

The official Linux `cloudflared` binary is installed locally in this checkout
and ignored by Git. On another computer, install it from Cloudflare's official
Linux downloads. Publish the generated
`https://...trycloudflare.com` address using the script above, or use a
browser-only override without redeploying. Leave both processes running. If
the tunnel restarts, publish its new address. If the GPU backend is unavailable,
the frontend falls back to Render for the simulation connection.

This is a development-only, public, unauthenticated endpoint. Do not put
secrets in the URL. The image stream can use significant bandwidth, and
Cloudflare's delivery rules should be checked before treating this as a
permanent hosting solution.
