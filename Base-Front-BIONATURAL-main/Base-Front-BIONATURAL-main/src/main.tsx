
  import { createRoot } from "react-dom/client";
  import App from "./App";
  import "./index.css";
  import { SystemConfigProvider } from "./shared/contexts/SystemConfigContext";
  import { CartProvider } from "./shared/contexts/CartContext";

  createRoot(document.getElementById("root")!).render(
    <SystemConfigProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </SystemConfigProvider>
  );
  