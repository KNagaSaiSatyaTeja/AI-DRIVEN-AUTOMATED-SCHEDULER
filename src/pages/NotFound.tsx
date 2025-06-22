import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-9xl font-black text-primary">404</h1>
      <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Uh-oh!
      </p>
      <p className="mt-4 text-lg text-muted-foreground">
        We can't find that page.
      </p>
      <Button asChild className="mt-6 cursor-pointer">
        <Link to="/">Go back home</Link>
      </Button>
    </div>
  );
};

export default NotFound;