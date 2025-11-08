import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/ui/icons';

const NotFound = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full">
              <Icons.Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Page not found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              <p>
                Sorry, we couldn't find the page you're looking for. Please check the URL or navigate back to the homepage.
              </p>
            </div>
          </CardContent>
          <Separator className="my-4" />
          <CardFooter className="flex flex-col space-y-4">
            <Button asChild className="w-full">
              <Link to="/">Go back home</Link>
            </Button>
            
            <div className="text-sm text-center text-muted-foreground">
              Need help?{' '}
              <Link 
                to="/support" 
                className="text-primary hover:underline font-medium"
              >
                Contact support
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;