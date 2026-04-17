import type { ObjectInputProps } from "sanity";

export function ChartBlockInput(props: ObjectInputProps) {
  return (
    <div
      style={{
        border: "1px dashed rgba(120, 120, 100, 0.45)",
        borderRadius: 6,
        padding: "12px 14px",
        margin: "6px 0",
        background: "rgba(200, 240, 64, 0.08)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
          opacity: 0.9,
          fontWeight: 600,
        }}
      >
        Chart · placeholder (render on site)
      </div>
      {props.renderDefault(props)}
    </div>
  );
}
