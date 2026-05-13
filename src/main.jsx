import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BibliothequeDesPensees from "./BibliothequeDesPensees.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <BibliothequeDesPensees />
  </StrictMode>
);

if (window.__hideSplash) window.__hideSplash();