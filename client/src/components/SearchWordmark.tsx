interface SearchWordmarkProps {
  compact?: boolean;
}

export default function SearchWordmark({ compact = false }: SearchWordmarkProps) {
  const label = "PROD-BOT";

  return (
    <div className="select-none text-center" aria-label="PROD-BOT">
      <div
        className={compact ? "text-3xl font-bold tracking-tight text-[#2cdb04]" : "text-6xl font-bold tracking-tight text-[#2cdb04] sm:text-7xl"}
        style={{ fontFamily: 'Arial, "Helvetica Neue", sans-serif' }}
      >
        {label}
      </div>
    </div>
  );
}
