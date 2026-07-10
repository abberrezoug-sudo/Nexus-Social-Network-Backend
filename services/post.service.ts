// src/services/post.service.ts
import { PostRepository } from "../repositories/post.repository";

const getEntityId = (entity: unknown) => {
  if (!entity || typeof entity !== "object") return "";
  const record = entity as { _id?: unknown; id?: unknown };
  return String(record._id ?? record.id ?? "");
};

export class PostService {
  private repo = new PostRepository();

  async createPost(authorId: string, content: string, image?: string) {
    const payload: { author: string; content: string; image?: string } = { author: authorId, content };
    if (image !== undefined) payload.image = image;

    const post = await this.repo.create(payload);

    return {
      message: "Post créé avec succès",
      post,
    };
  }

  async getPostById(postId: string) {
    const post = await this.repo.findById(postId);

    if (!post) {
      throw new Error("Post non trouvé");
    }

    return { message: "Post récupéré", post };
  }

  async getFeed(page: number, limit: number) {
    const [posts, totalCount] = await Promise.all([
      this.repo.findFeed(page, limit),
      this.repo.countAll(),
    ]);

    return {
      message: "Feed récupéré",
      posts,
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };
  }

  async getPostsByAuthor(authorId: string, page: number, limit: number) {
    const [posts, totalCount] = await Promise.all([
      this.repo.findByAuthor(authorId, page, limit),
      this.repo.countByAuthor(authorId),
    ]);

    return {
      message: "Posts récupérés",
      posts,
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };
  }

  async updatePost(postId: string, userId: string, updates: { content?: string; image?: string }) {
    if (Object.keys(updates).length === 0) {
      throw new Error("Aucune modification fournie");
    }

    const post = await this.repo.findById(postId);

    if (!post) {
      throw new Error("Post non trouvé");
    }

    const authorId = getEntityId((post as any).author) || String((post as any).author);
    if (authorId !== userId) {
      throw new Error("Non autorisé à modifier ce post");
    }

    const updated = await this.repo.updateById(postId, updates);
    if (!updated) {
      throw new Error("Post non trouvé");
    }

    return { message: "Post mis à jour", post: updated };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.repo.findById(postId);

    if (!post) {
      throw new Error("Post non trouvé");
    }

    const authorId = getEntityId((post as any).author) || String((post as any).author);
    if (authorId !== userId) {
      throw new Error("Non autorisé à supprimer ce post");
    }

    await this.repo.deleteById(postId);
    return { message: "Post supprimé" };
  }
}