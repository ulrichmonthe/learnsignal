import { defineField, defineType } from "sanity";

export const codeBlock = defineType({
  name: "codeBlock",
  title: "Code block",
  type: "object",
  fields: [
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "Plain text", value: "text" },
          { title: "TypeScript", value: "typescript" },
          { title: "JavaScript", value: "javascript" },
          { title: "TSX", value: "tsx" },
          { title: "JSX", value: "jsx" },
          { title: "Python", value: "python" },
          { title: "SQL", value: "sql" },
          { title: "JSON", value: "json" },
          { title: "Bash", value: "bash" },
        ],
        layout: "dropdown",
      },
      initialValue: "typescript",
    }),
    defineField({
      name: "filename",
      title: "Filename (optional)",
      type: "string",
    }),
    defineField({
      name: "code",
      title: "Code",
      type: "text",
      rows: 12,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      language: "language",
      filename: "filename",
      code: "code",
    },
    prepare({ language, filename, code }) {
      const title = filename
        ? `${filename} (${language || "code"})`
        : `Code (${language || "text"})`;
      return {
        title,
        subtitle: code ? String(code).slice(0, 72) : "Empty",
      };
    },
  },
});
