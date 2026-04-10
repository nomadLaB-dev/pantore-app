import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

export default async function PrivateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const session = cookieStore.get('pantore_session');

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
