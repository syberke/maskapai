import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import SearchForm from "./components/SearchForm";
import Information from "./components/Information";
import Footer from "./components/Footer";
import prisma from "@/lib/prisma"; 

// Fungsi untuk fetching data bandara langsung dari database aktif
async function getActiveAirports() {
  try {
    return await prisma.airport.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
      },
      orderBy: {
        city: "asc",
      },
    });
  } catch (error) {
    console.error("Gagal memuat bandara dari database:", error);
    return [];
  }
}

export default async function HomePage() {
  const airports = await getActiveAirports();

  return (
    <main className="min-h-screen bg-slate-50 antialiased selection:bg-slate-950 selection:text-white flex flex-col justify-between">
      
      {/* KONTEN HALAMAN UTAMA */}
      <div className="w-full flex-grow">
        
        {/* 2. Banner Utama */}
        <HeroSection />

        {/* 3. Form Pencarian Dinamis dengan Passing Data Bandara */}
        <SearchForm airports={airports} isHome={true} />

        {/* 4. Bagian Penawaran Diskon & Promo */}
        <Information />

      </div>

      {/* 6. Footer Komersial Profesional (Dipisah) */}
      <Footer />
      
    </main>
  );
}