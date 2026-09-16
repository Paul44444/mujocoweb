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

For a temporary browser-only test, open the deployed frontend once with:

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
