# MuJoCo simulation and scene-editor scope

Use this file first when the request concerns the live simulation, scene editing,
camera interaction, assets, or MuJoCo rendering. Keep investigation narrowly
scoped unless the request or an observed dependency requires expanding it.

## Primary working files

| Area | File |
| --- | --- |
| Browser scene editor, WebSocket client, drag/drop, gizmo | `src/main.ts` |
| Browser scene-editor layout and gizmo styling | `src/style.css` |
| WebSocket API and simulation lifecycle | `../PycharmProjects/dapg/server.py` |
| MuJoCo setup, rendering, camera, dynamic scene XML | `../PycharmProjects/dapg/muj1.py` |
| Name-only user scene storage API | `../PycharmProjects/dapg/editor_api.py` |

## MuJoCo Relocate task files

- Environment behaviour: `../PycharmProjects/dapg/robohive/robohive/envs/hands/relocate_v1.py`
- Base model: `../PycharmProjects/dapg/robohive/robohive/envs/hands/assets/DAPG_relocate.xml`
- Other task environments and assets live beside these files and are only needed
  when explicitly working on Hammer, Door, or Pen.

## Current architecture

```text
src/main.ts (scene editor / simulation panel)
  -> WebSocket /ws/simulation
  -> ../PycharmProjects/dapg/server.py
  -> ../PycharmProjects/dapg/muj1.py
  -> temporary XML based on DAPG_relocate.xml
  -> MuJoCo GPU renderer -> JPEG frames -> browser
```

## Current scene protocol

- `scene` query parameter: JSON list of `{id, asset, position, rotation, scale}`.
- `editor=1`: static, editable scene preview.
- A normal run initiated from the editor also sends `scene`, so the policy starts
  with the edited scene.
- `scene_transform` WebSocket command updates the selected editor asset in the
  running preview.
- `frame_metadata.render_camera` is the authoritative projection data for
  placement, selection, and gizmo positioning. Do not replace it with an
  approximate azimuth/elevation projection.
- Scene accounts are currently name-only test namespaces under
  `/api/editor/users/{user}/scenes`; they intentionally require no password.

## Out of scope by default

- Code editor API/UI and its file explorer
- Log panel and log retention
- AI object-generation UI/API
- Deployment, Cloudflare Tunnel, Vercel, and Render configuration
- Policy training scripts and policy files

Expand the scope only when the user explicitly asks for one of these areas or
when a direct dependency blocks the requested simulation work.
