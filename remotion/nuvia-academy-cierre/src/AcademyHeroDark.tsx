import {
  AbsoluteFill,
  CanvasImage,
  Composition,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const NAVY = "#020f22";

const particles = [
  {x: 1184, y: 300, size: 4, from: 36, drift: -38, opacity: 0.4},
  {x: 1288, y: 418, size: 3, from: 52, drift: -48, opacity: 0.3},
  {x: 1392, y: 330, size: 5, from: 62, drift: -54, opacity: 0.32},
  {x: 1504, y: 454, size: 3, from: 78, drift: -44, opacity: 0.28},
  {x: 1608, y: 278, size: 4, from: 92, drift: -50, opacity: 0.34},
  {x: 1698, y: 398, size: 2, from: 108, drift: -36, opacity: 0.25},
];

export const NuviaAcademyHeroDark: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: NAVY}}>
      <CanvasImage
        src={staticFile("academy-youtube-banner-dark.png")}
        style={{
          position: "absolute",
          inset: -18,
          width: 1956,
          height: 676,
          objectFit: "cover",
          opacity: interpolate(frame, [0, 38], [0.35, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 239], [1.045, 1.018], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
            output: "perceptual-scale",
          }),
          translate: interpolate(frame, [0, 239], ["16px 0px", "-7px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(2,15,34,.28) 0%, rgba(2,15,34,.08) 49%, rgba(2,15,34,.3) 100%), linear-gradient(180deg, rgba(2,15,34,.28), transparent 34%, rgba(2,15,34,.26))",
          mixBlendMode: "multiply",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: interpolate(frame, [0, 239], [1110, 1260], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
          top: 44,
          width: 760,
          height: 560,
          borderRadius: "50%",
          opacity: interpolate(frame, [0, 75, 170, 239], [0.04, 0.24, 0.17, 0.08], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
          background:
            "radial-gradient(ellipse at center, rgba(255,226,163,.9) 0%, rgba(204,155,72,.34) 38%, transparent 72%)",
          filter: "blur(34px)",
          mixBlendMode: "screen",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: interpolate(frame, [0, 70], [1920, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.65, 0, 0.35, 1),
          }),
          height: 640,
          background:
            "linear-gradient(90deg, #020f22 0%, #020f22 82%, rgba(2,15,34,.72) 94%, transparent 100%)",
        }}
      />

      {particles.map((particle, index) => (
        <div
          key={`${particle.x}-${particle.y}`}
          style={{
            position: "absolute",
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            backgroundColor: index % 2 === 0 ? "#f4d494" : "#ffffff",
            boxShadow: "0 0 12px rgba(244,212,148,.7)",
            opacity: interpolate(
              frame,
              [particle.from, particle.from + 20, particle.from + 82, particle.from + 112],
              [0, particle.opacity, particle.opacity * 0.8, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.quad),
              },
            ),
            translate: interpolate(
              frame,
              [particle.from, particle.from + 112],
              ["0px 0px", `${index % 2 === 0 ? 14 : -12}px ${particle.drift}px`],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.quad),
              },
            ),
          }}
        />
      ))}

      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 130px rgba(0,8,20,.52)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export const AcademyHeroDarkComposition: React.FC = () => (
  <Composition
    id="NUVIA-Academy-Hero"
    component={NuviaAcademyHeroDark}
    durationInFrames={240}
    fps={30}
    width={1920}
    height={640}
  />
);
