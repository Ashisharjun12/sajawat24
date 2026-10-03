import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/plus-jakarta-sans"
import "@fontsource-variable/plus-jakarta-sans/wght-italic.css"
import "./index.css"
import App from "./App.jsx"
import { ThemeProvider } from "./components/ui/theme-provider"
import { TooltipProvider } from "./components/ui/tooltip"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
