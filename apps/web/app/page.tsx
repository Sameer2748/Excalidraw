import Navbar from "../components/Navbar";
import { FeatureCard } from "@repo/ui/FeatureCard";
import Checker from "../hooks/Checker";

const Index = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <Checker />

      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-up">
            Create Beautiful Hand-Drawn Diagrams
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-up">
            Collaborate in real-time with your team using our intuitive
            whiteboard tool
          </p>
          <div className="flex gap-4 justify-center animate-fade-up">
            <button className="bg-primary hover:bg-primary-hover text-white p-2 rounded-xl">
              Try Now - Its Free
            </button>
            <button className="border-primary text-primary hover:bg-primary/10 p-2 rounded-xl">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Hand-Drawn Style"
              description="Create diagrams that look like they were drawn by hand, perfect for presentations and documentation."
            />
            <FeatureCard
              title="Real-Time Collaboration"
              description="Work together with your team in real-time, no matter where they are in the world."
            />
            <FeatureCard
              title="Smart Drawing"
              description="Our intelligent drawing aids help you create perfect shapes while maintaining the hand-drawn aesthetic."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
