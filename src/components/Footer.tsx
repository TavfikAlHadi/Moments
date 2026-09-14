import { Phone, Mail, MapPin } from 'lucide-react'

export function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.24 8.24-1.43 0-2.84-.37-4.08-1.08l-.29-.17-3.12.82.83-3.04-.19-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24l-.13-.08Zm-4.52 4.6c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.09.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.47-.28-.25-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.55.12-.16.25-.63.79-.77.95-.14.16-.28.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.38-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.47Z" />
    </svg>
  )
}

export const WHATSAPP_NUMBER = '601164947110' // 011-64947110, Malaysia country code

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/60 py-14">
      <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-3 gap-10">
        <div>
          <a href="#top">
            <img src="/moments-logo.svg" alt="Moments" className="h-9 w-auto" />
          </a>
          <p className="mt-3 text-sm leading-relaxed">
            Moments — Photo Restoration &amp; Digitisation, based in Kuala Lumpur.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Phone size={16} />
            <a href="tel:+60322017110" className="hover:text-cream transition-colors">
              +603 2201 7110
            </a>
          </p>
          <p className="flex items-center gap-2">
            <WhatsAppIcon />
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cream transition-colors"
            >
              +6011 6494 7110
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Mail size={16} />
            <a href="mailto:contact@innotribesolutions.com" className="hover:text-cream transition-colors">
              contact@innotribesolutions.com
            </a>
          </p>
          <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> No.21-7 Boulevard Office, Mid Valley City, 51200 Kuala Lumpur</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm sm:items-end">
          <a href="#how-it-works" className="hover:text-cream transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-cream transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-cream transition-colors">FAQ</a>
          <a href="#contact" className="hover:text-cream transition-colors">Contact Us</a>
        </nav>
      </div>

      <p className="mt-10 text-center text-xs text-cream/30">
        © {new Date().getFullYear()} Moments by Innotribe Solutions. All rights reserved.
      </p>
    </footer>
  )
}
