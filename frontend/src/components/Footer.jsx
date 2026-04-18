export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-zinc-600 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-black text-ink">Urben Solution</p>
          <p className="mt-3 max-w-sm">Trusted help for homes, repairs, grooming, moving, learning and events.</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Support</p>
          <p className="mt-3">help@urbensolution.com</p>
          <p>+91 90000 00000</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Cities</p>
          <p className="mt-3">Delhi NCR, Mumbai, Bengaluru, Pune, Hyderabad</p>
        </div>
      </div>
    </footer>
  );
}
