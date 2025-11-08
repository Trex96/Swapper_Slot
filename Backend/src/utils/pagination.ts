export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

export const paginate = async <T>(
  query: any,
  options: PaginationOptions
): Promise<PaginatedResponse<T>> => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;
  
  const sort = options.sort || 'createdAt';
  const order = options.order === 'asc' ? 1 : -1;
  
  const [data, total] = await Promise.all([
    query.skip(skip).limit(limit).sort({ [sort]: order }),
    query.model.countDocuments(query.getQuery())
  ]);
  
  return {
    success: true,
    count: data.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data
  };
};