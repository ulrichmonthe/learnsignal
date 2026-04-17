import { defineField, defineType } from "sanity";
import { FlowBlockInput } from "../../components/pt/FlowBlockInput";

export const flow = defineType({
  name: "flow",
  title: "Flow",
  type: "object",
  components: {
    input: FlowBlockInput,
  },
  fields: [
    defineField({
      name: "title",
      title: "Flow label",
      type: "string",
      description: "Placeholder — wire to flow / diagram UI on the site.",
    }),
    defineField({
      name: "note",
      title: "Editor note",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title || "Flow",
        subtitle: "Placeholder block — render flow on frontend",
      };
    },
  },
});
