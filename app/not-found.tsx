import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-100 bg-[#12271D]">
      <h2 className="text-2xl font-bold mb-2">404 - পেজ পাওয়া যায়নি</h2>
      <p className="text-slate-400 mb-4">অনুগ্রহ করে হোমপেজে ফিরে যান।</p>
      <Link href="/" className="px-4 py-2 bg-emerald-600 rounded-xl text-white text-sm font-semibold">
        হোমে যান
      </Link>
    </div>
  );
}

