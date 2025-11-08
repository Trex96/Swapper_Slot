declare module 'hpp' {
  import { Request, Response, NextFunction } from 'express';
  
  interface Options {
    whitelist?: string[];
    checkBody?: boolean;
    checkQuery?: boolean;
  }
  
  function hpp(options?: Options): (req: Request, res: Response, next: NextFunction) => void;
  
  export = hpp;
}