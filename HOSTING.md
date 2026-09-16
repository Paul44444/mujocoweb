# Backend hosting switch

The frontend uses Render by default while the Ubuntu computer has no stable
public tunnel. The former `trycloudflare.com` quick tunnel has expired.

```text
https://mujocoweb-backend.onrender.com
```

To make a Vercel deployment use another backend, add this project environment
variable in Vercel and redeploy:

```text
VITE_BACKEND_URL=https://simulation.example.com
```

The built-in default is declared as `DEFAULT_BACKEND_URL` in `src/main.ts`.
Once a permanent tunnel hostname is available, it can become the default.
If a configured GPU backend cannot establish a WebSocket, the frontend retries
once against Render automatically.

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
