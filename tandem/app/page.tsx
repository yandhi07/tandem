export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4">
        <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
          🚀 Hackathon Project Kickoff
        </span>
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
          Tandem
        </h1>
        <p className="text-slate-400 text-lg">
          Where professional careers meet visual storytelling. LinkedIn meets Instagram.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <button className="px-6 py-3 font-medium bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-600/20">
            Explore Feed
          </button>
          <button className="px-6 py-3 font-medium bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700">
            Create Post
          </button>
        </div>
      </div>
    </main>
  );
}