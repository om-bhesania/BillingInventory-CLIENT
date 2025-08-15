import { useState, useEffect } from "react";

const colors = [
  "from-blue-500",
  "from-green-500",
  "from-orange-500",
  "from-red-500",
];

const LoadingSpinner = () => {
  const [gradient, setGradient] = useState(colors[0]);
  const [emojiColor, setEmojiColor] = useState("text-blue-500/60");

  useEffect(() => {
    const interval = setInterval(() => {
      const nextGradient =
        colors[(colors.indexOf(gradient) + 1) % colors.length];
      setGradient(nextGradient);
      setEmojiColor(`text-${nextGradient.split("-")[1]}/60`);
    }, 2000);

    return () => clearInterval(interval);
  }, [gradient]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4 ">
        <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse">
          <span className={`text-4xl animate-bounce `}>🍦</span>
        </div>
        <p className="text-black text-2xl font-medium !m-0 animate-pulse">
          Please wait Blizz is Loading{" "}
          <span className="animate-pulse duration-500 transition ease-linear text-3xl">
            .
          </span>{" "}
          <span className="animate-pulse duration-500 transition ease-linear text-3xl">
            .
          </span>{" "}
          <span className="animate-pulse duration-500 transition ease-linear text-3xl">
            .
          </span>{" "}
          <span className="animate-pulse duration-500 transition ease-linear text-3xl">
            .
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
