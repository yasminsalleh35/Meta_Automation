import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function openPaymentCheckout(url: string, onFallback?: () => void, onSuccess?: () => void) {
  // Tenta abrir em nova aba
  const newWindow = window.open(url, '_blank');
  
  // Verifica se foi bloqueado (popup blocker)
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // Fallback: redireciona na mesma aba após delay
    onFallback?.();
    
    setTimeout(() => {
      window.location.href = url;
    }, 1000);
    
    return false; // Indica que usou fallback
  } else {
    // Sucesso: nova aba foi aberta
    onSuccess?.();
    return true; // Indica que abriu nova aba
  }
}
