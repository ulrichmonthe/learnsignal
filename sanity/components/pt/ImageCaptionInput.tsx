import type { ObjectInputProps } from "sanity";

export function ImageCaptionInput(props: ObjectInputProps) {
  return (
    <div
      style={{
        border: "1px solid rgba(120, 120, 100, 0.25)",
        borderRadius: 6,
        padding: "12px 14px",
        margin: "6px 0",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
          opacity: 0.75,
          fontWeight: 600,
        }}
      >
        Image + caption
      </div>
      {props.renderDefault(props)}
    </div>
  );
}
