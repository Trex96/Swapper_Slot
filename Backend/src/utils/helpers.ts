import { Request } from 'express';

export const getPagination = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  return {
    skip,
    limit,
    page
  };
};

export const getSort = (req: Request) => {
  const sort = req.query.sort as string || '-createdAt';
  return sort.replace(',', ' ');
};

export const getSearchFilter = (req: Request) => {
  const filter: any = {};
  
  if (req.query.search) {
    filter.$text = { $search: req.query.search as string };
  }
  
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  return filter;
};

export const generateRandomString = (length: number = 10): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};