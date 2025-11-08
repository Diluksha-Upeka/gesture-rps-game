/*
 * Gesture Recognition RPS Skeleton
 * --------------------------------
 * Vanilla JS implementation scaffold using MediaPipe Hands for real-time gesture recognition.
 * Filled with TODO markers to help the team plug in custom UI/UX, AI behaviours, and polish.
 */

const VIDEO_WIDTH = 960;
const VIDEO_HEIGHT = 540;
const COUNTDOWN_SECONDS = 3;
const HAND_PRESENT_TIMEOUT_MS = 1200;
const THUMB_EXTENSION_TOLERANCE = 0.12; // loosen threshold to accommodate camera noise
const FINGER_EXTENSION_TOLERANCE = 0.02;

const GESTURE = {
    ROCK: "rock",
    PAPER: "paper",
    SCISSORS: "scissors",
    UNKNOWN: "unknown",
};

const AI_MODE = {
    NORMAL: "normal",
    EVIL: "evil",
};

const gestureIcons = {
    [GESTURE.ROCK]: "assets/rock.png",
    [GESTURE.PAPER]: "assets/paper.png",
    [GESTURE.SCISSORS]: "assets/scissors.png",
    [GESTURE.UNKNOWN]: "assets/rock.png", // default fallback icon
};

let handsInstance;
let cameraInstance;
let lastHandTimestamp = 0;
let lastRecognizedGesture = GESTURE.UNKNOWN;
let isCountdownRunning = false;
let activeCountdownTimer;
let countdownValue = COUNTDOWN_SECONDS;
let currentMode = AI_MODE.NORMAL;
let isOverlayVisible = true;
let debugEnabled = true;

const state = {
    scores: {
        player: 0,
        ai: 0,
        draw: 0,
    },
};

const elements = {};

window.addEventListener("DOMContentLoaded", init);

async function init() {
    cacheDomElements();
    attachEventListeners();
    prepareCanvas();
    displayDebug("Initializing camera...");
    await initializeMediaPipe();
}

function cacheDomElements() {
    elements.video = document.getElementById("player-video");
    elements.canvas = document.getElementById("landmark-canvas");
    elements.canvasCtx = elements.canvas.getContext("2d");
    elements.status = document.getElementById("hand-detection-status");
    elements.debug = document.getElementById("debug-info");
    elements.countdown = document.getElementById("countdown-display");
    elements.banner = document.getElementById("result-banner");
    elements.playerScore = document.getElementById("player-score");
    elements.aiScore = document.getElementById("ai-score");
    elements.drawScore = document.getElementById("draw-score");
    elements.playerGestureImg = document.getElementById("player-gesture-img");
    elements.playerGestureLabel = document.getElementById("player-gesture-label");
    elements.aiGestureImg = document.getElementById("ai-gesture-img");
    elements.aiGestureLabel = document.getElementById("ai-gesture-label");
    elements.startNormalBtn = document.getElementById("start-normal-btn");
    elements.startEvilBtn = document.getElementById("start-evil-btn");
    elements.toggleOverlayBtn = document.getElementById("toggle-overlay-btn");
    elements.muteCheckbox = document.getElementById("mute-audio");
    elements.audio = {
        win: document.getElementById("sfx-win"),
        lose: document.getElementById("sfx-lose"),
        draw: document.getElementById("sfx-draw"),
    };
}

function attachEventListeners() {
    elements.startNormalBtn.addEventListener("click", () => startRound(AI_MODE.NORMAL));
    elements.startEvilBtn.addEventListener("click", () => startRound(AI_MODE.EVIL));
    elements.toggleOverlayBtn.addEventListener("click", toggleOverlayVisibility);
    elements.muteCheckbox.addEventListener("change", onMuteToggle);
}

function prepareCanvas() {
    elements.canvas.width = VIDEO_WIDTH;
    elements.canvas.height = VIDEO_HEIGHT;
}

async function initializeMediaPipe() {
    if (!navigator.mediaDevices?.getUserMedia) {
        alert("getUserMedia not supported in this browser. Please switch to Chrome.");
        return;
    }

    handsInstance = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
    });

    handsInstance.onResults(onResults);

    cameraInstance = new Camera(elements.video, {
        onFrame: async () => {
            await handsInstance.send({ image: elements.video });
        },
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
    });

    cameraInstance.start().then(() => {
        displayDebug("Camera started. Show your hand to begin.");
    }).catch((error) => {
        console.error("Camera start failed", error);
        alert("Unable to access webcam. Ensure you granted permissions.");
    });
}

function onResults(results) {
    const now = performance.now();
    clearCanvas();

    const handPresent = results.multiHandLandmarks && results.multiHandLandmarks.length;

    if (handPresent) {
        lastHandTimestamp = now;
        const landmarks = results.multiHandLandmarks[0];
        const handedness = results.multiHandedness?.[0]?.label || "Right";

        if (isOverlayVisible) {
            drawHandOverlay(landmarks, results);
        }

        const fingerStates = computeFingerStates(landmarks, handedness);
        const gesture = classifyGesture(fingerStates);
        lastRecognizedGesture = gesture;

        updatePlayerGestureUi(gesture);
        updateHandStatus(true);
        updateDebugPanel({ fingerStates, gesture, handedness });
    } else {
        const timeSinceLastHand = now - lastHandTimestamp;
        if (timeSinceLastHand > HAND_PRESENT_TIMEOUT_MS) {
            lastRecognizedGesture = GESTURE.UNKNOWN;
            updatePlayerGestureUi(GESTURE.UNKNOWN);
            updateHandStatus(false);
        }
    }
}

function drawHandOverlay(landmarks, results) {
    const ctx = elements.canvasCtx;
    ctx.save();
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    ctx.globalAlpha = 0.9;

    const { drawConnectors, drawLandmarks } = window;
    if (drawConnectors && drawLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#ffb703", lineWidth: 5 });
        drawLandmarks(ctx, landmarks, { color: "#8ecae6", lineWidth: 2 });
    } else {
        // Minimal fallback drawing if drawing_utils is not yet loaded.
        ctx.fillStyle = "#ffb703";
        landmarks.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x * elements.canvas.width, point.y * elements.canvas.height, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    ctx.restore();
}

function clearCanvas() {
    elements.canvasCtx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
}

function computeFingerStates(landmarks, handedness) {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];

    const isRightHand = handedness.toLowerCase() === "right";

    const thumbExtended = isRightHand
        ? thumbTip.x < thumbIP.x - THUMB_EXTENSION_TOLERANCE
        : thumbTip.x > thumbIP.x + THUMB_EXTENSION_TOLERANCE;

    const fingerDescriptors = {
        index: { tip: 8, pip: 6 },
        middle: { tip: 12, pip: 10 },
        ring: { tip: 16, pip: 14 },
        pinky: { tip: 20, pip: 18 },
    };

    const fingerStates = {
        thumb: thumbExtended,
        index: false,
        middle: false,
        ring: false,
        pinky: false,
    };

    Object.entries(fingerDescriptors).forEach(([name, { tip, pip }]) => {
        const tipLandmark = landmarks[tip];
        const pipLandmark = landmarks[pip];
        const extended = tipLandmark.y < pipLandmark.y - FINGER_EXTENSION_TOLERANCE;
        fingerStates[name] = extended;
    });

    // Basic wrist depth check to ensure hand faces the camera before enabling countdown.
    fingerStates.confidence = Math.abs(wrist.z) < 0.2 ? "front" : "angled";

    return fingerStates;
}

function classifyGesture(fingers) {
    const { thumb, index, middle, ring, pinky } = fingers;

    const allExtended = thumb && index && middle && ring && pinky;
    const noneExtended = !thumb && !index && !middle && !ring && !pinky;
    const scissors = !thumb && index && middle && !ring && !pinky;

    if (allExtended) {
        return GESTURE.PAPER;
    }
    if (noneExtended) {
        return GESTURE.ROCK;
    }
    if (scissors) {
        return GESTURE.SCISSORS;
    }

    return GESTURE.UNKNOWN;
}

function updatePlayerGestureUi(gesture) {
    elements.playerGestureImg.src = gestureIcons[gesture] || gestureIcons[GESTURE.UNKNOWN];
    elements.playerGestureLabel.textContent = gesture === GESTURE.UNKNOWN ? "Unclear" : gesture.toUpperCase();
}

function updateHandStatus(hasHand) {
    elements.status.textContent = hasHand ? "Hand detected" : "Waiting for hand...";
    elements.status.dataset.detected = hasHand;
}

function updateDebugPanel(payload) {
    if (!debugEnabled) {
        return;
    }
    const formatted = JSON.stringify(payload, null, 2);
    elements.debug.textContent = formatted;
}

function startRound(mode) {
    if (isCountdownRunning) {
        return;
    }

    const timeSinceLastHand = performance.now() - lastHandTimestamp;
    if (timeSinceLastHand > HAND_PRESENT_TIMEOUT_MS) {
        elements.countdown.textContent = "Show your hand to start";
        return;
    }

    currentMode = mode;
    isCountdownRunning = true;
    disableStartButtons(true);
    resetCountdownUi();
    runCountdown();
}

function disableStartButtons(disabled) {
    elements.startNormalBtn.disabled = disabled;
    elements.startEvilBtn.disabled = disabled;
}

function resetCountdownUi() {
    countdownValue = COUNTDOWN_SECONDS;
    elements.countdown.textContent = "Ready";
    elements.banner.classList.remove("win", "lose", "draw");
    elements.banner.textContent = "Counting down...";
    // TODO: Trigger pre-round animation (lighting, pulses, etc.).
}

function runCountdown() {
    elements.countdown.textContent = countdownValue;

    activeCountdownTimer = setInterval(() => {
        countdownValue -= 1;
        if (countdownValue > 0) {
            elements.countdown.textContent = countdownValue;
            return;
        }

        clearInterval(activeCountdownTimer);
        elements.countdown.textContent = "SHOOT!";

        // Brief delay to allow final frame update.
        setTimeout(() => {
            concludeRound();
        }, 200);
    }, 1000);
}

function concludeRound() {
    const playerGesture = lastRecognizedGesture;
    const aiGesture = chooseAiGesture(currentMode, playerGesture);

    updateAiGestureUi(aiGesture);
    determineWinner(playerGesture, aiGesture);

    setTimeout(() => {
        elements.countdown.textContent = "Hand ready?";
        disableStartButtons(false);
        isCountdownRunning = false;
    }, 1500);
}

function chooseAiGesture(mode, playerGesture) {
    if (mode === AI_MODE.EVIL && playerGesture !== GESTURE.UNKNOWN) {
        return getWinningGestureAgainst(playerGesture);
    }

    const options = [GESTURE.ROCK, GESTURE.PAPER, GESTURE.SCISSORS];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}

function getWinningGestureAgainst(playerGesture) {
    switch (playerGesture) {
        case GESTURE.ROCK:
            return GESTURE.PAPER;
        case GESTURE.PAPER:
            return GESTURE.SCISSORS;
        case GESTURE.SCISSORS:
            return GESTURE.ROCK;
        default:
            return chooseAiGesture(AI_MODE.NORMAL, GESTURE.UNKNOWN);
    }
}

function updateAiGestureUi(gesture) {
    elements.aiGestureImg.src = gestureIcons[gesture] || gestureIcons[GESTURE.UNKNOWN];
    elements.aiGestureLabel.textContent = gesture.toUpperCase();
}

function determineWinner(playerGesture, aiGesture) {
    if (playerGesture === GESTURE.UNKNOWN) {
        elements.banner.textContent = "Gesture unclear. Try again.";
        elements.banner.classList.remove("win", "lose", "draw");
        playSfx("draw");
        return;
    }

    if (playerGesture === aiGesture) {
        state.scores.draw += 1;
        updateScores();
        elements.banner.textContent = "It's a draw!";
        elements.banner.classList.add("draw");
        playSfx("draw");
        return;
    }

    const playerWins =
        (playerGesture === GESTURE.ROCK && aiGesture === GESTURE.SCISSORS) ||
        (playerGesture === GESTURE.PAPER && aiGesture === GESTURE.ROCK) ||
        (playerGesture === GESTURE.SCISSORS && aiGesture === GESTURE.PAPER);

    if (playerWins) {
        state.scores.player += 1;
        updateScores();
        elements.banner.textContent = "Player wins!";
        elements.banner.classList.remove("lose", "draw");
        elements.banner.classList.add("win");
        playSfx("win");
        triggerWinSequence();
    } else {
        state.scores.ai += 1;
        updateScores();
        elements.banner.textContent = "AI takes the round!";
        elements.banner.classList.remove("win", "draw");
        elements.banner.classList.add("lose");
        playSfx("lose");
        triggerLoseSequence();
    }
}

function updateScores() {
    elements.playerScore.textContent = state.scores.player;
    elements.aiScore.textContent = state.scores.ai;
    elements.drawScore.textContent = state.scores.draw;
}

function playSfx(type) {
    if (elements.muteCheckbox.checked) {
        return;
    }
    const audioEl = elements.audio[type];
    if (!audioEl) {
        return;
    }
    audioEl.currentTime = 0;
    audioEl.play().catch((err) => {
        console.warn("Audio blocked", err);
    });
}

function triggerWinSequence() {
    const animationSlot = document.getElementById("animation-slot");
    animationSlot.classList.add("flash-win");
    // TODO: Replace with real animation logic (canvas particles, CSS keyframes, GSAP, etc.).
    setTimeout(() => animationSlot.classList.remove("flash-win"), 1200);
}

function triggerLoseSequence() {
    const animationSlot = document.getElementById("animation-slot");
    animationSlot.classList.add("flash-lose");
    // TODO: Hook in defeat animation (shake, glitch, AI taunts, etc.).
    setTimeout(() => animationSlot.classList.remove("flash-lose"), 1200);
}

function toggleOverlayVisibility() {
    isOverlayVisible = !isOverlayVisible;
    elements.canvas.style.display = isOverlayVisible ? "block" : "none";
    elements.toggleOverlayBtn.textContent = isOverlayVisible ? "Hide Landmarks" : "Show Landmarks";
}

function onMuteToggle() {
    // Placeholder for hooking up UI indicator lights, global audio mixers, etc.
}

function displayDebug(message) {
    if (typeof message === "string") {
        elements.debug.textContent = message;
    }
}

// Exposed helper for future developers to add new AI personalities.
export function registerCustomAiMode(name, resolver) {
    // Attach resolver to a registry to allow dynamic AI modes.
    // Example usage: registerCustomAiMode('mirror', (playerGesture) => playerGesture);
    // TODO: Wire this registry into the UI once custom modes are necessary.
    console.log("Custom AI mode registered:", name, resolver);
}

// Placeholder hooks for media asset swaps and UI upgrades.
export function setGestureIcon(gesture, path) {
    gestureIcons[gesture] = path;
}

export function enableDebugPanel(enabled) {
    debugEnabled = enabled;
    elements.debug.parentElement.style.display = enabled ? "block" : "none";
}
