import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kai-Chen Yeh - Portfolio',
  description: 'Engineering Manager & Web Developer Portfolio',
  other: {
    'format-detection': 'telephone=no, date=no, email=no, address=no',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-orange-50">
        {children}
        <footer className="bottom-0 w-full flex justify-center">
          <p className="text-gray-700">
            © 2024 Kai-Chen Yeh. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
