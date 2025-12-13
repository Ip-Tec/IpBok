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

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Contact
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Support
            </a>
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
