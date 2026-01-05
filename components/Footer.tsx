import { X, Linkedin, Github } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <Logo />
            <p className="mt-4 text-center text-sm text-muted-foreground md:text-left">
              A product of{" "}
              <span className="font-medium text-foreground">IpTec</span>
            </p>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              Building simple tools for clarity and impact.
            </p>
          </div>
          <div className="">
            <h3>Contact</h3>
            <p className="mt-4 text-center text-sm text-muted-foreground md:text-left">
              Email: iptecdev@gmail.com
            </p>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              Phone: +234 (0) 903-379-8890
            </p>
            <h4 className="text-justify my-4">Social media</h4>
            <p className="mt-4 flex items-center gap-2 text-justify text-muted-foreground md:text-left">
              <X className="h-4 w-4 hover:text-foreground text-lg" />
              <Github className="h-4 w-4 hover:text-foreground text-lg" />
              <Linkedin className="h-4 w-4 hover:text-foreground text-lg" />
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground cursor-pointer"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground cursor-pointer"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="transition-colors hover:text-foreground cursor-pointer"
            >
              Support
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} IpBok by IpTec. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
