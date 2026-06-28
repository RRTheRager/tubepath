export function TrafficLights() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/10" />
      <span className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/10" />
    </div>
  );
}
