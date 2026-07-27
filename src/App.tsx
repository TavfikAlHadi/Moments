import { useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import NeverLost from './components/NeverLost'
import HowItWorks from './components/HowItWorks'
import UseCases from './components/UseCases'
import PriceCalculator from './components/PriceCalculator'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import VideoTeaser from './components/VideoTeaser'
import LeadForm from './components/LeadForm'
import Footer from './components/Footer'

export default function App() {
  const [quotePrefill, setQuotePrefill] = useState('')

  return (
    <div className="min-h-screen">
      <Nav onGetQuote={() => setQuotePrefill('')} />
      <main>
        <Hero onGetQuote={() => setQuotePrefill('')} />
        <NeverLost />
        <HowItWorks />
        <UseCases />
        <PriceCalculator onSelectQuote={setQuotePrefill} />
        <Testimonials />
        <FAQ />
        <VideoTeaser />
        <LeadForm prefill={quotePrefill} />
      </main>
      <Footer />
    </div>
  )
}
