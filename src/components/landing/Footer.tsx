"use client";

export default function Footer() {
  return (
    <footer className="relative bg-[#02030a] border-t border-white/5 py-10 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.24em] text-white/30">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300/60" />
          <span>Phase · cinematic AI-native web engine</span>
        </div>
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/nitishmeswal/phase"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            github
          </a>
          <a
            href="https://docs.anthropic.com/en/docs/intro-to-claude"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            anthropic
          </a>
          <a
            href="https://docs.pmnd.rs/react-three-fiber"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            r3f
          </a>
        </div>
      </div>
    </footer>
  );
}
