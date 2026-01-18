'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen background-transparent text-white overflow-x-hidden relative">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center justify-between px-8 lg:px-16 py-5 max-w-[1400px] mx-auto mb-24"
      >
        {/* Left side: Logo + Nav items */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-5">
            <a href="#" className="text-[13px] text-[#999] hover:text-white transition-colors flex items-center gap-1">
              Platform
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#" className="text-[13px] text-[#999] hover:text-white transition-colors">Enterprise</a>
            <a href="#" className="text-[13px] text-[#999] hover:text-white transition-colors">Resources</a>
            <a href="#" className="text-[13px] text-[#999] hover:text-white transition-colors">Company</a>
          </div>
        </div>

        {/* Right side: Auth buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="text-[13px] text-white px-5 py-2 rounded-xl border border-[#333] hover:border-[#555] transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/demo?autostart=true')}
            className="text-[13px] text-white px-5 py-2 rounded-xl border border-[#333] hover:border-[#555] transition-colors"
          >
            Demo
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="px-8 lg:px-16 pt-10 pb-6 max-w-[1400px] mx-auto">
        {/* Hero Heading */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="flex flex-col"
        >
          <motion.h1
            variants={fadeInUp}
            className="text-[38px] md:text-[46px] lg:text-[74px] leading-[1.15] max-w-[650px] text-white"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
          >
            Agentic Digital
          </motion.h1>
          <motion.h1
            variants={fadeInUp}
            className="text-[38px] md:text-[46px] lg:text-[74px] leading-[1.15] mb-4 max-w-[650px] text-white"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
          >
            Audio Workstation
          </motion.h1>
        </motion.div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="whitespace-nowrap text-[#BAB8B8] text-[19px] mb-6 max-w-[500px]" style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Designed for autonomous music systems and structured creativity.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center gap-3 mb-20"
        >
          <button
            className="text-[14px] text-white px-5 py-2.5 rounded-xl border border-[#444] hover:border-[#666] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Learn more
          </button>
          <button
            onClick={() => router.push('/demo?autostart=true')}
            className="text-[14px] text-white px-5 py-2.5 rounded-xl border border-[#444] hover:border-[#666] transition-colors flex items-center gap-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Demo
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#ff7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="flex items-center justify-between mb-3 px-2"
        >
          {['Triage', 'RCA', 'Fix', 'Test'].map((step) => (
            <motion.div
              key={step}
              variants={fadeInUp}
              className="flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12L10 17L19 8" stroke="#000000ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[18px] text-white font-medium tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                {step}
              </span>
            </motion.div>
          ))}
        </motion.div>

      </section>

      {/* Demo Card Section */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="px-8 lg:px-16 pb-20 max-w-[1400px] mx-auto"
      >
        <div className="w-full rounded-xl overflow-hidden relative">
          {/* Base red / brown gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(160,65,55,0.65) 0%, rgba(130,55,45,0.5) 50%, rgba(110,45,38,0.6) 100%)'
            }}
          />

          {/* Pixelated blur overlay */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              backgroundImage: `
          linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)
        `,
              backgroundSize: '48px 48px'
            }}
          />

          {/* Subtle dark vignette for depth */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />

          {/* Content */}
          <div className="p-8 min-h-[350px] relative">
            {/* Testing Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px]"
            >
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#4ade80] flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="3" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-black font-medium">Testing</span>
                  <span className="text-[12px] text-gray-400">› Simulations complete</span>
                </div>

                {/* Test items */}
                <div className="p-3 space-y-2">
                  {[
                    'Happy path: Authenticated user can update billing information',
                    'Edge case: large file upload works',
                    'Edge case: AUD invoices are properly converted to USD',
                    'Security: Viewer permissions fail when trying to edit billing information'
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#4ade80]" />
                        <span className="text-[11px] text-gray-700 line-through">
                          {item}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#4ade80] font-medium">
                        Pass
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="#666"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="text-[12px] text-gray-700 font-medium">
                      Billing Permission Layer Fix
                    </span>
                    <span className="text-[11px] text-gray-400">(2 files)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-green-600">+ 198</span>
                    <span className="text-[11px] text-red-500">- 42</span>
                    <button className="text-[11px] bg-gray-900 text-white px-3 py-1 rounded-md flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2L2 7L12 12L22 7L12 2Z"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </svg>
                      Merge
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>


      {/* AI Support Engineer Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="px-8 lg:px-16 py-20 max-w-[1400px] mx-auto"
      >
        <h2 className="text-[28px] mb-2">An always-on AI support engineer</h2>
        <p className="whitespace-nowrap text-[#BAB8B8] text-[14px] mb-10 max-w-[500px]">
          An AI support engineer that can triage, RCA, and fix customer problems autonomously.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Demo image placeholder */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 min-h-[350px]">
            <div className="bg-[#2a2a2a] rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <span className="text-[#fbbf24]">⚠</span>
              <span className="text-[12px] text-white">Contract renewal failed with FX rounding error on checkout.</span>
            </div>
            <div className="bg-[#1f1f1f] rounded-lg p-3 mb-4 border border-[#333]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-[#4ade80]"></div>
                <span className="text-[11px] text-white">Triage</span>
                <span className="text-[11px] text-gray-500">› Triaged as technical issue</span>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-4">
                <span>→ Approval required</span>
                <span className="text-[#4ade80]">✓ Approved</span>
                <span className="ml-auto text-gray-500">marie@acme.com</span>
              </div>
            </div>
            <div className="bg-[#1f1f1f] rounded-lg p-3 border border-[#333]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                <span className="text-[11px] text-white">Fixing</span>
                <span className="text-[11px] text-gray-500">› Patch prepared</span>
              </div>
              <div className="bg-[#0d1117] rounded p-3 font-mono text-[10px]">
                <div className="text-gray-500">1  2 lines</div>
                <div><span className="text-purple-400">export async function</span> <span className="text-yellow-300">charge</span>(total: number, rate: n...</div>
                <div><span className="text-purple-400">const</span> amount = Math.round(total * rate * 100) / 1...</div>
                <div><span className="text-purple-400">const</span> idKey = request.headers.get('Idempotency-Key...</div>
                <div><span className="text-purple-400">if</span> (idKey) <span className="text-purple-400">await</span> idempotencyCache.set(idKey, amou...</div>
                <div className="text-gray-500">7</div>
                <div><span className="text-purple-400">await</span> <span className="text-blue-300">payments</span>.<span className="text-yellow-300">charge</span>(( amount ))</div>
              </div>
            </div>
          </div>

          {/* Right: Features */}
          <div className="space-y-8 pt-4">
            {[
              { icon: '↗', title: 'Scale customers without scaling headcount', desc: 'Autonomously triages with full context, deflects L1/L2, and handles L3 in minutes—24/7.' },
              { icon: '⊡', title: 'Operate with governance', desc: 'Approvals, diffs, and an audit trail keep fixes safe and compliant.' },
              { icon: '✦', title: 'Evolving agents', desc: 'Constantly learns your flow and the institutional knowledge embedded in your process and software.' },
              { icon: '⇆', title: 'Perfect handoffs for faster resolution', desc: "Delivers full context with proposed fixes and RCA so developers don't have to context switch and can ship fixes faster." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-[16px] text-gray-400">{item.icon}</span>
                <div>
                  <h4 className="text-[14px] font-medium mb-1">{item.title}</h4>
                  <p className="text-[13px] text-[#777] text-[#BAB8B8] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
            <button className="text-[13px] text-white px-5 py-2.5 rounded-full border border-[#444] hover:border-[#666] transition-colors mt-4">
              Our product
            </button>
          </div>
        </div>
      </motion.section>

      {/* Autonomous QA Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="px-8 lg:px-16 py-20 max-w-[1400px] mx-auto mb-20"
      >
        <h2 className="text-[28px] mb-2">Autonomous QA on every commit</h2>
        <p className="whitespace-nowrap text-[#BAB8B8] text-[14px] mb-10 max-w-[600px]">
          Continuous, code-aware simulations that run on each change and validate customer workflows before merge.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Demo */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 min-h-[300px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(60,70,50,0.6) 0%, rgba(80,90,60,0.4) 100%)' }}>
            <div className="bg-[#1a1a1a]/90 rounded-lg p-4">
              <div className="bg-[#222] rounded-full px-4 py-2 mb-4 inline-flex items-center gap-2">
                <span className="text-gray-400">→</span>
                <span className="text-[12px] text-white">New commit validated</span>
                <span className="text-[12px] text-gray-400">• 4 simulations passed</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#4ade80]"></div>
                <span className="text-[11px] text-white">Testing</span>
                <span className="text-[11px] text-gray-500">› Simulations complete</span>
              </div>
              <div className="space-y-2">
                {[
                  'Entitlements: SAML group sync update...',
                  'Billing: proration + FX rounding reconci...',
                  'Idempotency: payment webhook retry i...',
                  'Approvals: high-value discount require...'
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#4ade80]"></div>
                      <span className="text-[11px] text-gray-300">{item}</span>
                    </div>
                    <span className="text-[10px] text-[#4ade80] font-medium">Pass</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Features */}
          <div className="space-y-8 pt-4">
            {[
              { icon: '☐', title: 'Generate test scenarios automatically', desc: 'AI builds scenarios from PRDs, diffs, and tickets.' },
              { icon: '⟲', title: 'Prevent regressions', desc: 'Simulations proactively verify the most impactful areas of your software.' },
              { icon: '◎', title: 'Ship with confidence', desc: 'Pass/fail gates and RCA on failures keep master stable.' },
              { icon: '→', title: 'Plug into CI & PR Workflows', desc: 'Insights and approvals appear in code review and pipelines.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-[16px] text-gray-400">{item.icon}</span>
                <div>
                  <h4 className="text-[14px] font-medium mb-1">{item.title}</h4>
                  <p className="text-[13px] text-[#BAB8B8] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
            <button className="text-[14px] text-white px-5 py-2.5 rounded-xl border border-[#444] hover:border-[#666] transition-colors mt-4">
              See how it works
            </button>
          </div>
        </div>
      </motion.section>

      {/* Safe and Secure Section */}
      <div
        className="w-full relative border-y border-[#1a1a1a] mb-20"
        style={{
          backgroundColor: '#111111ff',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      >
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="px-8 lg:px-16 py-24 max-w-[1400px] mx-auto"
        >
          <h2 className="text-[28px] mb-2">Safe and secure</h2>
          <p className="text-[#BAB8B8] text-[14px] mb-12 max-w-[500px]">
            Enterprise-grade security with privacy and control by default.
          </p>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left: Security Demo/Illustration */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#0d0d0d] border border-[#222] group">
              <div
                className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              {/* Security Badge */}
              <div className="absolute bottom-10 left-10 flex items-center gap-3 px-4 py-2.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                <div className="w-4 h-4 rounded-full border border-green-400/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                </div>
                <span className="text-[12px] text-white/90 font-medium tracking-tight">
                  All systems nominal • <span className="text-white">SOC-2 Type II</span>
                </span>
              </div>
            </div>

            {/* Right: Security Features */}
            <div className="space-y-10 py-2">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: 'Supervision',
                  desc: 'Set approval workflows to ensure the right people approve as Pulse works.'
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ),
                  title: 'Compliance',
                  desc: 'SOC-2 Type II & HIPAA audited.'
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <path d="M2.5 12C2.5 12 5.5 5 12 5C18.5 5 21.5 12 21.5 12C21.5 12 18.5 19 12 19C5.5 19 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ),
                  title: 'Private by design',
                  desc: 'We never train models on your data — you own all output.'
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M9 9H15V15H9V9Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4 12H9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M15 12H20" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ),
                  title: 'Hybrid & enterprise',
                  desc: 'BYOK/BYOC options for data residency in your VPC and control over inference providers/LLMs.'
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="mt-1 transition-transform group-hover:scale-110 duration-300">{item.icon}</div>
                  <div>
                    <h4 className="text-[14px] font-medium mb-1.5 text-white/90">{item.title}</h4>
                    <p className="text-[13px] text-[#BAB8B8] leading-relaxed group-hover:text-[#BAB8B8] transition-colors">{item.desc}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <button className="text-[14px] text-black bg-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#ff7a7a] hover:text-white transition-all">
                  Security overview
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Memory Quote Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="px-8 lg:px-16 py-16 max-w-[1400px] mx-auto text-center"
      >
        <p className="text-[24px] md:text-[35px] text-white leading-relaxed tracking-[0.02em]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
          Pulse builds a <span className="font-semibold">memory</span> of every problem,<br />
          so that the same mistake is <span className="font-semibold">never made twice</span>.
        </p>
      </motion.section>

      {/* About Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="px-8 lg:px-16 py-20 max-w-[1400px] mx-auto"
      >
        <div className="grid md:grid-cols-[200px_1fr] gap-12">
          <div>
            <span className="text-[13px] text-[#666]">Recent highlights</span>
          </div>
          <div className="space-y-6">
            {[
              { title: 'Introducing Sim-1', desc: 'Our smartest models capable of simulating how code runs', subdesc: 'A new category of models built to understand and predict how large codebases behave in complex, real-world scenarios.', tag: 'Research' },
              { title: '>80% Reduction in the average time to resolution by running tickets through PlayerZero', desc: 'Cayuse achieves significant efficiency gains by automating ticket triage and resolution workflows.', tag: 'Case Study' },
              { title: 'What is Predictive Software Quality? Software Operations in the AI Era', desc: 'A new, AI-powered approach to operating software reliably that anticipates how code will behave before deployment.', tag: 'Resources' },
            ].map((item, i) => (
              <div key={i} className="border-t border-[#222] pt-6">
                <h4 className="text-[15px] font-medium mb-1">{item.title}</h4>
                <p className="text-[13px] text-[#777] mb-1">{item.desc}</p>
                {item.subdesc && <p className="text-[12px] text-[#555] mb-2">{item.subdesc}</p>}
                <span className="text-[11px] text-[#555]">{item.tag}</span>
              </div>
            ))}
            <a href="#" className="text-[13px] text-white flex items-center gap-2 mt-4">
              View more posts
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#ff7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="px-8 lg:px-16 py-16 border-t border-[#1a1a1a] max-w-[1400px] mx-auto"
      >
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <h5 className="text-[12px] font-semibold tracking-wide text-[#666] mb-4">PLATFORM</h5>
            <div className="space-y-3">
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Agentic debugging</a>
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Code simulations</a>
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Enterprise</a>
            </div>
          </div>
          <div>
            <h5 className="text-[12px] font-semibold tracking-wide text-[#666] mb-4">COMPANY</h5>
            <div className="space-y-3">
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Resources</a>
              <a href="#" className="block text-[#888] text-[13px] hover:text-white transition-colors">About</a>
              <a href="#" className="block text-[#888] text-[13px] hover:text-white transition-colors">Careers</a>
            </div>
          </div>
          <div>
            <h5 className="text-[12px] font-semibold tracking-wide text-[#666] mb-4">LEGAL</h5>
            <div className="space-y-3">
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Terms of service</a>
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Privacy policy</a>
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Acceptable use policy</a>
              <a href="#" className="block text-[13px] text-[#888] hover:text-white transition-colors">Report AI concerns</a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[13px] text-[#666]">PULSE</span>
          </div>
          <div className="text-[12px] text-[#555]">
            © 2026 PULSE, Inc.
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
