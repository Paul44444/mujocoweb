import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="page">
    <section class="hero">
      <p class="eyebrow">DAPG · MuJoCo · RoboHive</p>
      <h1>Robotic Hand Simulation</h1>
      <p class="description">
        A trained DAPG policy running in Python and streamed live to the browser.
      </p>
    </section>
    
    <section class="simulation-card">
      <div class="simulation-header">
        <div>
          <h2>Live simulation</h2>
          <p id="statusText">Not connected</p>
        </div>

        <div class="controls">
          <span id="statusIndicator" class="status-indicator"></span>
          <button id="startButton">Start simulation</button>
        </div>
      </div>
      
      <div class="simulation-window">
        <img
          id="simulationImage"
          alt="Live MuJoCo simulation"
        />
      
        <div id="placeholder" class="placeholder">
          Press “Start simulation” to begin.
        </div>
      </div>
      
      <div class="metadata">
        <span>Episode: <strong id="episodeValue">—</strong></span>
        <span>Step: <strong id="stepValue">—</strong></span>
        <span>Reward: <strong id="rewardValue">—</strong></span>
        <span>Simulation time: <strong id="timeValue">—</strong></span>
      </div>
    </section>
  </main>
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

let socket: WebSocket | null = null;
let currentImageUrl: string | null = null;

function setStatus(
    text: string,
    state: "idle" | "connecting" | "connected" | "error",
): void {
    statusText.textContent = text;
    statusIndicator.className = `status-indicator ${state}`;
}

function handleSimulationClick(event: MouseEvent): void {
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

    socket = new WebSocket(
        "ws://127.0.0.1:8000/ws/simulation",
    );

    socket.binaryType = "blob";

    socket.onopen = () => {
        setStatus("Connected", "connected");
        startButton.textContent = "Simulation running";
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

    socket.onerror = () => {
        setStatus("WebSocket connection failed", "error");
    };

    socket.onclose = () => {
        socket = null;
        startButton.disabled = false;
        startButton.textContent = "Start simulation";

        if (statusText.textContent !== "Simulation finished") {
            setStatus("Disconnected", "idle");
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

startButton.addEventListener("click", connectToSimulation);
simulationImage.addEventListener("click", handleSimulationClick);

window.addEventListener("beforeunload", () => {
    socket?.close();

    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
    }
});