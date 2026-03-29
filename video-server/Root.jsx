import { Composition, registerRoot } from "remotion";
import { NewsVideo } from "./Video.jsx";

const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NewsVideo"
        component={NewsVideo}
        durationInFrames={150}   // default, will be overridden
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          scenes: ["Breaking news in the AI sector."],
          persona: "Investor",
        }}
      />
    </>
  );
};

// Register the root so Remotion can find the composition by ID
registerRoot(RemotionRoot);
