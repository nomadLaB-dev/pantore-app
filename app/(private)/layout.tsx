import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const session = cookieStore.get('pantore_session');
    if (!session) redirect('/login');

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto p-5 md:p-7">{children}</main>
            </div>
        </div>
    );
}
