
/// <reference types="vite/client" />

// Extend Window interface to include chrome property for extension detection
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        getManifest?: () => any;
      };
    };
  }
}

export {};
