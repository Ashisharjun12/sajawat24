import { GOOGLE_CLIENT_ID } from "@/lib/env";

const GIS_SRC = "https://accounts.google.com/gsi/client";

let loadPromise = null;
let initialized = false;
let onCredential = null;

function gisClient() {
  return window.google?.accounts?.id;
}

function handleCredentialResponse(response) {
  const credential = response?.credential;
  if (typeof credential === "string" && credential.length > 0) {
    onCredential?.(credential);
  }
}

export function setGoogleCredentialHandler(handler) {
  onCredential = handler;
}

export function loadGoogleGis() {
  if (gisClient()) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      if (gisClient()) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Sign-In failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Google Sign-In failed to load"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function ensureGoogleGis() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Sign-In is not configured");
  }

  await loadGoogleGis();
  const id = gisClient();
  if (!id) {
    throw new Error("Google Sign-In is unavailable");
  }

  if (!initialized) {
    id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    initialized = true;
  }

  return id;
}

export function renderGoogleButton(element) {
  const id = gisClient();
  if (!id || !element) {
    return;
  }

  element.replaceChildren();
  id.renderButton(element, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    width: Math.max(Math.floor(element.offsetWidth) || 320, 200),
  });
}

export async function promptGoogleSignIn() {
  const id = await ensureGoogleGis();

  return new Promise((resolve, reject) => {
    let settled = false;
    const previous = onCredential;

    const finish = (error, credential) => {
      if (settled) {
        return;
      }
      settled = true;
      onCredential = previous;
      if (error) {
        reject(error);
        return;
      }
      resolve(credential);
    };

    onCredential = (credential) => finish(null, credential);

    id.prompt((notification) => {
      if (settled) {
        return;
      }
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const error = new Error("Google prompt was blocked");
        error.code = "PROMPT_BLOCKED";
        finish(error);
      }
    });
  });
}
