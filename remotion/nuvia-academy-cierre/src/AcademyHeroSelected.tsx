import {AbsoluteFill, CanvasImage, Composition, staticFile} from "remotion";

export const NuviaAcademyHeroSelected: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: "#050913"}}>
    <CanvasImage
      name="Banner Academy · imagen elegida"
      src={staticFile("academy-hero-selected-v2.jpeg")}
      style={{width: "100%", height: "100%", objectFit: "contain"}}
    />
  </AbsoluteFill>
);

export const AcademyHeroSelectedComposition: React.FC = () => (
  <Composition
    id="NUVIA-Academy-Hero"
    component={NuviaAcademyHeroSelected}
    durationInFrames={240}
    fps={30}
    width={1920}
    height={640}
  />
);
