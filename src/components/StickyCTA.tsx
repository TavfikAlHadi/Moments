import { WhatsAppIcon, WHATSAPP_NUMBER } from './Footer'

const MESSAGE = encodeURIComponent("Hi Moments, I'd like to ask about restoring/digitising a photo.")

// Mobile-only sticky bar — the WhatsApp-first CTA feedback asked for, without
// touching the existing desktop hero/nav CTAs.
export default function StickyCTA() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`}
      target="_blank"
      rel="noreferrer"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-center gap-2 bg-teal text-cream py-3.5 font-semibold shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
    >
      <WhatsAppIcon size={18} />
      WhatsApp us a photo
    </a>
  )
}
