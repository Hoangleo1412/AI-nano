import React from 'react';

interface PromptGuideProps {
  onBack: () => void;
}

interface ExampleProps {
    title: string;
    goal: string;
    prompt: string;
}

const ExampleCard: React.FC<ExampleProps> = ({ title, goal, prompt }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-transform transform hover:scale-105 hover:border-yellow-400">
        <h3 className="text-xl font-bold text-yellow-400 mb-2">{title}</h3>
        <p className="text-gray-400 mb-4"><span className="font-semibold text-gray-300">Goal:</span> {goal}</p>
        <div className="bg-gray-900 p-4 rounded-lg">
            <p className="font-mono text-sm text-gray-200 whitespace-pre-wrap">{prompt}</p>
        </div>
    </div>
);

const PromptGuide: React.FC<PromptGuideProps> = ({ onBack }) => {
  const examples: ExampleProps[] = [
    {
        title: "80s Retro Vibe",
        goal: "Give a modern design a nostalgic, 80s-inspired look.",
        prompt: "Transform this design into an 80s retro style. Use neon pink and teal colors, a chrome effect on the text, and add a subtle grid pattern in the background."
    },
    {
        title: "Watercolor Painting",
        goal: "Convert a sharp graphic into a soft, artistic watercolor piece.",
        prompt: "Redraw this design as a delicate watercolor painting. Use soft, blended colors with visible brush strokes and a textured paper effect."
    },
    {
        title: "Minimalist Line Art",
        goal: "Simplify a complex design into a clean, modern line drawing.",
        prompt: "Simplify this design into a single-color minimalist line art. Use clean, elegant black lines and remove all shading and color fills."
    },
    {
        title: "Cyberpunk Glitch",
        goal: "Add a futuristic, high-tech feel to the design.",
        prompt: "Give this design a cyberpunk aesthetic. Add a digital glitch effect, glowing neon highlights, and incorporate some futuristic circuit board patterns."
    },
    {
        title: "Vintage University Logo",
        goal: "Make the design look like a classic, weathered university crest.",
        prompt: "Reimagine this as a vintage university logo from the 1950s. Use distressed textures, a limited color palette of crimson and cream, and classic serif typography."
    },
    {
        title: "Art Deco Elegance",
        goal: "Infuse the design with the geometric shapes and luxury of the Art Deco movement.",
        prompt: "Recreate this design in an Art Deco style. Use strong geometric lines, gold and black colors, and a symmetrical, elegant composition."
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-12 animate-fade-in">
        <header className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-caveat text-white tracking-tight">
                AI Prompting <span className="text-yellow-400">Guide</span>
            </h1>
            <p className="mt-4 text-lg text-gray-500">Learn how to write effective prompts to transform your designs.</p>
        </header>
        
        <main className="space-y-16">
            <section>
                <h2 className="text-3xl font-bold text-white mb-4 text-center">Core Concepts</h2>
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <h3 className="text-xl font-semibold text-white mb-2">Be Specific</h3>
                        <p className="text-gray-400">Instead of "make it cool", specify what "cool" means to you. E.g., "add a graffiti street art style".</p>
                    </div>
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <h3 className="text-xl font-semibold text-white mb-2">Mention Art Styles</h3>
                        <p className="text-gray-400">Use styles like "watercolor", "art deco", "cyberpunk aesthetic", or "minimalist line art".</p>
                    </div>
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <h3 className="text-xl font-semibold text-white mb-2">Combine Ideas</h3>
                        <p className="text-gray-400">Mix concepts for unique results. Try "a vintage retro design with a futuristic twist".</p>
                    </div>
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <h3 className="text-xl font-semibold text-white mb-2">Set the Mood</h3>
                        <p className="text-gray-400">Use descriptive adjectives like "vibrant", "moody", "serene", or "energetic" to guide the feeling.</p>
                    </div>
                </div>
            </section>
            
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Prompt Examples</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {examples.map(ex => <ExampleCard key={ex.title} {...ex} />)}
                </div>
            </section>
        </main>
        
        <footer className="text-center mt-16">
            <button 
                onClick={onBack}
                className="px-8 py-3 rounded-md font-semibold tracking-wider uppercase transition-all duration-300 bg-yellow-400 text-black hover:bg-yellow-300"
            >
                Back to Studio
            </button>
        </footer>
    </div>
  );
};

export default PromptGuide;
