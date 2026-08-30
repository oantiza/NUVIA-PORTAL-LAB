import {loadFont} from "@remotion/fonts";
import {
  AbsoluteFill,
  CanvasImage,
  Composition,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

await Promise.all([
  loadFont({
    family: "Fraunces",
    url: staticFile("fraunces-latin.woff2"),
  }),
  loadFont({
    family: "Inter",
    url: staticFile("inter-latin.woff2"),
  }),
]);

const NAVY = "#0b2b54";
const NAVY_SOFT = "#42546a";
const BRONZE = "#b88b43";
const PAPER = "#f3efe6";

const modules = [
  "Dinero con criterio",
  "Inflación",
  "Activos financieros",
  "Interés compuesto",
];

const RevealLine: React.FC<{
  children: React.ReactNode;
  from: number;
  style?: React.CSSProperties;
}> = ({children, from, style}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{overflow: "hidden", paddingBottom: 8, ...style}}>
      <div
        style={{
          opacity: interpolate(frame, [from, from + 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [from, from + 24], ["0px 46px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const NuviaAcademyHero: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: PAPER}}>
      <CanvasImage
        src={staticFile("academy-hero-atmosphere.webp")}
        style={{
          position: "absolute",
          inset: -14,
          width: 1948,
          height: 668,
          objectFit: "cover",
          scale: interpolate(frame, [0, 239], [1.012, 1.027], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
            output: "perceptual-scale",
          }),
          translate: interpolate(frame, [0, 239], ["-10px 0px", "7px -3px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(247,244,237,.98) 0%, rgba(247,244,237,.93) 38%, rgba(247,244,237,.42) 58%, rgba(247,244,237,0) 77%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: -140,
          right: interpolate(frame, [0, 239], [212, 96], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
          width: 360,
          height: 940,
          rotate: "12deg",
          opacity: interpolate(frame, [0, 70, 170, 239], [0.04, 0.13, 0.09, 0.04], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
          background: "linear-gradient(90deg, transparent, #fff6dd 48%, transparent)",
          filter: "blur(38px)",
          mixBlendMode: "screen",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 162,
          top: 74,
          width: 930,
          height: 492,
          color: NAVY,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: NAVY,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 20,
            fontWeight: 650,
            letterSpacing: "0.2em",
            opacity: interpolate(frame, [0, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <span
            style={{
              display: "block",
              width: interpolate(frame, [4, 30], [0, 76], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              height: 2,
              backgroundColor: BRONZE,
            }}
          />
          ACADEMIA NUVIA
        </div>

        <div style={{marginTop: 44}}>
          <RevealLine from={14}>
            <div
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: 104,
                fontWeight: 520,
                letterSpacing: "-0.055em",
                lineHeight: 0.92,
              }}
            >
              Saber es
            </div>
          </RevealLine>
          <RevealLine from={25}>
            <div
              style={{
                color: BRONZE,
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: 104,
                fontStyle: "italic",
                fontWeight: 420,
                letterSpacing: "-0.055em",
                lineHeight: 0.92,
              }}
            >
              patrimonio
            </div>
          </RevealLine>
        </div>

        <div
          style={{
            marginTop: 27,
            maxWidth: 770,
            color: NAVY_SOFT,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 27,
            fontWeight: 430,
            letterSpacing: "-0.015em",
            lineHeight: 1.35,
            opacity: interpolate(frame, [42, 66], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [42, 70], ["0px 16px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          Cursos, guías y herramientas para comprender el dinero con calma y
          avanzar con criterio.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 162,
          width: 1020,
          bottom: 52,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 38,
          borderTop: "1px solid rgba(11,43,84,.2)",
          paddingTop: 18,
        }}
      >
        {modules.map((module, index) => {
          const from = 66 + index * 8;
          return (
            <div
              key={module}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 13,
                color: NAVY,
                fontFamily: "Inter, Arial, sans-serif",
                opacity: interpolate(frame, [from, from + 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                translate: interpolate(frame, [from, from + 22], ["0px 11px", "0px 0px"], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            >
              <span style={{color: BRONZE, fontSize: 16, fontWeight: 700}}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span style={{fontSize: 18, fontWeight: 560, letterSpacing: "-0.01em"}}>
                {module}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const AcademyHeroComposition: React.FC = () => (
  <Composition
    id="NUVIA-Academy-Hero"
    component={NuviaAcademyHero}
    durationInFrames={240}
    fps={30}
    width={1920}
    height={640}
  />
);
