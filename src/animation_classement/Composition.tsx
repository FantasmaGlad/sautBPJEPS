import { AbsoluteFill, useCurrentFrame } from "remotion";

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="bg-black flex items-center justify-center">
      <h1 className="text-white text-6xl font-bold">
        Frame {frame}
      </h1>
    </AbsoluteFill>
  );
};
