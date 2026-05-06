import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { authOption } from './api/auth/[...nextauth]/options';
import { SessionSetter } from '@/components/SessionSetter';
import GlobalOverlays from '@/components/overlays/GlobalOverlays';
import PageScaler from '@/components/PageScaler';
import { application_name, application_description } from '@/lib/application';
import './globals.css';

const inter = Inter({
    variable: '--font-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: application_name,
    description: application_description,
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOption);

    return (
        <html
            lang='en'
            className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className='min-h-full flex flex-col'>
                <SessionSetter session={session} />
                <GlobalOverlays />
                <PageScaler>{children}</PageScaler>
            </body>
        </html>
    );
}
