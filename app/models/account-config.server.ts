import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { PageConfig } from "@customer-portal-pro/config-schema";

export interface IAccountConfig extends Document {
  shopId: string;
  pageId: string;
  target: string;
  activeVersionId?: Types.ObjectId | null;
  draftConfig: PageConfig;
  createdAt: Date;
  updatedAt: Date;
}

const AccountConfigSchema = new Schema<IAccountConfig>(
  {
    shopId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
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
    activeVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ConfigVersion",
      default: null,
    },
    draftConfig: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "account_configs",
  }
);

// Compound unique index ensuring one config per pageId per shop
AccountConfigSchema.index({ shopId: 1, pageId: 1 }, { unique: true });
// Index for fast target-based lookups from extension queries
AccountConfigSchema.index({ shopId: 1, target: 1 });

export const AccountConfig: Model<IAccountConfig> =
  (mongoose.models.AccountConfig as Model<IAccountConfig>) ||
  mongoose.model<IAccountConfig>("AccountConfig", AccountConfigSchema);
