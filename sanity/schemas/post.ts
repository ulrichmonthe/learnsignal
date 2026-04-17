import { defineField, defineType } from "sanity";

const categories = [
  { title: "Research", value: "Research" },
  { title: "Practice", value: "Practice" },
  { title: "Tools", value: "Tools" },
  { title: "Industry", value: "Industry" },
] as const;

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      validation: (Rule) =>
        Rule.max(200).error("Excerpt must be 200 characters or fewer"),
    }),
    defineField({
      name: "mainImage",
      title: "Main image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative text",
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [...categories],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "portableTextBody",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "mainImage",
      category: "category",
      date: "publishedAt",
    },
    prepare({ title, media, category, date }) {
      return {
        title: title || "Untitled",
        subtitle: [category, date?.slice(0, 10)].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
