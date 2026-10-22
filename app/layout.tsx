import type {Metadata} from 'next';
import { Plus_Jakarta_Sans, Hind_Siliguri, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'মেস হিসাব - Mess Manager | Bangladeshi Mess Meal & Accounting',
  description: 'Complete Bangladeshi Bachelor & Student Mess Meal, Bazar, Shared Bill, and Expense Management Web App with 2-way Android Firebase Sync.',
  openGraph: {
    title: 'মেস হিসাব - Mess Manager',
    description: 'Complete Bangladeshi Bachelor & Student Mess Meal, Bazar, Shared Bill, and Expense Management Web App with 2-way Android Firebase Sync.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'মেস হিসাব - Mess Manager',
    description: 'Complete Bangladeshi Bachelor & Student Mess Meal, Bazar, Shared Bill, and Expense Management Web App with 2-way Android Firebase Sync.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="bn" className={`${plusJakarta.variable} ${hindSiliguri.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#F6F8F5] text-[#173125] antialiased selection:bg-[#7EC151]/30 selection:text-[#173125]">
        {children}
      </body>
    </html>
  );
}
