import mongoose, { Schema, type Document, type Model } from "mongoose";
import { encryptToken, decryptToken } from "../utils/crypto.server.js";

export interface IShop extends Document {
  shop: string;
  accessToken?: string;
  scope?: string;
  isActive: boolean;
  installedAt: Date;
  uninstalledAt?: Date;
  getDecryptedAccessToken(): string;
  setEncryptedAccessToken(token: string): void;
}

const ShopSchema = new Schema<IShop>(
  {
    shop: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    accessToken: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    installedAt: {
      type: Date,
      default: Date.now,
    },
    uninstalledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "shops",
  }
);

// Method to decrypt access token
ShopSchema.methods.getDecryptedAccessToken = function (): string {
  if (!this.accessToken) return "";
  try {
    return decryptToken(this.accessToken);
  } catch (error) {
    console.error("Failed to decrypt access token for shop", this.shop, error);
    return "";
  }
};

// Method to encrypt access token
ShopSchema.methods.setEncryptedAccessToken = function (token: string): void {
  this.accessToken = encryptToken(token);
};

export const Shop: Model<IShop> =
  (mongoose.models.Shop as Model<IShop>) || mongoose.model<IShop>("Shop", ShopSchema);
