import { 
  Wallet, 
  BarChart3, 
  Receipt, 
  Building2, 
  User, 
  type LucideIcon 
} from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => {
  return (
    <div 
      className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light transition-colors group-hover:bg-gradient-primary">
        <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
};

const features = [
  {
    icon: Wallet,
    title: "Income & Expense Tracker",
    description: "Add transactions and categorize them instantly. Keep track of every dollar coming in and going out.",
  },
  {
    icon: BarChart3,
    title: "Auto-Generated Reports",
    description: "View profit & loss, balance sheets, and cash flow in one click. Beautiful visualizations included.",
  },
  {
    icon: Receipt,
    title: "Loan & Debt Management",
    description: "Track repayments and monitor outstanding balances. Never miss a payment deadline again.",
  },
  {
    icon: Building2,
    title: "Business Mode",
    description: "Invite team members, manage taxes, and export financial summaries. Perfect for growing companies.",
  },
  {
    icon: User,
    title: "Personal Mode",
    description: "Set budgets, savings goals, and get clarity on your spending. Take control of your finances.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="bg-background py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
            Features
          </span>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Everything You Need to{" "}
            <span className="text-gradient">Stay Organized</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Whether you're tracking personal expenses or running a growing business, 
            our tool simplifies bookkeeping and keeps you financially organized.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
