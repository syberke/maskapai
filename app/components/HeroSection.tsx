export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-slate-950 min-h-[45vh] sm:min-h-[55vh] flex items-center justify-center select-none">
      
      {/* 1. Latar Belakang Gambar Sinematik */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80')`
        }}
      />

      {/* 2. Intelligent Atmospheric Overlay (Kontras Lembut Hangat-Dingin) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-slate-950/40 to-slate-950/60 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-50" />

      {/* 3. Struktur Penahan Ruang Kosong */}
      <div className="relative z-10 w-full max-w-4xl px-6 text-center">
        {/* Sengaja dikosongkan total agar tidak mengulang kata-kata klise / templated copy */}
      </div>

    </div>
  );
}