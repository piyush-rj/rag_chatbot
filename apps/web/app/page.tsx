import Sidebar from '@/components/sidebar/Sidebar';
import SectionRenderer from '@/components/main/SectionRenderer';

export default function Home() {
    return (
        <div className='h-screen w-screen bg-dark-alpha text-neutral-100 flex'>
            <Sidebar />
            <SectionRenderer />
        </div>
    );
}
