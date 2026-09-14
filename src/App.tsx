import { useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import NeverLost from './components/NeverLost'
import HowItWorks from './components/HowItWorks'
import UseCases from './components/UseCases'
import TrustSection from './components/TrustSection'
import StickyCTA from './components/StickyCTA'
import PriceCalculator from './components/PriceCalculator'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import VideoTeaser from './components/VideoTeaser'
import LeadForm from './components/LeadForm'
import Footer from './components/Footer'
import OrderForm from './components/OrderForm'
import OrderSuccess from './components/OrderSuccess'

export default function App() {
  const [orderTier, setOrderTier] = useState<{
    name: string
    price: number
    notes?: string
    custom?: { photos: number; restore: boolean }
  } | null>(null)

  if (new URLSearchParams(window.location.search).has('session_id')) {
    return <OrderSuccess />
  }

  return (
    <div className="min-h-screen pb-14 md:pb-0">
      <Nav />
      <main>
        <Hero />
        <NeverLost />
        <HowItWorks />
        <UseCases />
        <TrustSection />
        <PriceCalculator onOrder={setOrderTier} />
        <Testimonials />
        <FAQ />
        <VideoTeaser />
        <LeadForm prefill="" />
      </main>
      <Footer />
      <OrderForm key={orderTier?.name ?? 'closed'} tier={orderTier} onClose={() => setOrderTier(null)} />
      <StickyCTA />
    </div>
  )
}
