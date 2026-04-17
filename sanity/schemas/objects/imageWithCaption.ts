import { defineField, defineType } from "sanity";
import { ImageCaptionInput } from "../../components/pt/ImageCaptionInput";

export const imageWithCaption = defineType({
  name: "imageWithCaption",
  title: "Image with caption",
  type: "object",
  components: {
    input: ImageCaptionInput,
  },
  fields: [
    defineField({
      name: "asset",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
  ],
  preview: {
    select: {
      caption: "caption",
      alt: "alt",
      media: "asset",
    },
    prepare({ caption, alt, media }) {
      return {
        title: caption || alt || "Image",
        subtitle: alt && caption !== alt ? alt : undefined,
        media,
      };
    },
  },
});
