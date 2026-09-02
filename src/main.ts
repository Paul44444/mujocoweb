import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <nav class="navbar">
    <div class="nav-content">
      <div class="nav-logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span class="nav-title">DAPG Web Demo</span>
      </div>
      <div class="nav-tabs">
        <button class="nav-tab active" data-tab="demo">Live Demo</button>
        <button class="nav-tab" data-tab="about">About</button>
      </div>
    </div>
  </nav>

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

      <section class="simulation-card">
        <div class="simulation-header">
          <div>
            <h2>Live Simulation</h2>
            <p id="statusText">Not connected</p>
          </div>

          <div class="controls">
            <span id="statusIndicator" class="status-indicator"></span>
            <button id="setupButton" class="setup-button" type="button" aria-haspopup="dialog" aria-controls="setupPanel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.06 1.52 1.7 1.7 0 0 0 1.88-.34L17 4.2 19.83 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>
              </svg>
              Experiment setup
            </button>
            <button id="startButton">Start Simulation</button>
          </div>
        </div>

        <div class="simulation-window">
          <img
            id="simulationImage"
            alt="Live MuJoCo simulation"
          />

          <div id="placeholder" class="placeholder">
            <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <p>Press "Start Simulation" to begin</p>
          </div>
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
      </section>

      <div class="info-banner">
        <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span id="interactionHint">Click on the simulation window to set target positions for the robotic hand</span>
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
`;

const startButton =
    document.querySelector<HTMLButtonElement>("#startButton")!;

const simulationImage =
    document.querySelector<HTMLImageElement>("#simulationImage")!;

const placeholder =
    document.querySelector<HTMLDivElement>("#placeholder")!;

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

let socket: WebSocket | null = null;
let currentImageUrl: string | null = null;
let lastFocusedElement: HTMLElement | null = null;

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
        const response = await fetch("https://mujocoweb-backend.onrender.com/api/objects/generate", {
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

function connectToSimulation(): void {
    if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING)
    ) {
        return;
    }

    setStatus("Connecting to Python backend…", "connecting");
    startButton.disabled = true;

    const websocketUrl = new URL(
        "wss://mujocoweb-backend.onrender.com/ws/simulation",
    );
    websocketUrl.searchParams.set("task", selectedTaskId);
    if (generatedObject && selectedTaskId === "relocate") {
        websocketUrl.searchParams.set("object", JSON.stringify(generatedObject));
    }

    console.log("Connecting to WebSocket:", websocketUrl);
    socket = new WebSocket(websocketUrl.toString());

    socket.binaryType = "blob";

    socket.onopen = () => {
        console.log("WebSocket opened:", websocketUrl);
        setStatus("Connected", "connected");
        startButton.textContent = "Simulation running";
    };

    socket.onerror = (event) => {
        console.error("WebSocket error:", event);
        setStatus("WebSocket connection failed", "error");
    };

    socket.onclose = (event) => {
        console.log("WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
        });

        socket = null;
        startButton.disabled = false;
        startButton.textContent = "Start simulation";

        if (statusText.textContent !== "Simulation finished") {
            setStatus(
                `Disconnected (${event.code}${event.reason ? `: ${event.reason}` : ""})`,
                "idle",
            );
        }
    };

    socket.onmessage = (event: MessageEvent) => {
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
                startButton.textContent = "Run again";
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

// Tab switching functionality
const navTabs = document.querySelectorAll<HTMLButtonElement>(".nav-tab");
const tabContents = document.querySelectorAll<HTMLElement>(".tab-content");

navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;

        navTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        tabContents.forEach((content) => {
            if (content.id === `${targetTab}-section`) {
                content.classList.add("active");
            } else {
                content.classList.remove("active");
            }
        });
    });
});

startButton.addEventListener("click", connectToSimulation);
simulationImage.addEventListener("click", handleSimulationClick);
setupButton.addEventListener("click", openSetupPanel);
editConfigurationButton.addEventListener("click", openSetupPanel);
closeSetupButton.addEventListener("click", closeSetupPanel);
setupOverlay.addEventListener("click", closeSetupPanel);
resetSetupButton.addEventListener("click", resetConfiguration);
generateObjectButton.addEventListener("click", generateObject);
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
    applyConfiguration();
    closeSetupPanel();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && setupPanel.classList.contains("open")) {
        closeSetupPanel();
    }
});

window.addEventListener("beforeunload", () => {
    socket?.close();

    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
    }
});
