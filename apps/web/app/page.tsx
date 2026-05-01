import Sidebar from "@/components/sidebar/Sidebar";
import MainSection from "@/components/main/MainSection";

export default function Home() {
  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex">
      <Sidebar />
      <MainSection />
    </div>
  );
}
