"use client";
import { Player } from "@remotion/player";
import { ScoreNumber1 } from "@/animation_classement/ScoreNumber1";

interface Props {
  athleteName: string;
  score: string;
  theme: "homme" | "femme";
  onEnd?: () => void;
}

export function ScoreOverlay({ athleteName, score, theme, onEnd }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)" }}>
      <Player
        component={ScoreNumber1}
        inputProps={{ athleteName, score, theme }}
        durationInFrames={150}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        style={{ width: "100%", height: "100%" }}
        autoPlay
        onEnded={onEnd}
      />
    </div>
  );
}
