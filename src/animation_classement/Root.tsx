import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { ScoreNumber1 } from "./ScoreNumber1";
import "./style.css";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ScoreNumber1Homme"
        component={ScoreNumber1}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          athleteName: "Lucas Martin",
          score: "285",
          theme: "homme",
        }}
      />
      <Composition
        id="ScoreNumber1Femme"
        component={ScoreNumber1}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          athleteName: "Sophie Dupont",
          score: "241",
          theme: "femme",
        }}
      />
      <Composition
        id="MyComposition"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
