export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface SearchQuery {
  search?: string;
  category?: string;
  status?: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export {};
