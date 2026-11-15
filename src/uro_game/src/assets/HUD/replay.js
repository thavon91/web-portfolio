export function replayGame() {
  const snapshot = { time: document.querySelector(".victory-time")?.textContent ?? "", background: "" };
  window.dispatchEvent(new CustomEvent("uro:capture-replay", { detail: snapshot }));
  try { sessionStorage.setItem("uro-replay-result", JSON.stringify(snapshot)); } catch { /* Optional backdrop cache. */ }
  const url = new URL(window.location.href);
  url.searchParams.set("replay", "1");
  url.searchParams.set("result", document.querySelector("#victory-screen") ? "victory" : "game-over");
  window.location.assign(url.href);
}

export function consumeReplayRequest(url, replaceUrl) {
  const next = new URL(url);
  if (next.searchParams.get("replay") !== "1") return false;
  next.searchParams.delete("replay");
  next.searchParams.delete("result");
  replaceUrl(next.href);
  return true;
}
