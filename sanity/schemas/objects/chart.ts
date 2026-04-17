import { defineField, defineType } from "sanity";
import { ChartBlockInput } from "../../components/pt/ChartBlockInput";

export const chart = defineType({
  name: "chart",
  title: "Chart",
  type: "object",
  components: {
    input: ChartBlockInput,
  },
  fields: [
    defineField({
      name: "title",
      title: "Chart label",
      type: "string",
      description: "Placeholder — wire to real charts on the LearnSignal site.",
    }),
    defineField({
      name: "note",
      title: "Editor note",
      type: "text",
      rows: 3,
      description: "Internal context for authors (optional).",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title || "Chart",
        subtitle: "Placeholder block — render chart on frontend",
      };
    },
  },
});
