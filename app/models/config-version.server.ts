import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { PageConfig } from "@customer-portal-pro/config-schema";

export interface IConfigVersion extends Document {
  shopId: string;
  configId: Types.ObjectId;
  pageId: string;
  target: string;
  version: number;
  config: PageConfig;
  publishedBy: string;
  publishedAt: Date;
  createdAt: Date;
}

const ConfigVersionSchema = new Schema<IConfigVersion>(
  {
    shopId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    configId: {
      type: Schema.Types.ObjectId,
      ref: "AccountConfig",
      required: true,
      index: true,
    },
    pageId: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Number,
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
    },
    publishedBy: {
      type: String,
      default: "admin",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable snapshots
    collection: "config_versions",
  }
);

// Explicit non-negotiable index requirement: config_versions on shopId+configId+version
ConfigVersionSchema.index({ shopId: 1, configId: 1, version: 1 }, { unique: true });

export const ConfigVersion: Model<IConfigVersion> =
  (mongoose.models.ConfigVersion as Model<IConfigVersion>) ||
  mongoose.model<IConfigVersion>("ConfigVersion", ConfigVersionSchema);

