import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.DEV) {
    console.log('--- APP STARTUP ---');
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('VITE_USE_MOCK_API:', import.meta.env.VITE_USE_MOCK_API);
}

createRoot(document.getElementById("root")!).render(<App />);
