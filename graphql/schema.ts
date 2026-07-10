import { buildSchema } from "graphql";

export const schema = buildSchema(`
  type Post {
    _id: ID!
    author: String!
    content: String!
    image: String
    likesCount: Int!
    commentsCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type PaginatedPosts {
    posts: [Post!]!
    page: Int!
    limit: Int!
    totalCount: Int!
    totalPages: Int!
  }

  type Query {
    post(id: ID!): Post
    feed(page: Int = 1, limit: Int = 10): PaginatedPosts!
    postsByAuthor(authorId: ID!, page: Int = 1, limit: Int = 10): PaginatedPosts!
  }

  input CreatePostInput {
    content: String!
    image: String
  }

  input UpdatePostInput {
    content: String
    image: String
  }

  type Mutation {
    createPost(content: String!, image: String): Post!
    updatePost(id: ID!, content: String, image: String): Post!
    deletePost(id: ID!): Boolean!
  }
`);
