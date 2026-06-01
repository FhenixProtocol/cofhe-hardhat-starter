import Link from "next/link";

// SVG Illustration Components
const CharacterBlob = ({
  color,
  size = 80,
  eyes = "default",
}: {
  color: string;
  size?: number;
  eyes?: "default" | "happy" | "surprised";
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Blob body */}
    <ellipse
      cx="50"
      cy="55"
      rx="45"
      ry="40"
      fill={color}
      className="drop-shadow-md"
    />
    {/* Stick legs */}
    <line
      x1="35"
      y1="90"
      x2="30"
      y2="100"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
    />
    <line
      x1="65"
      y1="90"
      x2="70"
      y2="100"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Eyes */}
    {eyes === "default" && (
      <>
        <circle cx="35" cy="50" r="6" fill="white" />
        <circle cx="65" cy="50" r="6" fill="white" />
        <circle cx="37" cy="49" r="3" fill="#333" />
        <circle cx="67" cy="49" r="3" fill="#333" />
      </>
    )}
    {eyes === "happy" && (
      <>
        <path
          d="M30 48 Q35 44 40 48"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M60 48 Q65 44 70 48"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </>
    )}
    {eyes === "surprised" && (
      <>
        <circle cx="35" cy="48" r="8" fill="white" />
        <circle cx="65" cy="48" r="8" fill="white" />
        <circle cx="35" cy="48" r="4" fill="#333" />
        <circle cx="65" cy="48" r="4" fill="#333" />
      </>
    )}
    {/* Smile */}
    <path
      d="M40 65 Q50 75 60 65"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const CoinIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18" fill="#ffbb26" stroke="#d48f00" strokeWidth="2" />
    <text
      x="20"
      y="26"
      textAnchor="middle"
      fill="#d48f00"
      fontSize="16"
      fontWeight="bold"
    >
      $
    </text>
  </svg>
);

const HeartIcon = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <path
      d="M15 25 C5 18 2 12 7 7 C12 2 15 6 15 6 C15 6 18 2 23 7 C28 12 25 18 15 25Z"
      fill="#ff2b3a"
    />
  </svg>
);

const LockIcon = ({ size = 35 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 35 35" fill="none">
    <rect x="7" y="15" width="21" height="17" rx="3" fill="#ffbb26" />
    <path
      d="M12 15 V10 C12 6 17 6 17 10 V15"
      stroke="#d48f00"
      strokeWidth="3"
      fill="none"
    />
    <circle cx="17.5" cy="23" r="3" fill="#d48f00" />
  </svg>
);

// Navigation Component
const Navigation = () => (
  <nav className="nav-container">
    <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-midnight flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2 L18 10 L10 18 L2 10 Z"
              fill="white"
              opacity="0.9"
            />
            <circle cx="10" cy="10" r="4" fill="white" />
          </svg>
        </div>
        <span className="font-display text-xl font-medium text-charcoal">
          CoFHE
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-8">
        <Link href="#features" className="nav-link">
          Features
        </Link>
        <Link href="#how-it-works" className="nav-link">
          How it Works
        </Link>
        <Link href="#security" className="nav-link">
          Security
        </Link>
        <Link href="/dashboard" className="nav-link">
          App
        </Link>
      </div>

      {/* CTA Buttons */}
      <div className="flex items-center gap-3">
        <button className="btn-secondary">Log In</button>
        <button className="btn-primary">Get Started</button>
      </div>
    </div>
  </nav>
);

// Hero Section
const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
    {/* Background with noise */}
    <div className="absolute inset-0 bg-canvas noise-overlay" />

    {/* Decorative characters */}
    <div className="absolute top-20 left-[10%] character character-float">
      <CharacterBlob color="#ff3e00" size={70} eyes="happy" />
    </div>
    <div className="absolute top-32 right-[8%] character character-float" style={{ animationDelay: "0.5s" }}>
      <CharacterBlob color="#00ca48" size={60} eyes="default" />
    </div>
    <div className="absolute bottom-40 left-[5%] character character-float" style={{ animationDelay: "1s" }}>
      <CharacterBlob color="#0090ff" size={90} eyes="surprised" />
    </div>
    <div className="absolute bottom-32 right-[12%] character character-float" style={{ animationDelay: "1.5s" }}>
      <CharacterBlob color="#ffbb26" size={50} eyes="happy" />
    </div>

    {/* Floating icons */}
    <div className="absolute top-40 left-[25%] character-float" style={{ animationDelay: "2s" }}>
      <CoinIcon size={50} />
    </div>
    <div className="absolute top-48 right-[20%] character-float" style={{ animationDelay: "2.5s" }}>
      <HeartIcon size={35} />
    </div>
    <div className="absolute bottom-48 left-[20%] character-float" style={{ animationDelay: "3s" }}>
      <LockIcon size={40} />
    </div>

    {/* Content */}
    <div className="relative z-10 text-center max-w-4xl mx-auto px-6 stagger-children">
      <h1 className="text-display text-charcoal mb-6">
        Private Vaults for{" "}
        <span className="text-ember">Confidential</span> Finance
      </h1>
      <p className="text-[17px] text-graphite max-w-xl mx-auto mb-10 leading-relaxed">
        Your financial data stays yours. Fully homomorphic encryption means
        no one—not even the protocol—can see your balances, strategies, or
        gains.
      </p>

      {/* CTA Buttons */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link href="/dashboard" className="btn-primary text-base px-8 py-4">
          Launch App
        </Link>
        <button className="btn-secondary text-base px-8 py-4">
          Watch Demo
        </button>
      </div>

      {/* Trust indicator */}
      <p className="mt-12 text-sm text-ash">
        Secured by FHE on Ethereum • $0 fees on testnet
      </p>
    </div>
  </section>
);

// Features Section
const FeaturesSection = () => (
  <section id="features" className="py-32 px-6">
    <div className="max-w-page mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-heading-lg text-charcoal mb-4">
          Privacy by{" "}
          <span className="text-ember">Design</span>
        </h2>
        <p className="text-body text-graphite max-w-xl mx-auto">
          Every operation is encrypted by default. No leaks, no front-running,
          no data harvesting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature 1 */}
        <div className="card group cursor-pointer">
          <div className="mb-6 w-14 h-14 rounded-full bg-stone flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 4 L24 14 L14 24 L4 14 Z"
                fill="#ff3e00"
                opacity="0.2"
              />
              <path
                d="M14 8 L20 14 L14 20 L8 14 Z"
                fill="#ff3e00"
              />
            </svg>
          </div>
          <h3 className="text-heading-sm text-charcoal mb-3">
            Encrypted Balances
          </h3>
          <p className="text-body text-graphite leading-relaxed">
            Your balance is encrypted on-chain. Only you can decrypt and view
            your actual holdings.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="card group cursor-pointer">
          <div className="mb-6 w-14 h-14 rounded-full bg-stone flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="6" y="10" width="16" height="14" rx="2" fill="#00ca48" opacity="0.2" />
              <rect x="9" y="13" width="10" height="8" rx="1" fill="#00ca48" />
              <path d="M11 10 V7 C11 5 14 5 14 7 V10" stroke="#00ca48" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="text-heading-sm text-charcoal mb-3">
            Private Strategies
          </h3>
          <p className="text-body text-graphite leading-relaxed">
            Strategy weights and allocations are encrypted. No one can analyze
            your investment decisions.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="card group cursor-pointer">
          <div className="mb-6 w-14 h-14 rounded-full bg-stone flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="10" fill="#0090ff" opacity="0.2" />
              <circle cx="14" cy="14" r="6" fill="#0090ff" />
              <path d="M14 8 V14 L18 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-heading-sm text-charcoal mb-3">
            Confidential Rebalancing
          </h3>
          <p className="text-body text-graphite leading-relaxed">
            Rebalance decisions happen without revealing thresholds or vault
            composition to anyone.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="card group cursor-pointer">
          <div className="mb-6 w-14 h-14 rounded-full bg-stone flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M8 20 L14 8 L20 20 Z" fill="#ffbb26" opacity="0.3" />
              <path d="M11 20 L14 12 L17 20 Z" fill="#ffbb26" />
            </svg>
          </div>
          <h3 className="text-heading-sm text-charcoal mb-3">
            Yield Protection
          </h3>
          <p className="text-body text-graphite leading-relaxed">
            Donation shares are minted privately. Your yield routing stays
            confidential.
          </p>
        </div>

        {/* Feature 5 */}
        <div className="card group cursor-pointer">
          <div className="mb-6 w-14 h-14 rounded-full bg-stone flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="5" y="5" width="18" height="18" rx="4" fill="#9f4fff" opacity="0.2" />
              <rect x="9" y="9" width="10" height="10" rx="2" fill="#9f4fff" />
              <path d="M12 14 L14 12 L16 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-heading-sm text-charcoal mb-3">
            Composable Design
          </h3>
          <p className="text-body text-graphite leading-relaxed">
            Plug in any strategy. Composable vaults work with Aave, Uniswap,
            and custom protocols.
          </p>
        </div>

        {/* Feature 6 */}
        <div className="card group cursor-pointer">
          <div className="mb-6 w-14 h-14 rounded-full bg-stone flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="10" fill="#ff58ae" opacity="0.2" />
              <path d="M9 14 L12 17 L19 10" stroke="#ff58ae" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-heading-sm text-charcoal mb-3">
            Access Control
          </h3>
          <p className="text-body text-graphite leading-relaxed">
            Granular roles: owner, keeper, emergency admin. All with encrypted
            permissions.
          </p>
        </div>
      </div>
    </div>
  </section>
);

// How It Works Section
const HowItWorksSection = () => (
  <section id="how-it-works" className="py-32 px-6 bg-parchment">
    <div className="max-w-page mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-heading-lg text-charcoal mb-4">
          How CoFHE <span className="text-ember">Works</span>
        </h2>
        <p className="text-body text-graphite max-w-xl mx-auto">
          Fully homomorphic encryption enables computation on encrypted data.
          Your vault operates on ciphertext.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Steps */}
        <div className="space-y-8">
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-ember flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">1</span>
            </div>
            <div>
              <h3 className="text-heading-sm text-charcoal mb-2">
                Create Your Vault
              </h3>
              <p className="text-body text-graphite">
                Deploy a private composable vault with encrypted fee
                parameters. No one sees your settings.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-meadow flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">2</span>
            </div>
            <div>
              <h3 className="text-heading-sm text-charcoal mb-2">
                Add Strategies
              </h3>
              <p className="text-body text-graphite">
                Register strategies with encrypted weights. Your allocation
                stays private.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-sky flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">3</span>
            </div>
            <div>
              <h3 className="text-heading-sm text-charcoal mb-2">
                Deposit & Earn
              </h3>
              <p className="text-body text-graphite">
                Your balance is encrypted. Watch your shares grow without
                exposing your holdings.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-sunburst flex items-center justify-center flex-shrink-0">
              <span className="text-charcoal font-semibold text-lg">4</span>
            </div>
            <div>
              <h3 className="text-heading-sm text-charcoal mb-2">
                Private Operations
              </h3>
              <p className="text-body text-graphite">
                Rebalancing, reporting, and withdrawals all happen without
                revealing your data.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Phone mockup */}
        <div className="flex justify-center">
          <div className="phone-mockup max-w-[300px]">
            <div className="bg-midnight rounded-[20px] p-6">
              {/* Mock app UI */}
              <div className="text-white mb-6">
                <p className="text-sm text-ash mb-1">Your Balance</p>
                <p className="text-3xl font-semibold">$12,450.00</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-charcoal/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-meadow flex items-center justify-center">
                      <span>↓</span>
                    </div>
                    <span className="text-sm">Deposit</span>
                  </div>
                  <span className="text-meadow text-sm font-medium">+$500.00</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-charcoal/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky flex items-center justify-center">
                      <span>↑</span>
                    </div>
                    <span className="text-sm">Strategy Earn</span>
                  </div>
                  <span className="text-meadow text-sm font-medium">+$125.40</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-charcoal/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ember flex items-center justify-center">
                      <span>⟳</span>
                    </div>
                    <span className="text-sm">Rebalance</span>
                  </div>
                  <span className="text-ash text-sm">Completed</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-meadow/20 border border-meadow/30">
                <p className="text-xs text-meadow">
                  🔒 Balance encrypted on-chain
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Security Section
const SecuritySection = () => (
  <section id="security" className="py-32 px-6">
    <div className="max-w-page mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Visual */}
        <div className="flex justify-center order-2 lg:order-1">
          <div className="relative">
            {/* Central shield */}
            <div className="w-64 h-64 rounded-full bg-stone flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-card shadow-phone flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <path
                    d="M40 8 L70 20 L70 40 C70 60 40 75 40 75 C40 75 10 60 10 40 L10 20 L40 8Z"
                    fill="#ff3e00"
                    opacity="0.1"
                  />
                  <path
                    d="M40 16 L62 26 L62 40 C62 54 40 66 40 66 C40 66 18 54 18 40 L18 26 L40 16Z"
                    fill="#ff3e00"
                  />
                  <path
                    d="M35 42 L38 45 L48 35"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Orbiting icons */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <LockIcon size={50} />
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <CoinIcon size={45} />
            </div>
            <div className="absolute top-1/2 -left-8 -translate-y-1/2">
              <HeartIcon size={40} />
            </div>
            <div className="absolute top-1/2 -right-8 -translate-y-1/2">
              <CharacterBlob color="#0090ff" size={50} eyes="happy" />
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="order-1 lg:order-2">
          <h2 className="text-heading-lg text-charcoal mb-6">
            Built on FHE
            <br />
            <span className="text-ember">Zero Leaks</span>
          </h2>
          <p className="text-body text-graphite mb-8 leading-relaxed">
            Fully Homomorphic Encryption allows computations on encrypted data.
            Your vault operates on ciphertext—mathematically impossible to
            decrypt without your key.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-meadow flex items-center justify-center flex-shrink-0 mt-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6 L5 9 L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-body text-graphite">
                <strong className="text-charcoal">No front-running</strong> —
                Attackers can't see your transaction amounts
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-meadow flex items-center justify-center flex-shrink-0 mt-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6 L5 9 L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-body text-graphite">
                <strong className="text-charcoal">No data harvesting</strong> —
                Your financial history stays private
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-meadow flex items-center justify-center flex-shrink-0 mt-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6 L5 9 L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-body text-graphite">
                <strong className="text-charcoal">Verifiable privacy</strong> —
                Cryptographic guarantees, not promises
              </p>
            </div>
          </div>

          <div className="mt-10">
            <a href="#docs" className="btn-ghost text-ember font-medium">
              Read the security whitepaper →
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Testimonials Section
const TestimonialsSection = () => (
  <section className="py-32 px-6 bg-parchment">
    <div className="max-w-page mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-heading-lg text-charcoal mb-4">
          Friends of <span className="text-ember">CoFHE</span>
        </h2>
        <p className="text-body text-graphite max-w-xl mx-auto">
          Join developers and protocols building the future of confidential DeFi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-stone flex items-center justify-center">
              <span className="text-lg">🦄</span>
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">Alex Chen</p>
              <p className="text-xs text-ash">DeFi Builder</p>
            </div>
          </div>
          <p className="text-body text-graphite leading-relaxed">
            "CoFHE solves a problem I didn't know existed. Now I can't imagine
            building privacy-sensitive protocols without it."
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-stone flex items-center justify-center">
              <span className="text-lg">🔐</span>
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">Sarah Kim</p>
              <p className="text-xs text-ash">Security Researcher</p>
            </div>
          </div>
          <p className="text-body text-graphite leading-relaxed">
            "The FHE implementation is production-ready. Tested it extensively
            — no vulnerabilities found."
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-stone flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">Marcus Johnson</p>
              <p className="text-xs text-ash">Protocol Architect</p>
            </div>
          </div>
          <p className="text-body text-graphite leading-relaxed">
            "Finally, a vault system that lets me build without worrying about
            data exposure. The SDK is also excellent."
          </p>
        </div>
      </div>
    </div>
  </section>
);

// CTA Section
const CTASection = () => (
  <section className="py-32 px-6 relative overflow-hidden">
    <div className="absolute inset-0 bg-canvas noise-overlay" />

    {/* Decorative elements */}
    <div className="absolute top-20 left-[15%] character-float opacity-50">
      <CharacterBlob color="#ff3e00" size={60} eyes="happy" />
    </div>
    <div className="absolute bottom-20 right-[15%] character-float opacity-50" style={{ animationDelay: "1s" }}>
      <CharacterBlob color="#00ca48" size={70} eyes="surprised" />
    </div>

    <div className="relative z-10 max-w-page mx-auto text-center">
      <h2 className="text-heading-lg text-charcoal mb-6">
        Ready to build
        <br />
        <span className="text-ember">confidential</span>?
      </h2>
      <p className="text-body text-graphite max-w-md mx-auto mb-10">
        Start with our testnet. Deploy your first private vault and experience
        FHE-powered DeFi.
      </p>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button className="btn-primary text-base px-8 py-4">
          Launch on Testnet
        </button>
        <button className="btn-secondary text-base px-8 py-4">
          Read the Docs
        </button>
      </div>

      <p className="mt-8 text-sm text-ash">
        Free to use on Arbitrum Sepolia • No real funds required
      </p>
    </div>
  </section>
);

// Footer
const Footer = () => (
  <footer className="py-16 px-6 border-t border-stone">
    <div className="max-w-page mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h4 className="text-sm font-semibold text-charcoal mb-4">Product</h4>
          <ul className="space-y-3">
            <li>
              <a href="#features" className="text-sm text-ash hover:text-ember transition-colors">
                Features
              </a>
            </li>
            <li>
              <a href="#security" className="text-sm text-ash hover:text-ember transition-colors">
                Security
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Pricing
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-charcoal mb-4">Developers</h4>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                SDK
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                GitHub
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-charcoal mb-4">Protocol</h4>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Whitepaper
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Audits
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Bug Bounty
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-charcoal mb-4">Community</h4>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Discord
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Twitter
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-ash hover:text-ember transition-colors">
                Blog
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-stone">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="w-8 h-8 rounded-lg bg-midnight flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2 L18 10 L10 18 L2 10 Z"
                fill="white"
                opacity="0.9"
              />
              <circle cx="10" cy="10" r="4" fill="white" />
            </svg>
          </div>
          <span className="font-display text-lg font-medium text-charcoal">
            CoFHE
          </span>
        </div>

        <p className="text-sm text-ash">
          © 2024 CoFHE Protocol. Built with FHE on Ethereum.
        </p>
      </div>
    </div>
  </footer>
);

// Main Page Component
export default function HomePage() {
  return (
    <main className="relative">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}