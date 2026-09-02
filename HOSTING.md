# Backend hosting switch

The frontend currently uses the Ubuntu computer's Cloudflare tunnel by default.
Render remains available as a fallback:

```text
https://mujocoweb-backend.onrender.com
```

To make a Vercel deployment use another backend, add this project environment
variable in Vercel and redeploy:

```text
VITE_BACKEND_URL=https://simulation.example.com
```

The built-in default is declared as `DEFAULT_BACKEND_URL` in `src/main.ts`.
`RENDER_BACKEND_URL` is kept separately and is not removed.

For a temporary browser-only test, open the deployed frontend once with:

```text
https://mujocoweb.vercel.app/?backend=https%3A%2F%2Fyour-tunnel.example.com
```

That browser remembers the override. Return it to Render with:

```text
https://mujocoweb.vercel.app/?backend=render
```

Return to the built-in local-GPU default with:

```text
https://mujocoweb.vercel.app/?backend=default
```

Only use a backend URL that you control. The public endpoint must use HTTPS;
the frontend automatically converts it to WSS for simulation streaming.
