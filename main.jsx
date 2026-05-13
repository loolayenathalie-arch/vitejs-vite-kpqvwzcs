import { StrictMode } from "react";
import { createRoot }  from "react-dom/client";
import BibliothequeDesPensees from "./BibliothequeDesPensees.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <BibliothequeDesPensees />
  </StrictMode>
);

// Cache le splash dès que React a rendu
if (window.__hideSplash) window.__hideSplash();
