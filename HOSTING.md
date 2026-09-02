# Backend hosting switch

The frontend keeps Render as its built-in fallback:

```text
https://mujocoweb-backend.onrender.com
```

To make a Vercel deployment use another backend, add this project environment
variable in Vercel and redeploy:

```text
VITE_BACKEND_URL=https://simulation.example.com
```

Remove `VITE_BACKEND_URL` and redeploy to switch back to Render. No source-code
change is required.

For a temporary browser-only test, open the deployed frontend once with:

```text
https://mujocoweb.vercel.app/?backend=https%3A%2F%2Fyour-tunnel.example.com
```

That browser remembers the override. Return it to Render with:

```text
https://mujocoweb.vercel.app/?backend=render
```

Only use a backend URL that you control. The public endpoint must use HTTPS;
the frontend automatically converts it to WSS for simulation streaming.
