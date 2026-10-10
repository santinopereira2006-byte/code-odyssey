/** Chapter instrument above each section title: numeral, a ruled line, chapter name and depth. */
export default function Hud({ index, name, depth }: { index: string; name: string; depth?: string }) {
  return (
    <div className="hud">
      <span className="hud__index">{index}</span>
      <span className="hud__line" aria-hidden="true" />
      <span className="hud__name">{name}</span>
      {depth && <span className="hud__depth" aria-hidden="true">{depth}</span>}
    </div>
  );
}
