// src/components/InstallPrompt.tsx
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (window as unknown as { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt || null;
  });
  const [isStandalone, setIsStandalone] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    // Detectar si la app ya está instalada / abierta como standalone
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as unknown as { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Si ya está ejecutándose como aplicación instalada, no mostrar el botón
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Error al disparar instalación PWA:", err);
      }
    } else {
      // Si el navegador no ha disparado beforeinstallprompt aún, guiamos al usuario
      setMostrarAyuda(true);
      setTimeout(() => setMostrarAyuda(false), 5000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {mostrarAyuda && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl max-w-xs animate-fade-in border border-slate-700">
          💡 Para instalar en tu dispositivo, abre el menú del navegador (⋮ o Compartir) y selecciona <b>"Instalar aplicación"</b> o <b>"Añadir a pantalla de inicio"</b>.
        </div>
      )}

      <button
        onClick={handleInstallClick}
        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-3 rounded-full font-bold shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all duration-200 cursor-pointer"
        title="Instalar MultiCatálogo como App en tu computadora o teléfono"
      >
        <svg
          className="w-5 h-5 flex-shrink-0 animate-bounce"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="text-sm">Instalar app</span>
      </button>
    </div>
  );
};

export default InstallPrompt;
