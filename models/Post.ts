// src/models/Post.ts
import { Document, Schema, model, Types } from "mongoose";

export interface IPost extends Document {
  author: Types.ObjectId;
  content: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
      default: "",
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });

export const Post = model<IPost>("Post", postSchema);
export default Post;