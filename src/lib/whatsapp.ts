export function whatsappLink(number: string, message: string) {
  const digits = (number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(number: string, message: string) {
  window.open(whatsappLink(number, message), "_blank", "noopener,noreferrer");
}
