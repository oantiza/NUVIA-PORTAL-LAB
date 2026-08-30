import {loadFont} from "@remotion/fonts";
import {
  AbsoluteFill,
  CanvasImage,
  Composition,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

await Promise.all([
  loadFont({family: "Fraunces", url: staticFile("fraunces-latin.woff2")}),
  loadFont({family: "Inter", url: staticFile("inter-latin.woff2")}),
]);

const INK = "#050913";
const GOLD = "#b58a46";
const IVORY = "#f4efe5";

export const NuviaAcademyHeroBrand: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: INK}}>
      <Interactive.Div
        name="Fondo · azul académico de izquierda a derecha"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, #061225 0%, #0a1e38 32%, #163451 59%, #2a506d 80%, #446e89 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          opacity: 0.32,
          backgroundImage:
            "linear-gradient(rgba(220,234,241,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(220,234,241,.13) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(90deg, transparent 46%, #000 100%)",
          translate: interpolate(frame, [0, 239], ["0px 0px", "-18px -8px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
        }}
      />

      <Interactive.Div
        name="Lámina académica · libro y geometría"
        style={{
          position: "absolute",
          right: 24,
          top: 0,
          width: 840,
          height: 640,
          pointerEvents: "none",
          opacity: interpolate(frame, [18, 70], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 239], [1.025, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
            output: "perceptual-scale",
          }),
          translate: interpolate(frame, [0, 239], ["16px 0px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
        }}
      >
        <svg width="840" height="640" viewBox="0 0 840 640" aria-hidden="true">
          <defs>
            <linearGradient id="academy-study-ink" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#c7dbe7" stopOpacity="0.1" />
              <stop offset="1" stopColor="#e3edf2" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="academy-page-wash" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#eef4f6" stopOpacity="0.045" />
              <stop offset="1" stopColor="#eef4f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Elementary constructions evoke study, not market-price charts. */}
          <g fill="none" stroke="url(#academy-study-ink)" strokeWidth="1.4">
            <circle cx="610" cy="164" r="98" />
            <circle cx="610" cy="164" r="73" strokeDasharray="3 9" />
            <path d="M488 164H732 M610 42V286 M525 213L644 72L695 213Z" />
            <path d="M215 88V209H391Z M215 189H235V209" />
            <path d="M194 236H408" strokeDasharray="2 8" />
          </g>
          <g fill="#d3dfdf" opacity="0.3" fontFamily="Fraunces, Georgia, serif" fontStyle="italic">
            <text x="190" y="155" fontSize="23">a</text>
            <text x="292" y="231" fontSize="23">b</text>
            <text x="310" y="142" fontSize="23">c</text>
            <text x="235" y="278" fontSize="27">a² + b² = c²</text>
          </g>
          <g fill="#d2b67e" opacity="0.5">
            <circle cx="215" cy="88" r="3" />
            <circle cx="391" cy="209" r="3" />
            <circle cx="644" cy="72" r="3" />
            <circle cx="610" cy="164" r="3" />
          </g>

          {/* A fine-line open book, without a photographic or historic setting. */}
          <g stroke="url(#academy-study-ink)" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M470 358C408 310 302 306 213 332L193 509C292 486 396 498 470 545C544 498 648 486 747 509L727 332C638 306 532 310 470 358Z" fill="url(#academy-page-wash)" />
            <path d="M470 358V545 M209 350L178 523C290 499 388 513 470 559C552 513 650 499 762 523L731 350" fill="none" />
            <path d="M193 538C297 519 389 530 470 572C551 530 643 519 747 538" fill="none" opacity="0.5" />
            <g fill="none" opacity="0.6" strokeWidth="1.2">
              <path d="M255 359C319 346 384 354 427 377 M252 384C315 372 380 379 427 402 M249 409C312 397 377 405 427 427 M246 434C309 422 373 430 427 452 M243 459C285 451 329 453 369 463" />
              <path d="M513 377C556 354 621 346 685 359 M513 402C560 379 625 372 688 384 M513 427C563 405 628 397 691 409 M513 452C567 430 631 422 694 434 M571 463C611 453 655 451 697 459" />
            </g>
          </g>
          <path d="M470 358V545" stroke="#cfb17a" strokeWidth="1.5" opacity="0.42" />
        </svg>
      </Interactive.Div>

      <div
        style={{
          position: "absolute",
          left: 94,
          top: 126,
          width: 1120,
          height: 274,
          overflow: "hidden",
          opacity: interpolate(frame, [8, 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          clipPath: `inset(0 ${interpolate(frame, [8, 56], [100, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}% 0 0)`,
          translate: interpolate(frame, [8, 50], ["-24px 0px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <CanvasImage
          src={staticFile("academy-logo-lineal-transparente.svg")}
          style={{width: 1120, height: 274, objectFit: "contain"}}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 252,
          top: 432,
          color: IVORY,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 42,
          fontWeight: 430,
          letterSpacing: "-0.025em",
          opacity: interpolate(frame, [48, 78], [0, 0.92], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [48, 82], ["0px 16px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Saber es patrimonio.
      </div>

      <div
        style={{
          position: "absolute",
          left: 252,
          top: 504,
          display: "flex",
          alignItems: "center",
          gap: 18,
          color: "rgba(244,239,229,.64)",
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: 15,
          fontWeight: 560,
          letterSpacing: "0.17em",
          textTransform: "uppercase",
          opacity: interpolate(frame, [70, 102], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <span style={{color: GOLD}}>Cursos</span>
        <span>·</span>
        <span>Guías</span>
        <span>·</span>
        <span>Vídeos</span>
        <span>·</span>
        <span>Simuladores</span>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 34,
          border: "1px solid rgba(181,138,70,.19)",
          opacity: interpolate(frame, [0, 50], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 100px rgba(0,0,0,.18)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export const AcademyHeroBrandComposition: React.FC = () => (
  <Composition
    id="NUVIA-Academy-Hero"
    component={NuviaAcademyHeroBrand}
    durationInFrames={240}
    fps={30}
    width={1920}
    height={640}
  />
);
