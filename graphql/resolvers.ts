import { PostService } from "../services/post.service.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

const postService = new PostService();

export const rootValue = {
  post: async ({ id }: { id: string }) => {
    const result = await postService.getPostById(id);
    return result.post;
  },
  feed: async ({ page = 1, limit = 10 }: { page?: number; limit?: number }) => {
    return await postService.getFeed(page, limit);
  },
  postsByAuthor: async ({ authorId, page = 1, limit = 10 }: { authorId: string; page?: number; limit?: number }) => {
    return await postService.getPostsByAuthor(authorId, page, limit);
  },
  createPost: async ({ content, image }: { content: string; image?: string }, context: { user?: { id: string } }) => {
    if (!context.user) {
      throw new Error("Unauthorized");
    }

    const post = await postService.createPost(context.user.id, content, image);
    return post.post;
  },
  updatePost: async ({ id, content, image }: { id: string; content?: string; image?: string }, context: { user?: { id: string } }) => {
    if (!context.user) {
      throw new Error("Unauthorized");
    }

    return (await postService.updatePost(id, context.user.id, { content, image })).post;
  },
  deletePost: async ({ id }: { id: string }, context: { user?: { id: string } }) => {
    if (!context.user) {
      throw new Error("Unauthorized");
    }

    const result = await postService.deletePost(id, context.user.id);
    return Boolean(result);
  },
};
