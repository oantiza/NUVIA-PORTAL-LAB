import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  Composition,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const NAVY = "#0e2d58";
const GOLD = "#b58a46";

const exactNPath =
  "M 166.046875 144.886719 L 277.230469 144.886719 L 496.179688 399.753906 C 497.460938 368.535218 498.746094 335.609375 499.601562 306.101562 C 500.027344 290.707031 497.460938 280.445312 487.625 274.457031 C 486.34375 273.601562 486.769531 271.464844 488.480469 271.890625 C 494.894531 275.3125 500.457031 281.726562 503.875 288.140625 L 521.835938 217.15625 C 522.265625 215.015625 524.832031 215.445312 524.832031 217.582031 C 520.980469 253.929688 517.988281 301.824219 518.414062 348.867188 C 532.527344 333.042969 549.207031 322.78125 568.019531 318.929688 C 570.585938 318.503906 571.441406 320.640625 568.875 321.925781 C 541.082031 335.609375 522.691406 357.417969 522.691406 386.070312 L 522.691406 516.496094 L 513.710938 516.496094 L 252.429688 212.023438 L 252.429688 433.535156 C 252.429688 484.851562 258.84375 499.390625 308.019531 501.101562 L 308.019531 512.648438 L 168.183594 512.648438 L 168.183594 501.101562 C 215.652344 500.246094 225.058594 485.28125 225.058594 433.535156 L 225.058594 214.589844 C 225.058594 177.8125 212.230469 162.84375 166.046875 160.28125 Z M 166.046875 144.886719";

const topLeaf =
  "M 526.539062 206.464844 C 510.71875 197.484375 502.59375 185.082031 503.875 167.121094 C 505.160156 137.617188 522.691406 108.964844 553.480469 88.4375 C 565.882812 113.242188 572.726562 137.617188 569.730469 160.707031 C 566.308594 184.65625 552.199219 200.050781 526.539062 206.464844 Z M 526.539062 206.464844";

const leftLeaf =
  "M 493.613281 255.214844 C 476.082031 259.0625 459.402344 253.929688 447 241.53125 C 432.035156 226.5625 424.335938 204.324219 423.480469 179.09375 C 447 180.804688 467.101562 188.074219 480.785156 202.1875 C 494.894531 216.300781 500.027344 236.398438 493.613281 255.214844 Z M 493.613281 255.214844";

const rightLeaf =
  "M 541.933594 298.832031 C 538.085938 285.148438 540.652344 269.753906 548.777344 258.207031 C 562.460938 238.535156 587.691406 233.40625 622.332031 238.535156 C 617.625 263.765625 606.507812 284.292969 590.257812 295.410156 C 576.574219 304.820312 558.183594 306.957031 541.933594 298.832031 Z M 541.933594 298.832031";

const easePaint = Easing.bezier(0.45, 0.03, 0.24, 1);
const easeGrow = Easing.bezier(0.16, 1, 0.3, 1);

const progress = (frame: number, from: number, to: number, easing = easePaint) =>
  interpolate(frame, [from, to], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const BrushContact: React.FC<{ frame: number }> = ({ frame }) => {
  let x = 0;
  let y = 0;
  let angle = 0;
  let opacity = 0;

  if (frame >= 20 && frame < 28) {
    const p = progress(frame, 20, 28);
    x = interpolate(p, [0, 1], [174, 286]);
    y = interpolate(p, [0, 1], [507, 507]);
    angle = 0;
    opacity = progress(frame, 20, 23);
  } else if (frame >= 28 && frame < 50) {
    const p = progress(frame, 28, 50);
    x = interpolate(p, [0, 1], [238, 238]);
    y = interpolate(p, [0, 1], [500, 178]);
    angle = -90;
    opacity = 1;
  } else if (frame >= 50 && frame < 58) {
    const p = progress(frame, 50, 58);
    x = interpolate(p, [0, 0.42, 1], [238, 171, 275]);
    y = interpolate(p, [0, 0.42, 1], [178, 153, 153]);
    angle = interpolate(p, [0, 0.42, 1], [-158, -158, 0]);
    opacity = 1;
  } else if (frame >= 58 && frame < 90) {
    const p = progress(frame, 58, 90);
    x = interpolate(p, [0, 1], [272, 517]);
    y = interpolate(p, [0, 1], [165, 505]);
    angle = 54;
    opacity = 1;
  } else if (frame >= 90 && frame <= 108) {
    const p = progress(frame, 90, 108);
    x = interpolate(p, [0, 0.68, 1], [518, 519, 524]);
    y = interpolate(p, [0, 0.68, 1], [505, 350, 218]);
    angle = -88;
    opacity = 1 - progress(frame, 105, 109);
  }

  if (opacity <= 0) return null;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${angle})`} style={{ filter: "blur(0.55px)" }}>
      <path d="M -48 -16 C -29 -16 -8 -10 10 0 C -8 10 -29 16 -48 16 C -35 8 -35 -8 -48 -16 Z" fill="url(#brush-brown)" opacity={0.95} />
      <path d="M -42 -11 C -24 -10 -7 -7 8 -1" fill="none" stroke="#241d1a" strokeWidth="2.2" strokeLinecap="round" opacity={0.62} />
      <path d="M -44 -5 C -25 -5 -6 -3 10 0" fill="none" stroke="#b18a55" strokeWidth="2" strokeLinecap="round" opacity={0.52} />
      <path d="M -44 3 C -25 3 -6 2 9 0" fill="none" stroke="#2e241e" strokeWidth="2.4" strokeLinecap="round" opacity={0.66} />
      <path d="M -42 10 C -23 9 -7 6 8 1" fill="none" stroke="#9a7344" strokeWidth="1.8" strokeLinecap="round" opacity={0.48} />
      <ellipse cx={8} cy={0} rx={5.5} ry={8.5} fill={NAVY} opacity={0.8} />
    </g>
  );
};

const GrowingLeaf: React.FC<{
  path: string;
  anchorX: number;
  anchorY: number;
  from: number;
  to: number;
  frame: number;
}> = ({ path, anchorX, anchorY, from, to, frame }) => {
  const amount = progress(frame, from, to, easeGrow);
  return (
    <path
      d={path}
      fill={GOLD}
      opacity={amount}
      transform={`translate(${anchorX} ${anchorY}) scale(${amount}) translate(${-anchorX} ${-anchorY})`}
    />
  );
};

const ExactLogoAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const lowerSerifPaint = progress(frame, 20, 28);
  const lowerSerifSet = progress(frame, 24, 31);
  const leftStemPaint = progress(frame, 27, 50);
  const leftStemSet = progress(frame, 31, 54);
  const upperSerifPaint = progress(frame, 49, 58);
  const upperSerifSet = progress(frame, 53, 62);
  const diagonalPaint = progress(frame, 58, 90);
  const diagonalSet = progress(frame, 63, 96);
  const trunkPaint = progress(frame, 90, 108);
  const trunkSet = progress(frame, 95, 112);
  const branchOnePaint = progress(frame, 101, 111);
  const branchTwoPaint = progress(frame, 105, 115);
  const finalClean = progress(frame, 142, 152, easeGrow);
  const cameraScale = interpolate(frame, [0, 96, 132, 158], [1.34, 1.29, 1.1, 1], {
    easing: Easing.bezier(0.42, 0, 0.58, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nuviaReveal = progress(frame, 108, 134);
  const academyReveal = progress(frame, 128, 146);
  const nuviaFront = nuviaReveal * 110 - 5;
  const academyFront = academyReveal * 110 - 5;

  return (
    <div
      style={{
        position: "absolute",
        left: 377.5,
        top: 77.5,
        width: 525,
        height: 525,
        transform: `scale(${cameraScale})`,
        transformOrigin: "50% 54%",
      }}
    >
      <svg viewBox="0 0 750 750" style={{ position: "absolute", inset: 0, width: 525, height: 525 }}>
        <defs>
          <clipPath id="exact-n-shape">
            <path d={exactNPath} />
          </clipPath>
          <linearGradient id="brush-brown" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1d1917" />
            <stop offset="42%" stopColor="#6b5034" />
            <stop offset="76%" stopColor="#b58a52" />
            <stop offset="100%" stopColor="#263650" />
          </linearGradient>
          <filter id="soft-bristle-edge" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.055" numOctaves="2" seed="17" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" xChannelSelector="R" yChannelSelector="B" />
            <feGaussianBlur stdDeviation="0.3" />
          </filter>
          <mask id="painted-n" maskUnits="userSpaceOnUse" x="120" y="80" width="540" height="470">
            <rect x="120" y="80" width="540" height="470" fill="black" />
            <path d="M 174 507 C 210 507 252 507 304 507" fill="none" stroke="#b8b8b8" strokeWidth="25" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lowerSerifPaint} filter="url(#soft-bristle-edge)" />
            <path d="M 174 507 C 210 507 252 507 304 507" fill="none" stroke="white" strokeWidth="15" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lowerSerifSet} />
            <path d="M 238 500 C 236 432 238 262 238 178" fill="none" stroke="#b8b8b8" strokeWidth="42" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - leftStemPaint} filter="url(#soft-bristle-edge)" />
            <path d="M 238 500 C 236 432 238 262 238 178" fill="none" stroke="white" strokeWidth="25" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - leftStemSet} />
            <path d="M 238 178 C 220 161 190 154 168 153 C 202 151 240 151 276 151" fill="none" stroke="#b8b8b8" strokeWidth="33" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - upperSerifPaint} filter="url(#soft-bristle-edge)" />
            <path d="M 238 178 C 220 161 190 154 168 153 C 202 151 240 151 276 151" fill="none" stroke="white" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - upperSerifSet} />
            <path d="M 270 164 L 518 507" fill="none" stroke="#b8b8b8" strokeWidth="96" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - diagonalPaint} filter="url(#soft-bristle-edge)" />
            <path d="M 270 164 L 518 507" fill="none" stroke="white" strokeWidth="66" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - diagonalSet} />
            <path d="M 518 507 C 518 438 517 369 518 340 C 518 296 521 251 524 217" fill="none" stroke="#b8b8b8" strokeWidth="31" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - trunkPaint} filter="url(#soft-bristle-edge)" />
            <path d="M 518 507 C 518 438 517 369 518 340 C 518 296 521 251 524 217" fill="none" stroke="white" strokeWidth="17" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - trunkSet} />
            <path d="M 517 369 C 531 341 548 326 570 320" fill="none" stroke="white" strokeWidth="38" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - branchOnePaint} />
            <path d="M 506 310 C 502 292 497 281 488 274" fill="none" stroke="white" strokeWidth="28" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - branchTwoPaint} />
          </mask>
        </defs>

        <g
          fill="none"
          stroke={NAVY}
          strokeLinecap="round"
          filter="url(#soft-bristle-edge)"
          opacity={interpolate(frame, [20, 112, 145], [0.42, 0.3, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        >
          <path d="M 174 504 C 210 507 253 504 304 508" strokeWidth="5" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lowerSerifPaint} />
          <path d="M 231 500 C 230 421 232 260 232 178" strokeWidth="3.5" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - leftStemPaint} />
          <path d="M 239 501 C 237 423 240 260 239 176" strokeWidth="4.5" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - leftStemPaint} />
          <path d="M 246 498 C 244 421 247 258 246 181" strokeWidth="2.5" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - leftStemPaint} />
          <path d="M 238 178 C 218 158 188 151 167 154 C 205 148 242 151 278 154" strokeWidth="4" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - upperSerifPaint} />
          <path d="M 259 171 L 504 513" strokeWidth="4" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - diagonalPaint} />
          <path d="M 267 164 L 512 507" strokeWidth="7" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - diagonalPaint} />
          <path d="M 278 159 L 524 499" strokeWidth="3" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - diagonalPaint} />
          <path d="M 518 508 C 520 421 516 302 525 216" strokeWidth="4" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - trunkPaint} />
        </g>

        <g clipPath="url(#exact-n-shape)" mask="url(#painted-n)" opacity={1 - finalClean}>
          <path d={exactNPath} fill={NAVY} />
          <g opacity={interpolate(frame, [20, 112, 146], [0.35, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
            <path d="M 225 505 C 230 426 226 271 233 174" fill="none" stroke="#567096" strokeWidth="5" strokeLinecap="round" />
            <path d="M 244 500 C 247 420 241 273 246 179" fill="none" stroke="#071a35" strokeWidth="4" strokeLinecap="round" />
            <path d="M 276 169 L 512 501" fill="none" stroke="#46678e" strokeWidth="6" strokeLinecap="round" />
            <path d="M 288 169 L 521 488" fill="none" stroke="#071a35" strokeWidth="5" strokeLinecap="round" />
            <path d="M 265 183 L 500 505" fill="none" stroke="#7890ae" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>

        <g opacity={1 - finalClean}>
          <GrowingLeaf path={topLeaf} anchorX={526} anchorY={206} from={103} to={115} frame={frame} />
          <GrowingLeaf path={leftLeaf} anchorX={494} anchorY={255} from={109} to={121} frame={frame} />
          <GrowingLeaf path={rightLeaf} anchorX={542} anchorY={299} from={115} to={127} frame={frame} />
        </g>
        <BrushContact frame={frame} />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          width: 525,
          height: 525,
          clipPath: "inset(69% 7% 9.5% 10%)",
          opacity: 1 - finalClean,
          transform: `translateY(${interpolate(nuviaReveal, [0, 1], [7, 0])}px)`,
          maskImage: `linear-gradient(to right, #000 0%, #000 ${nuviaFront - 4}%, rgba(0,0,0,.45) ${nuviaFront}%, transparent ${nuviaFront + 5}%, transparent 100%)`,
          WebkitMaskImage: `linear-gradient(to right, #000 0%, #000 ${nuviaFront - 4}%, rgba(0,0,0,.45) ${nuviaFront}%, transparent ${nuviaFront + 5}%, transparent 100%)`,
        }}
      >
        <CanvasImage src={staticFile("logo.svg")} style={{ position: "absolute", inset: 0, width: 525, height: 525 }} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          width: 525,
          height: 525,
          clipPath: "inset(87.5% 5% 3.5% 5%)",
          opacity: 1 - finalClean,
          transform: `translateY(${interpolate(academyReveal, [0, 1], [5, 0])}px)`,
          maskImage: `linear-gradient(to right, #000 0%, #000 ${academyFront - 4}%, rgba(0,0,0,.45) ${academyFront}%, transparent ${academyFront + 5}%, transparent 100%)`,
          WebkitMaskImage: `linear-gradient(to right, #000 0%, #000 ${academyFront - 4}%, rgba(0,0,0,.45) ${academyFront}%, transparent ${academyFront + 5}%, transparent 100%)`,
        }}
      >
        <CanvasImage src={staticFile("logo.svg")} style={{ position: "absolute", inset: 0, width: 525, height: 525 }} />
      </div>

      <CanvasImage src={staticFile("logo.svg")} style={{ position: "absolute", inset: 0, width: 525, height: 525, opacity: finalClean }} />
    </div>
  );
};

const OriginalBackgroundPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = progress(frame, 12, 18, Easing.inOut(Easing.quad));
  return (
    <AbsoluteFill
      style={{
        opacity,
        maskImage: "radial-gradient(ellipse 62% 64% at 50% 50%, #000 0%, #000 80%, rgba(0,0,0,.96) 86%, rgba(0,0,0,.5) 94%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 62% 64% at 50% 50%, #000 0%, #000 80%, rgba(0,0,0,.96) 86%, rgba(0,0,0,.5) 94%, transparent 100%)",
      }}
    >
      <CanvasImage
        src={staticFile("paper.png")}
        style={{ position: "absolute", left: 0, top: 0, width: 1280, height: 720 }}
      />
    </AbsoluteFill>
  );
};

export const NuviaAcademyClosing: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#e7e5dd", overflow: "hidden" }}>
      <Video src={staticFile("CIERRE.mp4")} style={{ width: 1280, height: 720 }} objectFit="cover" volume={1} />
      <OriginalBackgroundPlate />
      <ExactLogoAnimation />
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC = () => (
  <Composition id="NUVIA-Academy-Cierre" component={NuviaAcademyClosing} durationInFrames={240} fps={24} width={1280} height={720} />
);
