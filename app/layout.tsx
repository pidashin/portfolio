import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kai-Chen Yeh - Portfolio',
  description: 'Engineering Manager & Web Developer Portfolio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
