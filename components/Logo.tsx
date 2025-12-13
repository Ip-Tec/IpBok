import { BookOpen } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
        <BookOpen className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold text-foreground">
        ip<span className="text-gradient">Bok</span>
      </span>
    </div>
  );
};

export default Logo;
