import "./style.css";
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands";
import {python} from "@codemirror/lang-python";
import {defaultHighlightStyle, syntaxHighlighting} from "@codemirror/language";
import {EditorState} from "@codemirror/state";
import {EditorView, keymap} from "@codemirror/view";

const RENDER_BACKEND_URL = "https://mujocoweb-backend.onrender.com";
// A trycloudflare.com quick tunnel is temporary and must never be the default.
const DEFAULT_BACKEND_URL = RENDER_BACKEND_URL;
const EXPIRED_TUNNEL_URL = "https://thumbnail-delivers-solving-followed.trycloudflare.com";

function normalizeBackendUrl(value: string): string {
    const url = new URL(value);
    if (!(["http:", "https:"].includes(url.protocol))) {
        throw new Error("Backend URL must use HTTP or HTTPS.");
    }
    return url.toString().replace(/\/$/, "");
}

function resolveBackendUrl(): string {
    const query = new URLSearchParams(window.location.search).get("backend");
    if (query === "default") {
        localStorage.removeItem("mujocoweb-backend-url");
    } else if (query === "render") {
        localStorage.setItem("mujocoweb-backend-url", RENDER_BACKEND_URL);
    } else if (query) {
        try {
            localStorage.setItem("mujocoweb-backend-url", normalizeBackendUrl(query));
        } catch (error) {
            console.warn("Ignoring invalid backend URL:", error);
        }
    }
    const configured = import.meta.env.VITE_BACKEND_URL?.trim();
    let stored = localStorage.getItem("mujocoweb-backend-url");
    if (stored === EXPIRED_TUNNEL_URL) {
        localStorage.removeItem("mujocoweb-backend-url");
        stored = null;
    }
    try {
        return normalizeBackendUrl(stored || configured || DEFAULT_BACKEND_URL);
    } catch {
        return RENDER_BACKEND_URL;
    }
}

let backendUrl = resolveBackendUrl();

async function refreshPublishedBackendUrl(): Promise<void> {
    // Explicit per-browser overrides always take precedence over the public default.
    if (localStorage.getItem("mujocoweb-backend-url")) return;
    try {
        const response = await fetch(`/backend.json?t=${Date.now()}`, {cache: "no-store"});
        if (!response.ok) return;
        const config = await response.json() as {url?: unknown};
        if (typeof config.url !== "string") return;
        const url = normalizeBackendUrl(config.url);
        if (new URL(url).protocol !== "https:") return;
        backendUrl = url;
    } catch (error) {
        console.warn("Could not load published backend URL; using fallback:", error);
    }
}

function backendHttpUrl(path: string): string {
    return `${backendUrl}${path}`;
}

function backendWebSocketUrl(path: string): URL {
    const url = new URL(path, `${backendUrl}/`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url;
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="page">
    <section id="demo-section" class="tab-content active">
      <section class="hero">
        <p class="eyebrow">DAPG · MuJoCo · RoboHive · Cloud Robotics</p>
        <h1>Dexterous Hand Manipulation</h1>
        <p class="description">
          Experience a trained DAPG (Demo Augmented Policy Gradient) policy performing complex manipulation tasks.
          Real-time physics simulation powered by MuJoCo, streamed from cloud to browser.
        </p>
      </section>

      <div id="workbench" class="workbench">
        <aside id="editorLogsPanel" class="workbench-logs" aria-label="Backend logs">
          <div class="workbench-logs-header">
            <div><span class="panel-eyebrow">Live output</span><h2>Backend log</h2></div>
            <div class="workbench-logs-actions">
              <button id="editorLogsExpandButton" class="secondary-button" type="button" aria-expanded="false">Expand</button>
              <button id="editorLogsRefreshButton" class="secondary-button" type="button" aria-label="Refresh backend logs">↻</button>
            </div>
          </div>
          <div class="workbench-log-auth">
            <label class="field-label" for="editorPassword">Editor password</label>
            <input id="editorPassword" class="setup-input" type="password" autocomplete="off" placeholder="Unlock logs and code" />
            <button id="editorConnectButton" class="secondary-button" type="button">Unlock</button>
          </div>
          <p id="editorLogsMessage" class="generator-message" aria-live="polite"></p>
          <pre id="editorLogsOutput" class="editor-logs-output" aria-label="Backend logs">Enter the editor password to see live logs.</pre>
          <p class="workbench-log-caption">Last 2,000 lines · refreshes every 5 seconds</p>
        </aside>

        <div id="simulationPane" class="simulation-pane">
      <section class="simulation-card">
        <div class="simulation-header">
          <div>
            <h2>Live Simulation</h2>
            <p id="statusText">Not connected</p>
          </div>

          <div class="controls">
            <span id="statusIndicator" class="status-indicator"></span>
            <button id="sceneAccountButton" class="setup-button" type="button" aria-controls="sceneAccountPanel" aria-expanded="false">
              <span aria-hidden="true">◎</span><span id="sceneAccountLabel">User: Guest</span>
            </button>
            <div class="scene-toolbar" aria-label="Scene storage">
              <select id="sceneSelect" class="scene-toolbar-select" aria-label="Scene to load"><option value="">Loading scenes…</option></select>
              <button id="sceneLoadButton" class="setup-button scene-toolbar-button" type="button">Load</button>
              <input id="sceneNameInput" class="scene-toolbar-name" value="DAPG Relocate Start" maxlength="48" aria-label="Scene name for saving" />
              <button id="sceneSaveButton" class="setup-button scene-toolbar-button" type="button">Save</button>
            </div>
            <button id="setupButton" class="setup-button" type="button" aria-haspopup="dialog" aria-controls="setupPanel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.06 1.52 1.7 1.7 0 0 0 1.88-.34L17 4.2 19.83 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>
              </svg>
              Experiment setup
            </button>
            <button id="codeEditorButton" class="setup-button" type="button" aria-controls="codeEditorPane" aria-expanded="false">Code editor</button>
            <button id="startButton" type="button">
              <span class="playback-icon play-icon" aria-hidden="true"></span>
              <span class="playback-label">Start simulation</span>
            </button>
          </div>
        </div>

        <div id="sceneAccountPanel" class="scene-account-panel" hidden>
          <div class="scene-account-copy"><strong>Test accounts</strong><span>No password is required in this version, so scenes are not private yet.</span></div>
          <div class="scene-account-field"><label for="sceneUserSelect">Existing users</label><div class="scene-account-row"><select id="sceneUserSelect" class="setup-select"><option value="">Loading users…</option></select><button id="sceneExistingUserButton" class="secondary-button" type="button">Open user</button></div></div>
          <div class="scene-account-field"><label for="sceneUserInput">Create user or enter name</label><div class="scene-account-row"><input id="sceneUserInput" class="setup-input" value="Guest" maxlength="32" autocomplete="username" /><button id="sceneUserButton" class="secondary-button" type="button">Create / open user</button></div></div>
          <p id="sceneAccountMessage" class="generator-message" aria-live="polite"></p>
          <p id="sceneMessage" class="generator-message" aria-live="polite"></p>
        </div>

        <div class="simulation-window">
          <img
            id="simulationImage"
            alt="Live MuJoCo simulation"
            draggable="false"
          />

          <div id="placeholder" class="placeholder">
            <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <p>Press "Start Simulation" to begin</p>
          </div>

          <div id="sceneDropPreview" class="scene-drop-preview" hidden aria-hidden="true">
            <span id="sceneDropShape" class="scene-drop-shape">▣</span>
            <span id="sceneDropLabel">Release to place</span>
          </div>
          <div id="sceneGizmo" class="scene-gizmo" hidden>
            <div class="scene-gizmo-toolbar"><span id="sceneGizmoName"></span><button type="button" data-gizmo-mode="move" class="active">Move</button><button type="button" data-gizmo-mode="rotate">Rotate</button></div>
            <svg id="sceneGizmoAxes" aria-label="Drag an axis to transform the selected asset"></svg>
          </div>

          <div class="camera-controls" aria-label="Camera controls">
            <span>Drag to orbit · Scroll or pinch to zoom</span>
            <button id="resetCameraButton" type="button" disabled>Reset view</button>
          </div>
        </div>

        <div class="live-asset-bar" aria-label="Scene assets">
          <span>Scene assets</span>
          <button type="button" draggable="true" data-live-asset="box">▣ Cube</button>
          <button type="button" draggable="true" data-live-asset="sphere">● Sphere</button>
          <button type="button" draggable="true" data-live-asset="cylinder">▯ Cylinder</button>
          <button type="button" draggable="true" data-live-asset="hammer">⚒ Hammer</button>
          <small>Drag into scene</small>
        </div>

        <div class="metadata">
          <span>Episode: <strong id="episodeValue">—</strong></span>
          <span>Step: <strong id="stepValue">—</strong></span>
          <span>Reward: <strong id="rewardValue">—</strong></span>
          <span>Simulation Time: <strong id="timeValue">—</strong></span>
        </div>

        <div class="active-configuration" aria-label="Active experiment configuration">
          <span class="configuration-label">Configuration</span>
          <span id="configurationSummary">Adroit Hand · DAPG Relocation</span>
          <button id="editConfigurationButton" type="button">Edit</button>
        </div>

        <div class="info-banner">
          <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span id="interactionHint">Click on the simulation window to set target positions for the robotic hand</span>
        </div>
      </section>
        </div>
      </div>

      <div class="theory-section">
        <div class="theory-header">
          <h2>Technical Deep Dive</h2>
          <p class="theory-subtitle">Understanding the DAPG algorithm and its mathematical foundations</p>
        </div>

        <div class="theory-content">
          <div class="theory-block">
            <h3>Demo Augmented Policy Gradient (DAPG)</h3>
            <p>
              DAPG is a hybrid reinforcement learning algorithm that combines behavioral cloning with policy gradient methods
              to learn complex manipulation tasks. The key insight is to use expert demonstrations not just for initialization,
              but throughout training to guide policy optimization.
            </p>
            <div class="paper-reference">
              <svg class="paper-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <a href="https://arxiv.org/abs/1709.10087" target="_blank" rel="noopener noreferrer">
                Learning Complex Dexterous Manipulation with Deep Reinforcement Learning and Demonstrations (Rajeswaran et al., 2017)
              </a>
            </div>
          </div>

          <div class="theory-block">
            <h3>Objective Function</h3>
            <p>The DAPG algorithm optimizes a combined objective that balances policy gradient and behavioral cloning:</p>
            <div class="equation">
              <code>L(θ) = L<sub>RL</sub>(θ) + λ<sub>0</sub>λ<sub>t</sub> L<sub>BC</sub>(θ)</code>
            </div>
            <p class="equation-desc">
              where <code>L<sub>RL</sub></code> is the standard policy gradient objective, <code>L<sub>BC</sub></code> is the behavioral cloning loss,
              and <code>λ<sub>t</sub></code> is a time-dependent weighting factor that decreases during training.
            </p>
          </div>

          <div class="theory-block">
            <h3>Policy Gradient Component</h3>
            <p>The reinforcement learning objective uses Natural Policy Gradient (NPG) / TRPO updates:</p>
            <div class="equation">
              <code>L<sub>RL</sub>(θ) = E<sub>τ∼π<sub>θ</sub></sub>[∑<sub>t</sub> A<sup>π</sup>(s<sub>t</sub>, a<sub>t</sub>)]</code>
            </div>
            <p class="equation-desc">
              where <code>A<sup>π</sup>(s, a)</code> is the advantage function estimating how much better action <code>a</code> is
              compared to the average action in state <code>s</code>.
            </p>
          </div>

          <div class="theory-block">
            <h3>Behavioral Cloning Component</h3>
            <p>The BC loss ensures the policy stays close to expert demonstrations:</p>
            <div class="equation">
              <code>L<sub>BC</sub>(θ) = E<sub>(s,a)∼D<sub>demo</sub></sub>[−log π<sub>θ</sub>(a|s)]</code>
            </div>
            <p class="equation-desc">
              where <code>D<sub>demo</sub></code> is the dataset of expert demonstrations, essentially maximum likelihood estimation
              on the demonstration data.
            </p>
          </div>

          <div class="theory-block">
            <h3>Advantage Function Estimation</h3>
            <p>DAPG uses Generalized Advantage Estimation (GAE) for variance reduction:</p>
            <div class="equation">
              <code>Â<sub>t</sub> = ∑<sub>l=0</sub><sup>∞</sup> (γλ)<sup>l</sup>δ<sub>t+l</sub></code>
            </div>
            <div class="equation">
              <code>δ<sub>t</sub> = r<sub>t</sub> + γV(s<sub>t+1</sub>) − V(s<sub>t</sub>)</code>
            </div>
            <p class="equation-desc">
              where <code>γ</code> is the discount factor, <code>λ</code> is the GAE parameter, and <code>V(s)</code> is the learned value function.
            </p>
          </div>

          <div class="theory-block">
            <h3>Adaptive Demonstration Weighting</h3>
            <p>The demonstration weight decays over time to allow the policy to improve beyond demonstrations:</p>
            <div class="equation">
              <code>λ<sub>t</sub> = max(λ<sub>final</sub>, λ<sub>init</sub> · (1 − t/T<sub>decay</sub>))</code>
            </div>
            <p class="equation-desc">
              Starting with high BC weight for stable initialization, gradually decreasing to allow pure RL exploration.
              Typical values: <code>λ<sub>init</sub> = 1.0</code>, <code>λ<sub>final</sub> = 0.01</code>.
            </p>
          </div>

          <div class="theory-block">
            <h3>Network Architecture</h3>
            <p>The policy network π<sub>θ</sub> is typically a multi-layer perceptron:</p>
            <div class="equation">
              <code>π<sub>θ</sub>(a|s) = N(μ<sub>θ</sub>(s), Σ)</code>
            </div>
            <p class="equation-desc">
              A Gaussian policy where <code>μ<sub>θ</sub></code> is the mean output by the neural network and <code>Σ</code>
              is a learned or fixed covariance matrix. The network typically has 2-3 hidden layers with 64-256 units each.
            </p>
          </div>

          <div class="theory-block">
            <h3>Key Advantages of DAPG</h3>
            <ul class="advantage-list">
              <li><strong>Sample Efficiency:</strong> Demonstrations provide a strong initialization, reducing training time by 5-10×</li>
              <li><strong>Stability:</strong> BC regularization prevents catastrophic forgetting and policy collapse</li>
              <li><strong>Beyond Demonstrations:</strong> Unlike pure imitation learning, DAPG can exceed expert performance</li>
              <li><strong>High-Dimensional Control:</strong> Successfully scales to 24+ DOF manipulation tasks</li>
            </ul>
          </div>

          <div class="theory-block">
            <h3>Implementation in This Demo</h3>
            <p>
              This demo uses a pre-trained DAPG policy for the Adroit hand environment. The policy was trained with:
            </p>
            <ul class="advantage-list">
              <li>~25 human demonstrations of the manipulation task</li>
              <li>Natural Policy Gradient updates with KL constraint of 0.01</li>
              <li>GAE with λ = 0.95, discount γ = 0.995</li>
              <li>Demonstration weight decay from 1.0 to 0.05 over 500 epochs</li>
              <li>Training time: ~50M environment steps (~12 hours on GPU)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="about-section" class="tab-content">
      <div class="about-hero">
        <h1>About This Project</h1>
        <p class="about-subtitle">Bringing advanced reinforcement learning to the web</p>
      </div>

      <div class="about-grid">
        <div class="about-card">
          <div class="card-icon">🤖</div>
          <h3>DAPG Algorithm</h3>
          <p>
            Demo Augmented Policy Gradient (DAPG) combines behavioral cloning with policy gradient methods.
            The algorithm leverages expert demonstrations to bootstrap learning, then refines the policy through
            reinforcement learning. This hybrid approach enables complex dexterous manipulation tasks that
            would be infeasible with pure RL or imitation learning alone.
          </p>
        </div>

        <div class="about-card">
          <div class="card-icon">🦾</div>
          <h3>Dexterous Manipulation</h3>
          <p>
            This demo showcases a 24-DOF robotic hand (Adroit) trained on the RoboHive benchmark suite.
            The policy controls complex finger movements to manipulate objects with human-like dexterity.
            Tasks include in-hand rotation, pen spinning, and precise object placement - all learned through
            trial and error in simulation.
          </p>
        </div>

        <div class="about-card">
          <div class="card-icon">⚡</div>
          <h3>MuJoCo Physics</h3>
          <p>
            MuJoCo (Multi-Joint dynamics with Contact) is a high-performance physics engine developed for
            robotics and biomechanics. It provides accurate contact dynamics, compliant mechanisms, and
            efficient computation - running at 500+ FPS on the backend to deliver smooth, real-time
            simulation feedback.
          </p>
        </div>

        <div class="about-card">
          <div class="card-icon">☁️</div>
          <h3>Cloud Architecture</h3>
          <p>
            The simulation runs entirely in the cloud on Python-based infrastructure. WebSocket connections
            stream rendered frames to the browser at 30 FPS. This serverless architecture enables anyone to
            experience cutting-edge robotics research without local GPU requirements or complex dependencies.
          </p>
        </div>

        <div class="about-card">
          <div class="card-icon">🎯</div>
          <h3>Interactive Control</h3>
          <p>
            Click anywhere in the simulation to set target positions. The neural network policy processes
            proprioceptive feedback (joint angles, velocities) and target coordinates to generate torque
            commands. Watch as the hand autonomously plans and executes reaching motions to achieve your
            specified goals.
          </p>
        </div>

        <div class="about-card">
          <div class="card-icon">🔬</div>
          <h3>Research Impact</h3>
          <p>
            DAPG has been widely adopted in robotic manipulation research. By making this technology accessible
            through the browser, we democratize access to state-of-the-art RL techniques. This platform serves
            as both an educational tool and a testbed for exploring human-robot interaction paradigms.
          </p>
        </div>
      </div>

      <div class="tech-stack">
        <h3>Technology Stack</h3>
        <div class="tech-tags">
          <span class="tech-tag">Python</span>
          <span class="tech-tag">MuJoCo</span>
          <span class="tech-tag">PyTorch</span>
          <span class="tech-tag">RoboHive</span>
          <span class="tech-tag">WebSocket</span>
          <span class="tech-tag">TypeScript</span>
          <span class="tech-tag">Cloud Deploy</span>
          <span class="tech-tag">Real-time Rendering</span>
        </div>
      </div>
    </section>
  </main>

  <div id="setupOverlay" class="setup-overlay" hidden></div>
  <aside id="setupPanel" class="setup-panel" role="dialog" aria-modal="true" aria-labelledby="setupTitle" hidden>
    <form id="setupForm" class="setup-form">
      <header class="setup-panel-header">
        <div>
          <p class="panel-eyebrow">Simulation configuration</p>
          <h2 id="setupTitle">Experiment setup</h2>
          <p>Choose what the simulator should load for the next session.</p>
        </div>
        <button id="closeSetupButton" class="icon-button" type="button" aria-label="Close experiment setup">×</button>
      </header>

      <div class="setup-panel-content">
        <div class="preview-notice" role="note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <div>
            <strong>Preset tasks are connected</strong>
            <span>Task selections are sent to the backend. Advanced filenames are saved locally for a future custom-file workflow.</span>
          </div>
        </div>

        <section class="setup-section ai-builder">
          <div class="setup-section-heading">
            <span class="section-number">AI</span>
            <div><h3>Create an object with AI</h3><p>Describe a graspable object in your own words.</p></div>
          </div>
          <label class="field-label" for="objectPrompt">What should the hand manipulate?</label>
          <textarea id="objectPrompt" class="setup-input object-prompt" maxlength="600" rows="4" placeholder="For example: A small red dumbbell with blue rounded ends"></textarea>
          <div class="prompt-examples" aria-label="Example descriptions">
            <button type="button" data-prompt="A small red cube with softly rounded proportions">Red cube</button>
            <button type="button" data-prompt="A miniature dumbbell with a silver handle and two blue ends">Dumbbell</button>
            <button type="button" data-prompt="A yellow toy rocket with a pointed nose and small side boosters">Toy rocket</button>
          </div>
          <button id="generateObjectButton" class="generate-button" type="button">Generate object</button>
          <p id="generatorMessage" class="generator-message" aria-live="polite"></p>
          <div id="generatedObjectCard" class="generated-object" hidden>
            <div><span>Generated design</span><strong id="generatedObjectName"></strong></div>
            <p id="generatedObjectSummary"></p>
            <span id="generatedObjectParts" class="parts-badge"></span>
          </div>
          <p class="experimental-note">Experimental: the existing policy was trained on its original object, so unusual shapes may be difficult for the hand.</p>
        </section>

        <details class="advanced-settings object-code-editor">
          <summary>Edit simulation object as JSON</summary>
          <p>Change the object used by the Relocate task. This is simulation data, not executable Python. Drafts stay in this browser; the backend validates the object again before running it.</p>
          <textarea id="objectCodeInput" class="setup-input object-code-input" rows="16" spellcheck="false" aria-label="Object JSON code"></textarea>
          <div class="object-code-actions">
            <button id="loadObjectCodeButton" class="secondary-button" type="button">Load current object</button>
            <button id="applyObjectCodeButton" class="generate-button" type="button">Validate and use object</button>
          </div>
          <p id="objectCodeMessage" class="generator-message" aria-live="polite"></p>
        </details>

        <details class="advanced-settings scene-editor" open>
          <summary>Backend scene editor</summary>
          <p>Choose assets to add to the scene draft. Loading and saving scenes is available from the User menu in the Live Simulation toolbar.</p>
          <div id="sceneAssetPalette" class="scene-asset-palette">
            <button type="button" data-scene-asset="box">▣ Cube</button>
            <button type="button" data-scene-asset="sphere">● Sphere</button>
            <button type="button" data-scene-asset="cylinder">▯ Cylinder</button>
            <button type="button" data-scene-asset="hammer">⚒ Hammer</button>
          </div>
          <div id="sceneDraft" class="scene-draft">Start with the DAPG Relocate cube, or add an asset above.</div>
        </details>

        <section class="setup-section">
          <div class="setup-section-heading">
            <span class="section-number">01</span>
            <div><h3>Robot</h3><p>The physical model and task environment.</p></div>
          </div>
          <label class="field-label" for="robotPreset">Manipulation task</label>
          <select id="robotPreset" class="setup-select">
            <option value="adroit-relocate">Adroit Hand — Object relocation</option>
            <option value="adroit-hammer">Adroit Hand — Hammer a nail</option>
            <option value="adroit-door">Adroit Hand — Open a door</option>
            <option value="adroit-pen">Adroit Hand — Reorient a pen</option>
          </select>
          <div class="file-field">
            <div class="file-icon">XML</div>
            <div class="file-copy"><span>Model file</span><strong id="robotFileDisplay">relocate_clean.xml</strong></div>
            <span class="file-status">Ready</span>
          </div>
        </section>

        <section class="setup-section">
          <div class="setup-section-heading">
            <span class="section-number">02</span>
            <div><h3>Policy</h3><p>The controller used to generate hand actions.</p></div>
          </div>
          <label class="field-label" for="policyPreset">Policy</label>
          <select id="policyPreset" class="setup-select">
            <option value="dapg-relocate">DAPG — Relocation policy</option>
            <option value="dapg-hammer">DAPG — Hammer policy</option>
            <option value="dapg-door">DAPG — Door policy</option>
            <option value="dapg-pen">DAPG — Pen policy</option>
          </select>
          <div class="file-field">
            <div class="file-icon">PKL</div>
            <div class="file-copy"><span>Checkpoint</span><strong id="policyFileDisplay">policy_paul.pkl</strong></div>
            <span class="file-status">Compatible</span>
          </div>
        </section>

        <details class="advanced-settings">
          <summary>Advanced file settings</summary>
          <p>Stage different filenames without exposing server paths. The backend will validate these before loading them.</p>
          <label class="field-label" for="robotFileInput">MuJoCo model filename</label>
          <input id="robotFileInput" class="setup-input" name="robotFile" value="relocate_clean.xml" autocomplete="off" spellcheck="false" />
          <label class="field-label" for="policyFileInput">Policy filename</label>
          <input id="policyFileInput" class="setup-input" name="policyFile" value="policy_paul.pkl" autocomplete="off" spellcheck="false" />
          <p id="fileValidationMessage" class="validation-message" aria-live="polite"></p>
        </details>
      </div>

      <footer class="setup-panel-footer">
        <button id="resetSetupButton" class="secondary-button" type="button">Reset</button>
        <button class="apply-button" type="submit">Apply configuration</button>
      </footer>
    </form>
  </aside>

  <aside id="codeEditorPane" class="code-editor-pane" aria-label="Source editor">
    <button id="codeEditorRailButton" class="code-editor-rail" type="button" aria-label="Open code editor">Code editor</button>
    <section id="codeEditorDialog" class="code-editor-dialog" aria-labelledby="codeEditorTitle">
      <header class="code-editor-header">
        <div>
          <p class="panel-eyebrow">Advanced · authenticated</p>
          <h2 id="codeEditorTitle">MuJoCo source editor</h2>
          <p>Changes to Python run on the backend computer. A syntax check is not a security check.</p>
        </div>
        <button id="closeCodeEditorButton" class="secondary-button" type="button" aria-label="Return to simulation">← Simulation</button>
      </header>
      <div class="code-editor-body">
        <div class="editor-workspace">
          <aside class="repository-explorer" aria-label="Repository explorer">
            <div class="repository-explorer-header"><span>Explorer</span><button id="editorTreeReloadButton" class="secondary-button" type="button" disabled aria-label="Reload repository tree">↻</button></div>
            <div id="editorTree" class="editor-tree" tabindex="0" aria-live="polite">Unlock the editor to browse source files.</div>
          </aside>
          <div class="editor-document">
            <div class="code-editor-toolbar">
              <strong id="editorCurrentFile">Choose a source file</strong>
              <button id="editorBackButton" class="secondary-button" type="button" disabled>← Back</button>
              <button id="editorForwardButton" class="secondary-button" type="button" disabled>Forward →</button>
              <button id="editorLoadButton" class="secondary-button" type="button" disabled>Reload file</button>
            </div>
            <p id="editorDescription" class="experimental-note"></p>
            <div id="editorContent" class="code-editor-content" aria-label="Source code"></div>
            <div class="code-editor-toolbar">
              <button id="editorSaveButton" class="apply-button" type="button" disabled>Save and restart backend</button>
              <select id="editorRevisionSelect" class="setup-select" aria-label="Backup version" disabled><option>Choose a backup</option></select>
              <button id="editorRestoreButton" class="secondary-button" type="button" disabled>Restore backup</button>
            </div>
          </div>
        </div>
        <p id="editorMessage" class="generator-message" aria-live="polite"></p>
      </div>
    </section>
  </aside>
`;

const startButton =
    document.querySelector<HTMLButtonElement>("#startButton")!;
const resetCameraButton = document.querySelector<HTMLButtonElement>("#resetCameraButton")!;

const simulationImage =
    document.querySelector<HTMLImageElement>("#simulationImage")!;

const placeholder =
    document.querySelector<HTMLDivElement>("#placeholder")!;
const sceneDropPreview = document.querySelector<HTMLDivElement>("#sceneDropPreview")!;
const sceneDropShape = document.querySelector<HTMLElement>("#sceneDropShape")!;
const sceneDropLabel = document.querySelector<HTMLElement>("#sceneDropLabel")!;

const statusText =
    document.querySelector<HTMLParagraphElement>("#statusText")!;

const statusIndicator =
    document.querySelector<HTMLSpanElement>("#statusIndicator")!;

const episodeValue =
    document.querySelector<HTMLElement>("#episodeValue")!;

const stepValue =
    document.querySelector<HTMLElement>("#stepValue")!;

const rewardValue =
    document.querySelector<HTMLElement>("#rewardValue")!;

const timeValue =
    document.querySelector<HTMLElement>("#timeValue")!;

const setupButton = document.querySelector<HTMLButtonElement>("#setupButton")!;
const editConfigurationButton = document.querySelector<HTMLButtonElement>("#editConfigurationButton")!;
const closeSetupButton = document.querySelector<HTMLButtonElement>("#closeSetupButton")!;
const resetSetupButton = document.querySelector<HTMLButtonElement>("#resetSetupButton")!;
const setupPanel = document.querySelector<HTMLElement>("#setupPanel")!;
const setupOverlay = document.querySelector<HTMLDivElement>("#setupOverlay")!;
const setupForm = document.querySelector<HTMLFormElement>("#setupForm")!;
const robotFileInput = document.querySelector<HTMLInputElement>("#robotFileInput")!;
const policyFileInput = document.querySelector<HTMLInputElement>("#policyFileInput")!;
const robotFileDisplay = document.querySelector<HTMLElement>("#robotFileDisplay")!;
const policyFileDisplay = document.querySelector<HTMLElement>("#policyFileDisplay")!;
const configurationSummary = document.querySelector<HTMLElement>("#configurationSummary")!;
const fileValidationMessage = document.querySelector<HTMLParagraphElement>("#fileValidationMessage")!;
const robotPreset = document.querySelector<HTMLSelectElement>("#robotPreset")!;
const policyPreset = document.querySelector<HTMLSelectElement>("#policyPreset")!;
const interactionHint = document.querySelector<HTMLElement>("#interactionHint")!;
const objectPrompt = document.querySelector<HTMLTextAreaElement>("#objectPrompt")!;
const generateObjectButton = document.querySelector<HTMLButtonElement>("#generateObjectButton")!;
const generatorMessage = document.querySelector<HTMLParagraphElement>("#generatorMessage")!;
const generatedObjectCard = document.querySelector<HTMLDivElement>("#generatedObjectCard")!;
const generatedObjectName = document.querySelector<HTMLElement>("#generatedObjectName")!;
const generatedObjectSummary = document.querySelector<HTMLParagraphElement>("#generatedObjectSummary")!;
const generatedObjectParts = document.querySelector<HTMLElement>("#generatedObjectParts")!;
const sceneNameInput = document.querySelector<HTMLInputElement>("#sceneNameInput")!;
const sceneSaveButton = document.querySelector<HTMLButtonElement>("#sceneSaveButton")!;
const sceneUserInput = document.querySelector<HTMLInputElement>("#sceneUserInput")!;
const sceneUserButton = document.querySelector<HTMLButtonElement>("#sceneUserButton")!;
const sceneUserSelect = document.querySelector<HTMLSelectElement>("#sceneUserSelect")!;
const sceneExistingUserButton = document.querySelector<HTMLButtonElement>("#sceneExistingUserButton")!;
const sceneAccountButton = document.querySelector<HTMLButtonElement>("#sceneAccountButton")!;
const sceneAccountLabel = document.querySelector<HTMLElement>("#sceneAccountLabel")!;
const sceneAccountPanel = document.querySelector<HTMLElement>("#sceneAccountPanel")!;
const sceneAccountMessage = document.querySelector<HTMLParagraphElement>("#sceneAccountMessage")!;
const sceneSelect = document.querySelector<HTMLSelectElement>("#sceneSelect")!;
const sceneLoadButton = document.querySelector<HTMLButtonElement>("#sceneLoadButton")!;
const sceneGizmo = document.querySelector<HTMLElement>("#sceneGizmo")!;
const sceneGizmoAxes = document.querySelector<SVGSVGElement>("#sceneGizmoAxes")!;
const sceneGizmoName = document.querySelector<HTMLElement>("#sceneGizmoName")!;
const sceneDraft = document.querySelector<HTMLElement>("#sceneDraft")!;
const sceneMessage = document.querySelector<HTMLParagraphElement>("#sceneMessage")!;
const codeEditorButton = document.querySelector<HTMLButtonElement>("#codeEditorButton")!;
const codeEditorRailButton = document.querySelector<HTMLButtonElement>("#codeEditorRailButton")!;
const codeEditorPane = document.querySelector<HTMLElement>("#codeEditorPane")!;
const codeEditorDialog = document.querySelector<HTMLElement>("#codeEditorDialog")!;
const workbench = document.querySelector<HTMLElement>("#workbench")!;
const simulationPane = document.querySelector<HTMLElement>("#simulationPane")!;
const closeCodeEditorButton = document.querySelector<HTMLButtonElement>("#closeCodeEditorButton")!;
const editorPassword = document.querySelector<HTMLInputElement>("#editorPassword")!;
const editorTree = document.querySelector<HTMLElement>("#editorTree")!;
const editorTreeReloadButton = document.querySelector<HTMLButtonElement>("#editorTreeReloadButton")!;
const editorCurrentFile = document.querySelector<HTMLElement>("#editorCurrentFile")!;
const editorConnectButton = document.querySelector<HTMLButtonElement>("#editorConnectButton")!;
const editorBackButton = document.querySelector<HTMLButtonElement>("#editorBackButton")!;
const editorForwardButton = document.querySelector<HTMLButtonElement>("#editorForwardButton")!;
const editorLoadButton = document.querySelector<HTMLButtonElement>("#editorLoadButton")!;
const editorContent = document.querySelector<HTMLElement>("#editorContent")!;
const editorSaveButton = document.querySelector<HTMLButtonElement>("#editorSaveButton")!;
const editorRevisionSelect = document.querySelector<HTMLSelectElement>("#editorRevisionSelect")!;
const editorRestoreButton = document.querySelector<HTMLButtonElement>("#editorRestoreButton")!;
const editorMessage = document.querySelector<HTMLParagraphElement>("#editorMessage")!;
const editorDescription = document.querySelector<HTMLParagraphElement>("#editorDescription")!;
const editorLogsRefreshButton = document.querySelector<HTMLButtonElement>("#editorLogsRefreshButton")!;
const editorLogsExpandButton = document.querySelector<HTMLButtonElement>("#editorLogsExpandButton")!;
const editorLogsOutput = document.querySelector<HTMLElement>("#editorLogsOutput")!;
const editorLogsMessage = document.querySelector<HTMLParagraphElement>("#editorLogsMessage")!;

workbench.appendChild(codeEditorPane);
const objectCodeInput = document.querySelector<HTMLTextAreaElement>("#objectCodeInput")!;
const objectCodeMessage = document.querySelector<HTMLParagraphElement>("#objectCodeMessage")!;
const loadObjectCodeButton = document.querySelector<HTMLButtonElement>("#loadObjectCodeButton")!;
const applyObjectCodeButton = document.querySelector<HTMLButtonElement>("#applyObjectCodeButton")!;

let socket: WebSocket | null = null;
let configurationVersion = 0;
let editorToken = "";
let editorRevision = "";
let editorLogsLoading = false;
let currentImageUrl: string | null = null;
let lastFocusedElement: HTMLElement | null = null;
let isPaused = false;
let editorPreviewActive = false;
let draggedSceneAsset: string | null = null;
let previewCamera: {azimuth: number; elevation: number; distance: number; lookat: number[]} | null = null;
type RenderCamera = {position: number[]; forward: number[]; up: number[]; near: number; top: number; bottom: number; center: number};
let renderCamera: RenderCamera | null = null;
let selectedSceneAsset = -1;
let gizmoMode: "move" | "rotate" = "move";
let gizmoDrag: {pointerId: number; axis: number; startX: number; startY: number; position: number[]; rotation: number[]; direction: number[]} | null = null;
const activePointers = new Map<number, {x: number; y: number}>();
let cameraDrag: {pointerId: number; x: number; y: number} | null = null;
let pinchDistance: number | null = null;
let cameraGestureMoved = false;
let suppressSimulationClick = false;

const defaultConfiguration = {
    taskId: "relocate",
    robotFile: "relocate_clean.xml",
    policyFile: "policy_paul.pkl",
} as const;

const taskCatalog = {
    relocate: {
        name: "Adroit Relocation",
        robotPreset: "adroit-relocate",
        policyPreset: "dapg-relocate",
        robotFile: "relocate_clean.xml",
        policyFile: "policy_paul.pkl",
        interactive: true,
    },
    hammer: {
        name: "Adroit Hammer",
        robotPreset: "adroit-hammer",
        policyPreset: "dapg-hammer",
        robotFile: "DAPG_hammer.xml",
        policyFile: "hammer-v0.pickle",
        interactive: false,
    },
    door: {
        name: "Adroit Door",
        robotPreset: "adroit-door",
        policyPreset: "dapg-door",
        robotFile: "DAPG_door.xml",
        policyFile: "door-v0.pickle",
        interactive: false,
    },
    pen: {
        name: "Adroit Pen",
        robotPreset: "adroit-pen",
        policyPreset: "dapg-pen",
        robotFile: "DAPG_pen.xml",
        policyFile: "pen-v0.pickle",
        interactive: false,
    },
} as const;

type TaskId = keyof typeof taskCatalog;
type ObjectPart = {
    shape: "sphere" | "box" | "capsule" | "cylinder" | "ellipsoid";
    size: number[];
    position: number[];
    euler: number[];
    rgba: number[];
    mass: number;
};
type GeneratedObject = {
    name: string;
    summary: string;
    parts: ObjectPart[];
    generator?: string;
};
let selectedTaskId: TaskId = defaultConfiguration.taskId;
let generatedObject: GeneratedObject | null = null;
const sceneAssets: {id: string; asset: string; position: number[]; rotation: number[]; scale: number[]}[] = [{id: "training-cube", asset: "box", position: [0, 0, 0.035], rotation: [0, 0, 0], scale: [0.03, 0.03, 0.03]}];
sceneUserInput.value = localStorage.getItem("mujocoweb-scene-user") || "Guest";
sceneAccountLabel.textContent = `User: ${sceneUserInput.value}`;

function setSceneAccountMessage(message: string): void {
    sceneAccountMessage.textContent = message;
}

function setSceneAccountOpen(open: boolean): void {
    sceneAccountPanel.hidden = !open;
    sceneAccountButton.setAttribute("aria-expanded", String(open));
}

function renderSceneDraft(): void {
    sceneDraft.textContent = sceneAssets.map((item) => `${item.asset} · position ${item.position.join(", ")} · rotation ${item.rotation.join(", ")}° · scale ${item.scale.join(", ")}`).join("\n");
}

function addSceneAsset(asset: string, position = [0.05 * (sceneAssets.length + 1), 0, 0.04]): void {
    const index = sceneAssets.length + 1;
    sceneAssets.push({id: `${asset}-${index}`, asset, position, rotation: [0, 0, 0], scale: asset === "hammer" ? [1, 1, 1] : [0.04, 0.04, 0.04]});
    renderSceneDraft();
}

function sceneUser(): string | null {
    const user = sceneUserInput.value.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{0,31}$/.test(user)) {
        const message = "Use 1-32 letters, numbers, spaces, _ or - for the user name.";
        sceneMessage.textContent = message;
        setSceneAccountMessage(message);
        return null;
    }
    localStorage.setItem("mujocoweb-scene-user", user);
    sceneAccountLabel.textContent = `User: ${user}`;
    return user;
}

async function sceneRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    await refreshPublishedBackendUrl();
    const response = await fetch(backendHttpUrl(`/api/editor${path}`), {
        ...options,
        headers: options.body ? {"Content-Type": "application/json"} : {},
    });
    if (!response.ok) {
        let message = `Scene request failed (${response.status}).`;
        try {
            const error = await response.json() as {detail?: string};
            if (error.detail) message = error.detail;
        } catch { /* Keep the HTTP status message. */ }
        throw new Error(message);
    }
    return response.json() as Promise<T>;
}

async function loadUserList(announce = true): Promise<void> {
    if (announce) setSceneAccountMessage("Loading existing test users…");
    try {
        const result = await sceneRequest<{users: string[]}>("/users");
        const options = result.users.length
            ? result.users.map((user) => new Option(user, user))
            : [new Option("No users yet", "")];
        sceneUserSelect.replaceChildren(...options);
        const current = sceneUserInput.value.trim();
        const matchingUser = result.users.find((user) => user.toLocaleLowerCase() === current.toLocaleLowerCase());
        if (matchingUser) sceneUserSelect.value = matchingUser;
        sceneExistingUserButton.disabled = result.users.length === 0;
        if (announce) setSceneAccountMessage(result.users.length
            ? "Choose a user, or create a new name below."
            : "No users exist yet. Enter a name below to create the first one.");
    } catch (error) {
        sceneUserSelect.replaceChildren(new Option("Could not load users", ""));
        sceneExistingUserButton.disabled = true;
        if (announce) setSceneAccountMessage(error instanceof Error ? error.message : "Could not load users.");
    }
}

async function loadSceneList(announce = true): Promise<void> {
    const user = sceneUser();
    if (!user) return;
    sceneUserButton.disabled = true;
    if (announce) setSceneAccountMessage(`Opening ${user}'s test account…`);
    try {
        const result = await sceneRequest<{scenes: string[]}>(`/users/${encodeURIComponent(user)}/scenes`);
        sceneSelect.replaceChildren(...result.scenes.map((name) => new Option(name, name)));
        const preferred = result.scenes.includes(sceneNameInput.value) ? sceneNameInput.value : result.scenes[0];
        if (preferred) sceneSelect.value = preferred;
        await loadUserList(false);
        if (announce) setSceneAccountMessage(`${user}'s scenes are ready. No password is required in this test version.`);
    } catch (error) {
        sceneSelect.replaceChildren(new Option("Could not load scenes", ""));
        const message = error instanceof Error ? error.message : "Could not load scenes.";
        sceneMessage.textContent = message;
        setSceneAccountMessage(message);
    } finally {
        sceneUserButton.disabled = false;
    }
}

function reconnectSceneEditor(): void {
    const previous = socket;
    socket = null;
    previous?.close();
    editorPreviewActive = false;
    window.setTimeout(() => connectToSimulation(false, true), 180);
}

function flashSceneButton(button: HTMLButtonElement, message: string, fallback: string): void {
    button.textContent = message;
    window.setTimeout(() => { button.textContent = fallback; }, 1600);
}

async function loadScene(): Promise<void> {
    const user = sceneUser();
    const name = sceneSelect.value;
    if (!user || !name) { sceneMessage.textContent = "Choose a saved scene first."; return; }
    sceneLoadButton.disabled = true;
    sceneMessage.textContent = `Loading ${name}…`;
    try {
        const result = await sceneRequest<{name: string; assets: typeof sceneAssets}>(`/users/${encodeURIComponent(user)}/scenes/${encodeURIComponent(name)}`);
        sceneAssets.splice(0, sceneAssets.length, ...result.assets);
        selectedSceneAsset = -1;
        sceneNameInput.value = result.name;
        renderSceneDraft();
        renderSceneGizmo();
        reconnectSceneEditor();
        sceneMessage.textContent = `${result.name} loaded for ${user}.`;
        flashSceneButton(sceneLoadButton, "Loaded ✓", "Load");
    } catch (error) {
        sceneMessage.textContent = error instanceof Error ? error.message : "Could not load scene.";
        flashSceneButton(sceneLoadButton, "Failed", "Load");
    } finally {
        sceneLoadButton.disabled = false;
    }
}

async function saveScene(): Promise<void> {
    const user = sceneUser();
    const name = sceneNameInput.value.trim();
    if (!user) return;
    if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{0,47}$/.test(name)) {
        sceneMessage.textContent = "Enter a valid scene name.";
        flashSceneButton(sceneSaveButton, "Invalid name", "Save");
        return;
    }
    sceneSaveButton.disabled = true;
    sceneMessage.textContent = "Saving scene on backend…";
    try {
        await sceneRequest(`/users/${encodeURIComponent(user)}/scenes/${encodeURIComponent(name)}`, {method: "PUT", body: JSON.stringify({name, assets: sceneAssets})});
        await loadSceneList(false);
        sceneSelect.value = name;
        sceneMessage.textContent = `${name} saved for ${user}.`;
        flashSceneButton(sceneSaveButton, "Saved ✓", "Save");
    } catch (error) {
        sceneMessage.textContent = error instanceof Error ? error.message : "Could not save scene.";
        flashSceneButton(sceneSaveButton, "Failed", "Save");
    } finally {
        sceneSaveButton.disabled = false;
    }
}
renderSceneDraft();

const starterObject: GeneratedObject = {
    name: "Custom object",
    summary: "An editable object for the relocation task",
    parts: [{
        shape: "box",
        size: [0.03, 0.03, 0.03],
        position: [0, 0, 0],
        euler: [0, 0, 0],
        rgba: [0.9, 0.2, 0.2, 1],
        mass: 0.1,
    }],
};

function loadCurrentObjectCode(): void {
    objectCodeInput.value = JSON.stringify(generatedObject ?? starterObject, null, 2);
    localStorage.setItem("mujocoweb-object-code-draft", objectCodeInput.value);
    objectCodeMessage.textContent = "Current object loaded. Edit it, then validate and use it.";
}

function validateObjectCode(value: unknown): GeneratedObject {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a JSON object.");
    const object = value as Record<string, unknown>;
    if (typeof object.name !== "string" || !object.name.trim() || object.name.length > 48) throw new Error("Name must be 1–48 characters.");
    if (typeof object.summary !== "string" || object.summary.length > 180) throw new Error("Summary must be at most 180 characters.");
    if (!Array.isArray(object.parts) || object.parts.length < 1 || object.parts.length > 6) throw new Error("Use 1–6 parts.");
    const shapes = new Set(["sphere", "box", "capsule", "cylinder", "ellipsoid"]);
    for (const [index, rawPart] of object.parts.entries()) {
        if (!rawPart || typeof rawPart !== "object" || Array.isArray(rawPart)) throw new Error(`Part ${index + 1} must be an object.`);
        const part = rawPart as Record<string, unknown>;
        if (!shapes.has(String(part.shape))) throw new Error(`Part ${index + 1}: unsupported shape.`);
        for (const [field, length, minimum, maximum] of [
            ["size", 3, 0.005, 0.09],
            ["position", 3, -0.12, 0.12],
            ["euler", 3, -3.142, 3.142],
            ["rgba", 4, 0, 1],
        ] as const) {
            const values = part[field];
            if (!Array.isArray(values) || values.length !== length || values.some((v) => typeof v !== "number" || !Number.isFinite(v) || v < minimum || v > maximum)) {
                throw new Error(`Part ${index + 1}: ${field} must have ${length} numbers between ${minimum} and ${maximum}.`);
            }
        }
        if (typeof part.mass !== "number" || !Number.isFinite(part.mass) || part.mass < 0.005 || part.mass > 1.5) {
            throw new Error(`Part ${index + 1}: mass must be between 0.005 and 1.5 kg.`);
        }
    }
    return {name: object.name, summary: object.summary, parts: object.parts as ObjectPart[], generator: "manual-json"};
}

function applyObjectCode(): void {
    try {
        const parsed = JSON.parse(objectCodeInput.value) as unknown;
        if (objectCodeInput.value.length > 7500) throw new Error("Object code is too large (7,500-character limit).");
        generatedObject = validateObjectCode(parsed);
        populateTask("relocate");
        showGeneratedObject();
        objectCodeMessage.textContent = "Valid object. Apply the configuration, then start the simulation.";
    } catch (error) {
        objectCodeMessage.textContent = error instanceof Error ? error.message : "Invalid object code.";
    }
}

objectCodeInput.value = localStorage.getItem("mujocoweb-object-code-draft") ?? JSON.stringify(starterObject, null, 2);
objectCodeInput.addEventListener("input", () => localStorage.setItem("mujocoweb-object-code-draft", objectCodeInput.value));
loadObjectCodeButton.addEventListener("click", loadCurrentObjectCode);
applyObjectCodeButton.addEventListener("click", applyObjectCode);

type EditorTreeNode = {kind: "directory"; name: string; children: EditorTreeNode[]} | {kind: "file"; name: string; id: string};
type EditorDocument = {id: string; name: string; description: string; content: string; sha256: string; revisions: string[]};
type EditorLocation = {fileId: string; position: number};
let editorFileId = "";
let editorView: EditorView | null = null;
const editorBackHistory: EditorLocation[] = [];
const editorForwardHistory: EditorLocation[] = [];

function currentEditorLocation(): EditorLocation | null {
    return editorFileId && editorView ? {fileId: editorFileId, position: editorView.state.selection.main.head} : null;
}

function updateEditorHistoryButtons(): void {
    editorBackButton.disabled = editorBackHistory.length === 0;
    editorForwardButton.disabled = editorForwardHistory.length === 0;
}

function createCodeEditor(content: string, position = 0): void {
    editorView?.destroy();
    editorContent.replaceChildren();
    editorView = new EditorView({
        state: EditorState.create({
            doc: content,
            selection: {anchor: Math.min(position, content.length)},
            extensions: [
                history(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                python(),
                syntaxHighlighting(defaultHighlightStyle),
                EditorView.lineWrapping,
                EditorView.domEventHandlers({
                    mousedown: (event, view) => {
                        if (!(event.ctrlKey || event.metaKey)) return false;
                        const positionAtPointer = view.posAtCoords({x: event.clientX, y: event.clientY});
                        const word = positionAtPointer === null ? null : view.state.wordAt(positionAtPointer);
                        if (!word) return false;
                        event.preventDefault();
                        void goToDefinition(view.state.sliceDoc(word.from, word.to));
                        return true;
                    },
                }),
            ],
        }),
        parent: editorContent,
    });
    editorView.focus();
}

async function editorRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    await refreshPublishedBackendUrl();
    const response = await fetch(backendHttpUrl(`/api/editor${path}`), {
        ...options,
        headers: {
            "Authorization": `Bearer ${editorToken}`,
            ...(options.body ? {"Content-Type": "application/json"} : {}),
        },
    });
    if (!response.ok) {
        let message = `Editor request failed (${response.status}).`;
        try {
            const error = await response.json() as {detail?: string};
            if (error.detail) message = error.detail;
        } catch { /* Keep the HTTP status message. */ }
        throw new Error(message);
    }
    return response.json() as Promise<T>;
}

function editorStatus(message: string): void {
    editorMessage.textContent = message;
}

async function connectEditor(): Promise<void> {
    editorToken = editorPassword.value.trim();
    if (!editorToken) {
        editorStatus("Enter the private editor password first.");
        return;
    }
    editorConnectButton.disabled = true;
    editorStatus("Connecting to the editor…");
    try {
        await loadEditorTree();
        editorStatus("Connected. Choose a source file in the explorer.");
        editorLogsMessage.textContent = "";
        void refreshEditorLogs();
    } catch (error) {
        editorToken = "";
        const message = error instanceof Error ? error.message : "Could not connect to editor.";
        editorStatus(message);
        editorLogsMessage.textContent = message;
    } finally {
        editorConnectButton.disabled = false;
    }
}

function renderEditorTree(nodes: EditorTreeNode[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (const node of nodes) {
        if (node.kind === "directory") {
            const details = document.createElement("details");
            details.className = "editor-tree-directory";
            details.open = node.name === "dapg" || node.name === "live-robohive";
            const summary = document.createElement("summary");
            summary.textContent = node.name;
            details.append(summary, renderEditorTree(node.children));
            fragment.append(details);
        } else {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "editor-tree-file";
            button.textContent = node.name;
            button.dataset.fileId = node.id;
            button.addEventListener("click", () => {
                const previousLocation = currentEditorLocation();
                if (previousLocation && previousLocation.fileId !== node.id) {
                    editorBackHistory.push(previousLocation);
                    editorForwardHistory.length = 0;
                    updateEditorHistoryButtons();
                }
                editorFileId = node.id;
                void loadEditorFile();
            });
            fragment.append(button);
        }
    }
    return fragment;
}

async function loadEditorTree(): Promise<void> {
    editorTreeReloadButton.disabled = true;
    editorTree.textContent = "Loading repository…";
    try {
        const result = await editorRequest<{roots: EditorTreeNode[]}>("/tree");
        editorTree.replaceChildren(renderEditorTree(result.roots));
        editorTreeReloadButton.disabled = false;
    } catch (error) {
        editorTree.textContent = error instanceof Error ? error.message : "Could not load repository.";
    }
}

async function loadEditorFile(position = 0): Promise<void> {
    const fileId = editorFileId;
    if (!fileId || !editorToken) return;
    editorStatus("Loading source file…");
    try {
        const file = await editorRequest<EditorDocument>(`/files/${encodeURIComponent(fileId)}`);
        createCodeEditor(file.content, position);
        editorRevision = file.sha256;
        editorCurrentFile.textContent = file.description;
        editorDescription.textContent = `${file.name} · ${file.description}`;
        document.querySelectorAll(".editor-tree-file").forEach((button) => {
            button.classList.toggle("selected", (button as HTMLElement).dataset.fileId === fileId);
        });
        editorRevisionSelect.replaceChildren(...file.revisions.map((revision) => {
            const option = document.createElement("option");
            option.value = revision;
            option.textContent = revision === "original" ? "Original before browser edits" : revision;
            return option;
        }));
        editorSaveButton.disabled = false;
        editorRevisionSelect.disabled = file.revisions.length === 0;
        editorRestoreButton.disabled = file.revisions.length === 0;
        editorStatus("Loaded. Saving creates a backup and restarts the backend.");
    } catch (error) {
        editorStatus(error instanceof Error ? error.message : "Could not load source file.");
    }
}

async function goToDefinition(symbol: string): Promise<void> {
    if (!editorFileId || !editorToken || !/^[A-Za-z_]\w*$/.test(symbol)) return;
    editorStatus(`Finding definition of ${symbol}…`);
    try {
        const result = await editorRequest<{id: string; line: number}>(`/definitions?file_id=${encodeURIComponent(editorFileId)}&symbol=${encodeURIComponent(symbol)}`);
        const previousLocation = currentEditorLocation();
        if (previousLocation) editorBackHistory.push(previousLocation);
        editorForwardHistory.length = 0;
        editorFileId = result.id;
        await loadEditorFile();
        if (editorView) {
            const target = editorView.state.doc.line(Math.min(result.line, editorView.state.doc.lines)).from;
            editorView.dispatch({selection: {anchor: target}, scrollIntoView: true});
        }
        updateEditorHistoryButtons();
    } catch (error) {
        editorStatus(error instanceof Error ? error.message : `No definition found for ${symbol}.`);
    }
}

async function moveEditorHistory(source: EditorLocation[], destination: EditorLocation[]): Promise<void> {
    const target = source.pop();
    const current = currentEditorLocation();
    if (!target) return;
    if (current) destination.push(current);
    editorFileId = target.fileId;
    await loadEditorFile(target.position);
    updateEditorHistoryButtons();
}

async function saveEditorFile(): Promise<void> {
    if (!editorRevision || !editorToken) return;
    if (!window.confirm("Save this source file and restart the backend? The code will run with this computer's user permissions.")) return;
    editorSaveButton.disabled = true;
    editorStatus("Validating and saving…");
    try {
        await editorRequest<{sha256: string; restarting: boolean}>(`/files/${encodeURIComponent(editorFileId)}`, {
            method: "PUT",
            body: JSON.stringify({content: editorView?.state.doc.toString() ?? "", expected_sha256: editorRevision}),
        });
        editorStatus("Saved. The backend is restarting; wait a few seconds, then reload this file.");
        editorView?.destroy();
        editorView = null;
    } catch (error) {
        editorStatus(error instanceof Error ? error.message : "Could not save source file.");
    } finally {
        editorSaveButton.disabled = false;
    }
}

async function restoreEditorFile(): Promise<void> {
    const revision = editorRevisionSelect.value;
    if (!revision || !editorRevision || !editorToken) return;
    if (!window.confirm(`Restore ${revision === "original" ? "the original file" : revision} and restart the backend?`)) return;
    editorRestoreButton.disabled = true;
    editorStatus("Restoring backup…");
    try {
        await editorRequest(`/files/restore/${encodeURIComponent(editorFileId)}`, {
            method: "POST",
            body: JSON.stringify({revision, expected_sha256: editorRevision}),
        });
        editorStatus("Backup restored. Wait for the backend to restart, then reload this file.");
        editorView?.destroy();
        editorView = null;
    } catch (error) {
        editorStatus(error instanceof Error ? error.message : "Could not restore backup.");
    } finally {
        editorRestoreButton.disabled = false;
    }
}

function hasLogTextSelection(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;
    return selection.getRangeAt(0).intersectsNode(editorLogsOutput);
}

async function refreshEditorLogs(preserveSelection = false): Promise<void> {
    if (editorLogsLoading) return;
    if (!editorToken) {
        editorLogsMessage.textContent = "Connect with the editor password to view logs.";
        return;
    }
    if (preserveSelection && hasLogTextSelection()) {
        editorLogsMessage.textContent = "Auto-refresh paused while text is selected.";
        return;
    }
    editorLogsLoading = true;
    editorLogsRefreshButton.disabled = true;
    try {
        const atBottom = editorLogsOutput.scrollTop + editorLogsOutput.clientHeight >= editorLogsOutput.scrollHeight - 30;
        const result = await editorRequest<{logs: string}>("/logs");
        if (preserveSelection && hasLogTextSelection()) {
            editorLogsMessage.textContent = "Auto-refresh paused while text is selected.";
            return;
        }
        editorLogsOutput.textContent = result.logs || "No backend logs yet.";
        if (atBottom) editorLogsOutput.scrollTop = editorLogsOutput.scrollHeight;
        editorLogsMessage.textContent = "";
    } catch (error) {
        editorLogsMessage.textContent = error instanceof Error ? error.message : "Could not load backend logs.";
    } finally {
        editorLogsLoading = false;
        editorLogsRefreshButton.disabled = false;
    }
}

function setEditorOpen(open: boolean): void {
    if (open) setLogsOpen(false);
    workbench.classList.toggle("editor-open", open);
    codeEditorButton.setAttribute("aria-expanded", String(open));
    codeEditorDialog.inert = !open;
    codeEditorDialog.setAttribute("aria-hidden", String(!open));
    if (open) {
        if (!editorToken) editorPassword.focus();
        else editorTree.focus();
    } else {
        codeEditorButton.focus();
    }
}

function setLogsOpen(open: boolean): void {
    if (open) setEditorOpen(false);
    workbench.classList.toggle("logs-open", open);
    editorLogsExpandButton.textContent = open ? "← Simulation" : "Expand";
    editorLogsExpandButton.setAttribute("aria-expanded", String(open));
    if (open) {
        editorLogsOutput.focus();
    }
}

codeEditorDialog.inert = true;
codeEditorDialog.setAttribute("aria-hidden", "true");
codeEditorButton.addEventListener("click", () => { setSceneAccountOpen(false); setEditorOpen(true); });
codeEditorRailButton.addEventListener("click", () => { setSceneAccountOpen(false); setEditorOpen(true); });
closeCodeEditorButton.addEventListener("click", () => setEditorOpen(false));
simulationPane.addEventListener("click", (event) => {
    if (!workbench.classList.contains("editor-open") && !workbench.classList.contains("logs-open")) return;
    event.preventDefault();
    event.stopPropagation();
    if (workbench.classList.contains("editor-open")) setEditorOpen(false);
    else setLogsOpen(false);
}, true);
editorConnectButton.addEventListener("click", connectEditor);
editorPassword.addEventListener("keydown", (event) => {
    if (event.key === "Enter") void connectEditor();
});
editorLoadButton.addEventListener("click", () => void loadEditorFile());
editorTreeReloadButton.addEventListener("click", () => void loadEditorTree());
editorSaveButton.addEventListener("click", saveEditorFile);
editorRestoreButton.addEventListener("click", restoreEditorFile);
editorLogsRefreshButton.addEventListener("click", () => void refreshEditorLogs());
editorLogsExpandButton.addEventListener("click", () => setLogsOpen(!workbench.classList.contains("logs-open")));
editorBackButton.addEventListener("click", () => void moveEditorHistory(editorBackHistory, editorForwardHistory));
editorForwardButton.addEventListener("click", () => void moveEditorHistory(editorForwardHistory, editorBackHistory));
window.setInterval(() => {
    if (editorToken && document.querySelector("#demo-section")?.classList.contains("active")) void refreshEditorLogs(true);
}, 5000);

function showGeneratedObject(): void {
    if (!generatedObject) {
        generatedObjectCard.hidden = true;
        return;
    }
    generatedObjectName.textContent = generatedObject.name;
    generatedObjectSummary.textContent = generatedObject.summary;
    generatedObjectParts.textContent = `${generatedObject.parts.length} primitive${generatedObject.parts.length === 1 ? "" : "s"}`;
    generatedObjectCard.hidden = false;
}

async function generateObject(): Promise<void> {
    const description = objectPrompt.value.trim();
    if (description.length < 3) {
        generatorMessage.textContent = "Please describe the object in a little more detail.";
        objectPrompt.focus();
        return;
    }
    generateObjectButton.disabled = true;
    generateObjectButton.textContent = "Designing…";
    generatorMessage.textContent = "The AI is translating your idea into MuJoCo geometry.";
    try {
        await refreshPublishedBackendUrl();
        const response = await fetch(backendHttpUrl("/api/objects/generate"), {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({description}),
        });
        const data = await response.json() as GeneratedObject & {detail?: string};
        if (!response.ok) throw new Error(data.detail || "Object generation failed.");
        generatedObject = data;
        populateTask("relocate");
        showGeneratedObject();
        generatorMessage.textContent = "Ready. Apply the configuration, then start the simulation.";
    } catch (error) {
        generatorMessage.textContent = error instanceof Error ? error.message : "Object generation failed.";
    } finally {
        generateObjectButton.disabled = false;
        generateObjectButton.textContent = "Generate object";
    }
}

function taskIdFromPreset(value: string): TaskId {
    const taskId = value.replace("adroit-", "") as TaskId;
    return taskId in taskCatalog ? taskId : "relocate";
}

function populateTask(taskId: TaskId): void {
    const task = taskCatalog[taskId];
    selectedTaskId = taskId;
    robotPreset.value = task.robotPreset;
    policyPreset.value = task.policyPreset;
    robotFileInput.value = task.robotFile;
    policyFileInput.value = task.policyFile;
    fileValidationMessage.textContent = "";
}

function openSetupPanel(): void {
    lastFocusedElement = document.activeElement as HTMLElement;
    setupPanel.hidden = false;
    setupOverlay.hidden = false;
    document.body.classList.add("panel-open");
    requestAnimationFrame(() => {
        setupPanel.classList.add("open");
        setupOverlay.classList.add("open");
        closeSetupButton.focus();
    });
}

function closeSetupPanel(): void {
    setupPanel.classList.remove("open");
    setupOverlay.classList.remove("open");
    document.body.classList.remove("panel-open");
    window.setTimeout(() => {
        setupPanel.hidden = true;
        setupOverlay.hidden = true;
        lastFocusedElement?.focus();
    }, 220);
}

function validateConfiguration(): boolean {
    const robotFile = robotFileInput.value.trim();
    const policyFile = policyFileInput.value.trim();

    if (!robotFile.toLowerCase().endsWith(".xml")) {
        fileValidationMessage.textContent = "The robot model must be an XML file.";
        robotFileInput.focus();
        return false;
    }

    if (!/\.(pkl|pickle|pt|pth)$/i.test(policyFile)) {
        fileValidationMessage.textContent = "Use a .pkl, .pickle, .pt, or .pth policy file.";
        policyFileInput.focus();
        return false;
    }

    fileValidationMessage.textContent = "";
    return true;
}

function applyConfiguration(): void {
    const robotFile = robotFileInput.value.trim();
    const policyFile = policyFileInput.value.trim();
    robotFileDisplay.textContent = robotFile;
    policyFileDisplay.textContent = policyFile;
    const task = taskCatalog[selectedTaskId];
    configurationSummary.textContent = `${task.name} · ${policyFile}`;
    if (generatedObject && selectedTaskId === "relocate") {
        configurationSummary.textContent = `${task.name} · ${generatedObject.name}`;
    }
    interactionHint.textContent = task.interactive
        ? "Click on the simulation window to set target positions for the robotic hand"
        : `${task.name} runs autonomously with its trained DAPG policy`;
    localStorage.setItem("mujocoweb-configuration", JSON.stringify({
        taskId: selectedTaskId,
        robotFile,
        policyFile,
        generatedObject,
    }));
}

function resetSimulationForConfiguration(): void {
    configurationVersion += 1;
    const previousSocket = socket;
    socket = null;
    previousSocket?.close(1000, "Configuration changed");
    isPaused = false;
    activePointers.clear();
    cameraDrag = null;
    pinchDistance = null;
    cameraGestureMoved = false;
    suppressSimulationClick = false;
    simulationImage.onload = null;
    simulationImage.removeAttribute("src");
    simulationImage.classList.remove("visible");
    placeholder.classList.remove("hidden");
    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = null;
    }
    episodeValue.textContent = "—";
    stepValue.textContent = "—";
    rewardValue.textContent = "—";
    timeValue.textContent = "—";
    resetCameraButton.disabled = true;
    startButton.disabled = false;
    updatePlaybackButton();
    setStatus("Ready to start with the new configuration", "idle");
}

function resetConfiguration(): void {
    generatedObject = null;
    objectPrompt.value = "";
    generatorMessage.textContent = "";
    showGeneratedObject();
    populateTask("relocate");
}

try {
    const storedConfiguration = localStorage.getItem("mujocoweb-configuration");
    if (storedConfiguration) {
        const parsed = JSON.parse(storedConfiguration) as Partial<typeof defaultConfiguration> & {generatedObject?: GeneratedObject};
        const storedTask = parsed.taskId && parsed.taskId in taskCatalog
            ? parsed.taskId as TaskId
            : "relocate";
        populateTask(storedTask);
        robotFileInput.value = parsed.robotFile ?? taskCatalog[storedTask].robotFile;
        policyFileInput.value = parsed.policyFile ?? taskCatalog[storedTask].policyFile;
        generatedObject = parsed.generatedObject ?? null;
        showGeneratedObject();
        applyConfiguration();
    }
} catch {
    localStorage.removeItem("mujocoweb-configuration");
}

function setStatus(
    text: string,
    state: "idle" | "connecting" | "connected" | "error",
): void {
    statusText.textContent = text;
    statusIndicator.className = `status-indicator ${state}`;
}

function handleSimulationClick(event: MouseEvent): void {
    if (suppressSimulationClick) {
        suppressSimulationClick = false;
        return;
    }
    if (editorPreviewActive) return;
    if (!taskCatalog[selectedTaskId].interactive) {
        return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("Cannot send target: WebSocket is not connected.");
        return;
    }

    const rect = simulationImage.getBoundingClientRect();

    const displayedX = event.clientX - rect.left;
    const displayedY = event.clientY - rect.top;

    const u = displayedX / rect.width;
    const v = displayedY / rect.height;

    if (u < 0 || u > 1 || v < 0 || v > 1) {
        return;
    }

    socket.send(
        JSON.stringify({
            type: "set_target",
            u,
            v,
        }),
    );

    console.log("Sent target position:", { u, v });
}

function projectScenePoint(position: number[]): {x: number; y: number} | null {
    if (!renderCamera || !simulationImage.naturalWidth || !simulationImage.naturalHeight) return null;
    const camera = renderCamera;
    const right = renderCameraRight(camera);
    const relative = position.map((value, i) => value - camera.position[i]);
    const dot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0);
    const depth = dot(relative, camera.forward);
    if (depth <= 0) return null;
    const aspect = simulationImage.naturalWidth / simulationImage.naturalHeight;
    const halfWidth = aspect * (camera.top - camera.bottom) / 2;
    const u = (dot(relative, right) * camera.near / depth - camera.center) / (2 * halfWidth) + 0.5;
    const v = 1 - (dot(relative, camera.up) * camera.near / depth - camera.bottom) / (camera.top - camera.bottom);
    const rect = simulationImage.getBoundingClientRect();
    const scale = Math.min(rect.width / simulationImage.naturalWidth, rect.height / simulationImage.naturalHeight);
    const width = simulationImage.naturalWidth * scale;
    const height = simulationImage.naturalHeight * scale;
    const windowRect = simulationWindow.getBoundingClientRect();
    return {x: rect.left + (rect.width - width) / 2 + u * width - windowRect.left, y: rect.top + (rect.height - height) / 2 + v * height - windowRect.top};
}

function renderCameraRight(camera: RenderCamera): number[] {
    const [fx, fy, fz] = camera.forward;
    const [ux, uy, uz] = camera.up;
    const right = [fy * uz - fz * uy, fz * ux - fx * uz, fx * uy - fy * ux];
    const length = Math.hypot(...right);
    return right.map((value) => value / length);
}

function renderSceneGizmo(): void {
    const asset = sceneAssets[selectedSceneAsset];
    const center = asset && editorPreviewActive ? projectScenePoint(asset.position) : null;
    sceneGizmo.hidden = !center;
    if (!center) return;
    sceneGizmoName.textContent = asset.id;
    const bounds = simulationWindow.getBoundingClientRect();
    sceneGizmoAxes.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    const colors = ["#ef4444", "#22c55e", "#3b82f6"];
    const labels = ["X", "Y", "Z"];
    const basis = [[0.16, 0, 0], [0, 0.16, 0], [0, 0, 0.16]];
    const axes = basis.map((offset, axis) => {
        const end = projectScenePoint(asset.position.map((value, i) => value + offset[i]));
        if (!end) return "";
        const dx = end.x - center.x;
        const dy = end.y - center.y;
        const length = Math.hypot(dx, dy) || 1;
        const x = center.x + dx / length * 64;
        const y = center.y + dy / length * 64;
        return `<g data-axis="${axis}"><line x1="${center.x}" y1="${center.y}" x2="${x}" y2="${y}" stroke="transparent" stroke-width="24"/><line x1="${center.x}" y1="${center.y}" x2="${x}" y2="${y}" stroke="${colors[axis]}" stroke-width="4" marker-end="url(#gizmoArrow)"/><circle cx="${x}" cy="${y}" r="13" fill="${colors[axis]}"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${labels[axis]}</text></g>`;
    }).join("");
    sceneGizmoAxes.innerHTML = `<defs><marker id="gizmoArrow" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="white"/></marker></defs><circle cx="${center.x}" cy="${center.y}" r="10" fill="#fafafa" stroke="#18181b" stroke-width="3"/>${axes}`;
    const toolbar = sceneGizmo.querySelector<HTMLElement>(".scene-gizmo-toolbar")!;
    toolbar.style.left = `${Math.max(8, Math.min(bounds.width - 190, center.x - 85))}px`;
    toolbar.style.top = `${Math.max(8, center.y - 112)}px`;
}

function pickSceneAsset(event: PointerEvent): boolean {
    const bounds = simulationWindow.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    let nearest = -1;
    let distance = 35;
    sceneAssets.forEach((asset, index) => {
        const point = projectScenePoint(asset.position);
        if (!point) return;
        const separation = Math.hypot(point.x - x, point.y - y);
        if (separation < distance) { distance = separation; nearest = index; }
    });
    selectedSceneAsset = nearest;
    renderSceneGizmo();
    return nearest >= 0;
}

function sendSimulationCommand(command: Record<string, unknown>): boolean {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(command));
    return true;
}

function togglePause(): void {
    const nextPaused = !isPaused;
    if (!sendSimulationCommand({type: "set_paused", paused: nextPaused})) return;
    isPaused = nextPaused;
    updatePlaybackButton();
    setStatus(isPaused ? "Simulation paused" : "Simulation running", "connected");
}

function updatePlaybackButton(): void {
    const icon = startButton.querySelector<HTMLElement>(".playback-icon")!;
    const label = startButton.querySelector<HTMLElement>(".playback-label")!;
    const connected = socket?.readyState === WebSocket.OPEN;
    icon.className = `playback-icon ${connected && !editorPreviewActive && !isPaused ? "pause-icon" : "play-icon"}`;
    label.textContent = connected && !editorPreviewActive ? (isPaused ? "Resume" : "Pause") : "Start simulation";
    startButton.setAttribute("aria-label", label.textContent);
}

async function handlePlaybackButton(): Promise<void> {
    if (socket?.readyState === WebSocket.OPEN) {
        if (editorPreviewActive) {
            editorPreviewActive = false;
            socket.close();
            window.setTimeout(() => connectToSimulation(false, false, true), 150);
            return;
        }
        togglePause();
    } else {
        const version = configurationVersion;
        startButton.disabled = true;
        await refreshPublishedBackendUrl();
        if (version !== configurationVersion) return;
        connectToSimulation();
    }
}

function beginCameraDrag(event: PointerEvent): void {
    if (!socket || socket.readyState !== WebSocket.OPEN || event.button !== 0) return;
    if (editorPreviewActive && pickSceneAsset(event)) { event.preventDefault(); return; }
    event.preventDefault();
    activePointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    cameraGestureMoved = false;
    simulationImage.setPointerCapture(event.pointerId);
    if (activePointers.size === 1) {
        cameraDrag = {pointerId: event.pointerId, x: event.clientX, y: event.clientY};
        pinchDistance = null;
    } else if (activePointers.size === 2) {
        const [first, second] = [...activePointers.values()];
        pinchDistance = Math.hypot(second.x - first.x, second.y - first.y);
        cameraDrag = null;
    }
}

function updateCameraDrag(event: PointerEvent): void {
    const previous = activePointers.get(event.pointerId);
    if (!previous) return;
    event.preventDefault();
    activePointers.set(event.pointerId, {x: event.clientX, y: event.clientY});

    if (activePointers.size >= 2) {
        const [first, second] = [...activePointers.values()];
        const nextDistance = Math.hypot(second.x - first.x, second.y - first.y);
        if (pinchDistance !== null && Math.abs(nextDistance - pinchDistance) >= 1) {
            cameraGestureMoved = true;
            sendSimulationCommand({type: "camera_zoom", delta: (pinchDistance - nextDistance) / 35});
        }
        pinchDistance = nextDistance;
        return;
    }

    if (!cameraDrag || cameraDrag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - cameraDrag.x;
    const deltaY = event.clientY - cameraDrag.y;
    cameraDrag.x = event.clientX;
    cameraDrag.y = event.clientY;
    if (Math.abs(deltaX) + Math.abs(deltaY) < 1) return;
    cameraGestureMoved = true;
    sendSimulationCommand({type: "camera_orbit", deltaX, deltaY});
}

function endCameraDrag(event: PointerEvent): void {
    if (!activePointers.has(event.pointerId)) return;
    event.preventDefault();
    activePointers.delete(event.pointerId);
    suppressSimulationClick = cameraGestureMoved;
    if (simulationImage.hasPointerCapture(event.pointerId)) {
        simulationImage.releasePointerCapture(event.pointerId);
    }
    if (activePointers.size === 1) {
        const [pointerId, point] = [...activePointers.entries()][0];
        cameraDrag = {pointerId, x: point.x, y: point.y};
        pinchDistance = null;
    } else if (activePointers.size === 0) {
        cameraDrag = null;
        pinchDistance = null;
        cameraGestureMoved = false;
    }
}

function zoomCamera(event: WheelEvent): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    event.preventDefault();
    sendSimulationCommand({type: "camera_zoom", delta: Math.sign(event.deltaY)});
}

function connectToSimulation(fallbackAttempt = false, editorPreview = false, runEditedScene = false): void {
    if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING)
    ) {
        return;
    }

    setStatus("Connecting to Python backend…", "connecting");
    startButton.disabled = true;

    const websocketUrl = backendWebSocketUrl("/ws/simulation");
    // The scene editor currently builds XML from DAPG_relocate.xml. A run
    // launched from that editor must therefore use the matching Relocate task,
    // even if the Experiment setup was previously set to another task.
    websocketUrl.searchParams.set("task", editorPreview || runEditedScene ? "relocate" : selectedTaskId);
    if (editorPreview || runEditedScene) {
        // The editor preview and a run started from it share the same asset list.
        // Only the former remains in static editing mode.
        websocketUrl.searchParams.set("scene", JSON.stringify(sceneAssets));
    }
    if (editorPreview) {
        websocketUrl.searchParams.set("editor", "1");
        if (previewCamera) websocketUrl.searchParams.set("camera", JSON.stringify(previewCamera));
    } else if (generatedObject && selectedTaskId === "relocate") {
        websocketUrl.searchParams.set("object", JSON.stringify(generatedObject));
    }

    console.log("Connecting to WebSocket:", websocketUrl);
    const connection = new WebSocket(websocketUrl.toString());
    editorPreviewActive = editorPreview;
    previewCamera = null;
    renderCamera = null;
    sceneDropPreview.hidden = true;
    socket = connection;
    let connectionOpened = false;

    connection.binaryType = "blob";

    connection.onopen = () => {
        if (socket !== connection) return;
        connectionOpened = true;
        console.log("WebSocket opened:", websocketUrl);
        setStatus("Connected", "connected");
        startButton.disabled = false;
        updatePlaybackButton();
        resetCameraButton.disabled = false;
    };

    connection.onerror = (event) => {
        if (socket !== connection) return;
        console.error("WebSocket error:", event);
        if (backendUrl === RENDER_BACKEND_URL || fallbackAttempt) {
            setStatus("WebSocket connection failed", "error");
        }
    };

    connection.onclose = (event) => {
        if (socket !== connection) return;
        console.log("WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
        });

        socket = null;
        isPaused = false;
        updatePlaybackButton();
        resetCameraButton.disabled = true;
        startButton.disabled = false;

        if (!connectionOpened && !fallbackAttempt && backendUrl !== RENDER_BACKEND_URL) {
            backendUrl = RENDER_BACKEND_URL;
            setStatus("GPU backend unavailable — connecting to Render…", "connecting");
            connectToSimulation(true, editorPreview, runEditedScene);
            return;
        }

        if (editorPreview) {
            setStatus("Editor scene ready — drag assets in, then start simulation", "idle");
        } else if (statusText.textContent !== "Simulation finished") {
            setStatus(
                `Disconnected (${event.code}${event.reason ? `: ${event.reason}` : ""})`,
                "idle",
            );
        }
    };

    connection.onmessage = (event: MessageEvent) => {
        if (socket !== connection) return;
        if (typeof event.data === "string") {
            handleTextMessage(event.data);
            return;
        }

        if (event.data instanceof Blob) {
            displayFrame(event.data);
        }
    };
}

function handleTextMessage(message: string): void {
    try {
        const data = JSON.parse(message);

        if (data.type === "frame_metadata") {
            if (data.editor_preview) {
                if (data.camera) previewCamera = data.camera;
                if (data.render_camera) renderCamera = data.render_camera;
                renderSceneGizmo();
            }
            episodeValue.textContent = String(data.episode ?? "—");
            stepValue.textContent = String(data.step ?? "—");

            rewardValue.textContent =
                typeof data.reward === "number"
                    ? data.reward.toFixed(3)
                    : "—";

            timeValue.textContent =
                typeof data.simulation_time === "number"
                    ? `${data.simulation_time.toFixed(2)} s`
                    : "—";
        }

        if (data.type === "status") {
            if (data.status === "simulation_started") {
                setStatus("Simulation running", "connected");
            }

            if (data.status === "simulation_finished") {
                setStatus("Simulation finished", "idle");
                updatePlaybackButton();
            }
        }

        if (data.type === "error") {
            console.error("Simulation error:", data.message);
            setStatus(`Simulation error: ${data.message}`, "error");
        }
    } catch (error) {
        console.error("Could not parse server message:", error);
    }
}

function displayFrame(frameBlob: Blob): void {
    const nextImageUrl = URL.createObjectURL(frameBlob);

    simulationImage.onload = () => {
        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
        }

        currentImageUrl = nextImageUrl;
    };

    simulationImage.src = nextImageUrl;
    simulationImage.classList.add("visible");
    placeholder.classList.add("hidden");
}

startButton.addEventListener("click", handlePlaybackButton);
simulationImage.addEventListener("click", handleSimulationClick);
simulationImage.addEventListener("pointerdown", beginCameraDrag);
simulationImage.addEventListener("pointermove", updateCameraDrag);
simulationImage.addEventListener("pointerup", endCameraDrag);
simulationImage.addEventListener("pointercancel", endCameraDrag);
simulationImage.addEventListener("lostpointercapture", (event) => {
    activePointers.delete(event.pointerId);
    if (activePointers.size === 0) {
        cameraDrag = null;
        pinchDistance = null;
    }
});
simulationImage.addEventListener("dragstart", (event) => event.preventDefault());
document.querySelectorAll<HTMLElement>("[data-live-asset]").forEach((asset) => {
    asset.addEventListener("dragstart", (event) => {
        if (!event.dataTransfer) return;
        draggedSceneAsset = asset.dataset.liveAsset ?? "box";
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("application/x-mujoco-asset", draggedSceneAsset);
    });
    asset.addEventListener("dragend", () => {
        draggedSceneAsset = null;
        sceneDropPreview.hidden = true;
    });
});

function sceneImagePoint(event: DragEvent): {u: number; v: number; x: number; y: number} | null {
    const rect = simulationImage.getBoundingClientRect();
    const imageWidth = simulationImage.naturalWidth || rect.width;
    const imageHeight = simulationImage.naturalHeight || rect.height;
    if (!rect.width || !rect.height || !imageWidth || !imageHeight) return null;
    const scale = Math.min(rect.width / imageWidth, rect.height / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    const u = (event.clientX - left) / width;
    const v = (event.clientY - top) / height;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    const windowRect = simulationWindow.getBoundingClientRect();
    return {u, v, x: event.clientX - windowRect.left, y: event.clientY - windowRect.top};
}

function sceneWorldPosition(u: number, v: number, asset: string): number[] | null {
    if (!renderCamera || !simulationImage.naturalWidth || !simulationImage.naturalHeight) return null;
    const camera = renderCamera;
    const right = renderCameraRight(camera);
    const halfWidth = (simulationImage.naturalWidth / simulationImage.naturalHeight) * (camera.top - camera.bottom) / 2;
    const imageX = camera.center + (2 * u - 1) * halfWidth;
    const imageY = camera.bottom + (1 - v) * (camera.top - camera.bottom);
    const ray = camera.forward.map((value, index) => value * camera.near + right[index] * imageX + camera.up[index] * imageY);
    if (Math.abs(ray[2]) < 1e-6) return null;
    const z = asset === "hammer" ? 0.08 : 0.04;
    const distanceToTable = (z - camera.position[2]) / ray[2];
    if (distanceToTable <= 0) return null;
    const x = camera.position[0] + ray[0] * distanceToTable;
    const y = camera.position[1] + ray[1] * distanceToTable;
    if (Math.abs(x) > 1 || Math.abs(y) > 1) return null;
    return [Number(x.toFixed(3)), Number(y.toFixed(3)), z];
}

function updateSceneDropPreview(event: DragEvent): void {
    const asset = draggedSceneAsset;
    const point = sceneImagePoint(event);
    if (!asset || !point || !editorPreviewActive) {
        sceneDropPreview.hidden = true;
        return;
    }
    const position = sceneWorldPosition(point.u, point.v, asset);
    sceneDropPreview.hidden = false;
    sceneDropPreview.style.left = `${point.x}px`;
    sceneDropPreview.style.top = `${point.y}px`;
    sceneDropPreview.classList.toggle("invalid", !position);
    sceneDropShape.textContent = {box: "▣", sphere: "●", cylinder: "▯", hammer: "⚒"}[asset] ?? "▣";
    sceneDropLabel.textContent = position
        ? `${asset} · x ${position[0]}, y ${position[1]} · release to place`
        : "Move over the table to place";
}

function dropSceneAsset(event: DragEvent): void {
    event.preventDefault();
    sceneDropPreview.hidden = true;
    const asset = event.dataTransfer?.getData("application/x-mujoco-asset");
    if (!asset || !["box", "sphere", "cylinder", "hammer"].includes(asset) || !editorPreviewActive) return;
    const point = sceneImagePoint(event);
    const position = point && sceneWorldPosition(point.u, point.v, asset);
    if (!position) {
        setStatus("Choose a point on the table to place the asset", "idle");
        return;
    }
    addSceneAsset(asset, position);
    selectedSceneAsset = sceneAssets.length - 1;
    renderSceneGizmo();
    if (editorPreviewActive && socket) {
        const previous = socket;
        socket = null;
        previous.close();
        window.setTimeout(() => connectToSimulation(false, true), 180);
    }
    setStatus(`${asset} added — updating GPU editor scene…`, "connecting");
    sceneMessage.textContent = `${asset} added to the scene. Save it in Experiment setup.`;
}
const simulationWindow = document.querySelector<HTMLElement>(".simulation-window")!;
sceneGizmo.querySelectorAll<HTMLButtonElement>("[data-gizmo-mode]").forEach((button) => button.addEventListener("click", () => {
    gizmoMode = button.dataset.gizmoMode === "rotate" ? "rotate" : "move";
    sceneGizmo.querySelectorAll("[data-gizmo-mode]").forEach((item) => item.classList.toggle("active", item === button));
}));
sceneGizmoAxes.addEventListener("pointerdown", (event) => {
    const target = (event.target as Element).closest<SVGGElement>("[data-axis]");
    if (!target || selectedSceneAsset < 0 || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const axis = Number(target.dataset.axis);
    const asset = sceneAssets[selectedSceneAsset];
    const center = projectScenePoint(asset.position);
    const endpoint = projectScenePoint(asset.position.map((value, i) => value + (i === axis ? 0.16 : 0)));
    if (!center || !endpoint) return;
    const length = Math.hypot(endpoint.x - center.x, endpoint.y - center.y) || 1;
    gizmoDrag = {pointerId: event.pointerId, axis, startX: event.clientX, startY: event.clientY, position: [...asset.position], rotation: [...asset.rotation], direction: [(endpoint.x - center.x) / length, (endpoint.y - center.y) / length]};
    sceneGizmoAxes.setPointerCapture(event.pointerId);
});
sceneGizmoAxes.addEventListener("pointermove", (event) => {
    if (!gizmoDrag || gizmoDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const asset = sceneAssets[selectedSceneAsset];
    const deltaX = event.clientX - gizmoDrag.startX;
    const deltaY = event.clientY - gizmoDrag.startY;
    if (gizmoMode === "move") {
        const pixels = deltaX * gizmoDrag.direction[0] + deltaY * gizmoDrag.direction[1];
        asset.position[gizmoDrag.axis] = Number(Math.max(gizmoDrag.axis === 2 ? 0.01 : -1, Math.min(1, gizmoDrag.position[gizmoDrag.axis] + pixels * 0.16 / 64)).toFixed(3));
    } else {
        asset.rotation[gizmoDrag.axis] = Number((gizmoDrag.rotation[gizmoDrag.axis] + (deltaX - deltaY) * 0.8).toFixed(1));
    }
    renderSceneGizmo();
    sendSimulationCommand({type: "scene_transform", index: selectedSceneAsset, position: asset.position, rotation: asset.rotation});
});
function finishGizmoDrag(event: PointerEvent): void {
    if (!gizmoDrag || gizmoDrag.pointerId !== event.pointerId) return;
    gizmoDrag = null;
    renderSceneDraft();
}
sceneGizmoAxes.addEventListener("pointerup", finishGizmoDrag);
sceneGizmoAxes.addEventListener("pointercancel", finishGizmoDrag);
simulationWindow.addEventListener("dragover", (event) => {
    if (event.dataTransfer?.types.includes("application/x-mujoco-asset")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        updateSceneDropPreview(event);
    }
});
simulationWindow.addEventListener("dragleave", (event) => {
    if (!simulationWindow.contains(event.relatedTarget as Node | null)) sceneDropPreview.hidden = true;
});
simulationWindow.addEventListener("drop", dropSceneAsset);
simulationImage.addEventListener("wheel", zoomCamera, {passive: false});
resetCameraButton.addEventListener("click", () => sendSimulationCommand({type: "camera_reset"}));
sceneAccountButton.addEventListener("click", () => {
    const opening = sceneAccountPanel.hasAttribute("hidden");
    setSceneAccountOpen(opening);
    if (opening) void loadUserList(false);
});
setupButton.addEventListener("click", () => { setSceneAccountOpen(false); openSetupPanel(); });
editConfigurationButton.addEventListener("click", () => { setSceneAccountOpen(false); openSetupPanel(); });
closeSetupButton.addEventListener("click", closeSetupPanel);
setupOverlay.addEventListener("click", closeSetupPanel);
resetSetupButton.addEventListener("click", resetConfiguration);
generateObjectButton.addEventListener("click", generateObject);
document.querySelectorAll<HTMLButtonElement>("[data-scene-asset]").forEach((button) => button.addEventListener("click", () => addSceneAsset(button.dataset.sceneAsset ?? "box")));
sceneExistingUserButton.addEventListener("click", () => {
    if (!sceneUserSelect.value) return;
    sceneUserInput.value = sceneUserSelect.value;
    void loadSceneList();
});
sceneUserButton.addEventListener("click", () => void loadSceneList());
sceneUserInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void loadSceneList();
});
sceneLoadButton.addEventListener("click", () => void loadScene());
sceneSelect.addEventListener("dblclick", () => void loadScene());
sceneSaveButton.addEventListener("click", () => void saveScene());
sceneNameInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void saveScene();
});
document.querySelectorAll<HTMLButtonElement>("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
        objectPrompt.value = button.dataset.prompt ?? "";
        objectPrompt.focus();
    });
});
robotPreset.addEventListener("change", () => {
    populateTask(taskIdFromPreset(robotPreset.value));
});
policyPreset.addEventListener("change", () => {
    const matchingTask = (Object.keys(taskCatalog) as TaskId[]).find(
        (taskId) => taskCatalog[taskId].policyPreset === policyPreset.value,
    );
    if (matchingTask) populateTask(matchingTask);
});

setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateConfiguration()) return;
    resetSimulationForConfiguration();
    applyConfiguration();
    closeSetupPanel();
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!sceneAccountPanel.hidden) setSceneAccountOpen(false);
    else if (setupPanel.classList.contains("open")) closeSetupPanel();
    else if (workbench.classList.contains("editor-open")) setEditorOpen(false);
    else if (workbench.classList.contains("logs-open")) setLogsOpen(false);
});

document.addEventListener("pointerdown", (event) => {
    const target = event.target as Node;
    if (!sceneAccountPanel.hidden && !sceneAccountPanel.contains(target) && !sceneAccountButton.contains(target)) {
        setSceneAccountOpen(false);
    }
});

window.addEventListener("beforeunload", () => {
    socket?.close();

    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
    }
});

window.addEventListener("load", () => {
    void (async () => {
        await refreshPublishedBackendUrl();
        await loadSceneList(false);
        if (!simulationImage.classList.contains("visible") && !socket) connectToSimulation(false, true);
    })();
});
