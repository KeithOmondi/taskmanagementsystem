import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  color: string;
  isSystemDefined: boolean;
  parentId?: mongoose.Types.ObjectId; // Added for hierarchy
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    color: { type: String, default: "#3b82f6" },
    isSystemDefined: { type: Boolean, default: false },
    // Self-referencing field to create a parent-child tree
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true },
);

categorySchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    // Base slug
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let count = 1;

    // Check if slug already exists
    while (await mongoose.models.Category.findOne({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    this.slug = slug;
  }
});

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", categorySchema);

export default Category;