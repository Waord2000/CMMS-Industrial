export default function AuthCard({ titulo, subtitulo, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-900 px-6 font-sans text-paper">
      <div className="w-full max-w-sm rounded-lg border border-steel-600 bg-graphite-800 p-8 shadow-xl shadow-black/50">
        <div className="mb-5">
          <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
            <polygon points="56,32 44,52.78 20,52.78 8,32 20,11.22 44,11.22" stroke="#e8a33d" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 34 Q20 26 26 34 T38 34 T50 34" stroke="#e8a33d" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
            <circle cx="46" cy="18" r="2" fill="#e8a33d" />
          </svg>
        </div>
        <h2 className="mb-1 font-display text-2xl font-semibold">{titulo}</h2>
        <p className="mb-6 text-sm text-steel-400">{subtitulo}</p>
        {children}
      </div>
    </div>
  );
}