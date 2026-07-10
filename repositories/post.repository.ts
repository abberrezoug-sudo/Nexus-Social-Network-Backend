// src/repositories/post.repository.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import Post from "../models/Post.js";

type StoredPost = {
  _id: string;
  author: string;
  content: string;
  image: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
};

const storageDir = resolve(process.cwd(), "data");
const storageFilePath = resolve(storageDir, "posts.json");
const inMemoryPosts = new Map<string, StoredPost>();

const loadPostsFromDisk = (): StoredPost[] => {
  if (!existsSync(storageFilePath)) return [];
  try {
    return JSON.parse(readFileSync(storageFilePath, "utf8")) as StoredPost[];
  } catch {
    return [];
  }
};

const persistPostsToDisk = (posts: Iterable<StoredPost>) => {
  mkdirSync(storageDir, { recursive: true });
  writeFileSync(storageFilePath, JSON.stringify([...posts], null, 2));
};

const getFallbackPosts = () => {
  if (inMemoryPosts.size === 0) {
    for (const post of loadPostsFromDisk()) {
      inMemoryPosts.set(post._id, post);
    }
  }
  return inMemoryPosts;
};

const useInMemoryStore = () => {
  const hasMongoUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  return !hasMongoUri || mongoose.connection.readyState !== 1;
};

export class PostRepository {
  async create(data: { author: string; content: string; image?: string }) {
    if (useInMemoryStore()) {
      const now = new Date().toISOString();
      const post: StoredPost = {
        _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        author: data.author,
        content: data.content,
        image: data.image ?? "",
        likesCount: 0,
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      getFallbackPosts().set(post._id, post);
      persistPostsToDisk(getFallbackPosts().values());
      return post;
    }

    return Post.create(data);
  }

  async findById(id: string) {
    if (useInMemoryStore()) {
      return getFallbackPosts().get(id) ?? null;
    }

    return Post.findById(id).populate("author", "firstName lastName username avatar");
  }

  async findByAuthor(authorId: string, page: number, limit: number) {
    if (useInMemoryStore()) {
      const posts = Array.from(getFallbackPosts().values())
        .filter((p) => p.author === authorId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const start = (page - 1) * limit;
      return posts.slice(start, start + limit);
    }

    return Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "firstName lastName username avatar");
  }

  async findFeed(page: number, limit: number) {
    if (useInMemoryStore()) {
      const posts = Array.from(getFallbackPosts().values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const start = (page - 1) * limit;
      return posts.slice(start, start + limit);
    }

    return Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "firstName lastName username avatar");
  }

  async updateById(id: string, updates: Record<string, unknown>) {
    if (useInMemoryStore()) {
      const posts = getFallbackPosts();
      const existing = posts.get(id);
      if (!existing) return null;

      const merged: StoredPost = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      } as StoredPost;

      posts.set(id, merged);
      persistPostsToDisk(posts.values());
      return merged;
    }

    return Post.findByIdAndUpdate(id, updates, { new: true }).populate(
      "author",
      "firstName lastName username avatar"
    );
  }

  async deleteById(id: string) {
    if (useInMemoryStore()) {
      const posts = getFallbackPosts();
      const existed = posts.delete(id);
      if (existed) persistPostsToDisk(posts.values());
      return existed;
    }

    const result = await Post.findByIdAndDelete(id);
    return Boolean(result);
  }
}