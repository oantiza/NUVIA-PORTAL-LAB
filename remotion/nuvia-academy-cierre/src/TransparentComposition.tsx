import {Audio} from "@remotion/media";
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

const progress = (
  frame: number,
  from: number,
  to: number,
  easing = easePaint,
) =>
  interpolate(frame, [from, to], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const GrowingLeaf: React.FC<{
  path: string;
  anchorX: number;
  anchorY: number;
  from: number;
  to: number;
  frame: number;
}> = ({path, anchorX, anchorY, from, to, frame}) => {
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

const TransparentLogoAnimation: React.FC = () => {
  const frame = useCurrentFrame();

  const lowerSerifPaint = progress(frame, 14, 22);
  const leftStemPaint = progress(frame, 20, 36);
  const upperSerifPaint = progress(frame, 35, 43);
  const diagonalPaint = progress(frame, 42, 61);
  const trunkPaint = progress(frame, 59, 71);
  const rightBranchPaint = progress(frame, 65, 73);
  const leftBranchPaint = progress(frame, 68, 75);
  const symbolVisibility = progress(frame, 13, 14, Easing.linear);

  const finalWhip = progress(frame, 76, 88, Easing.bezier(0.55, 0.04, 0.14, 1));
  const finalWhipOpacity = interpolate(frame, [76, 80, 88, 94], [0, 0.34, 0.24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exactCrossfade = progress(frame, 146, 154, easeGrow);
  const cameraScale = interpolate(frame, [0, 112, 120, 142], [1.92, 1.92, 1.72, 1], {
    easing: Easing.bezier(0.42, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cameraTranslateY = interpolate(frame, [0, 112, 120, 142], [130, 130, 110, 0], {
    easing: Easing.bezier(0.42, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nuviaReveal = progress(frame, 115, 137, easeGrow);
  const academyReveal = progress(frame, 132, 146, easeGrow);
  const nuviaFront = nuviaReveal * 110 - 5;
  const academyFront = academyReveal * 110 - 5;
  const nuviaLayerOpacity = nuviaReveal === 0 ? 0 : 1 - exactCrossfade;
  const academyLayerOpacity = academyReveal === 0 ? 0 : 1 - exactCrossfade;

  return (
    <div
      style={{
        position: "absolute",
        left: 566.25,
        top: 116.25,
        width: 787.5,
        height: 787.5,
        translate: `0 ${cameraTranslateY}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: 787.5,
          height: 787.5,
          scale: cameraScale,
          transformOrigin: "50% 44%",
        }}
      >
        <svg
          viewBox="0 0 750 750"
          style={{
            position: "absolute",
            inset: 0,
            width: 787.5,
            height: 787.5,
            opacity: symbolVisibility,
          }}
        >
          <defs>
            <clipPath id="transparent-exact-n">
              <path d={exactNPath} />
            </clipPath>
            <filter id="transparent-soft-edge" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.008 0.055"
                numOctaves="2"
                seed="17"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="4.5"
                xChannelSelector="R"
                yChannelSelector="B"
              />
              <feGaussianBlur stdDeviation="0.22" />
            </filter>
            <mask
              id="transparent-painted-n"
              maskUnits="userSpaceOnUse"
              x="120"
              y="80"
              width="540"
              height="470"
            >
              <rect x="120" y="80" width="540" height="470" fill="black" />
              <path
                d="M 174 507 C 210 507 252 507 304 507"
                fill="none"
                stroke="white"
                strokeWidth="58"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - lowerSerifPaint}
                opacity={lowerSerifPaint === 0 ? 0 : 1}
                filter="url(#transparent-soft-edge)"
              />
              <path
                d="M 238 500 C 236 432 238 262 238 178"
                fill="none"
                stroke="white"
                strokeWidth="82"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - leftStemPaint}
                opacity={leftStemPaint === 0 ? 0 : 1}
                filter="url(#transparent-soft-edge)"
              />
              <path
                d="M 166 153 C 202 151 240 151 278 153"
                fill="none"
                stroke="white"
                strokeWidth="98"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - upperSerifPaint}
                opacity={upperSerifPaint === 0 ? 0 : 1}
                filter="url(#transparent-soft-edge)"
              />
              <path
                d="M 278 158 L 518 507"
                fill="none"
                stroke="white"
                strokeWidth="142"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - diagonalPaint}
                opacity={diagonalPaint === 0 ? 0 : 1}
                filter="url(#transparent-soft-edge)"
              />
              <path
                d="M 518 507 C 518 438 517 369 518 340 C 518 296 521 251 524 217"
                fill="none"
                stroke="white"
                strokeWidth="76"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - trunkPaint}
                opacity={trunkPaint === 0 ? 0 : 1}
                filter="url(#transparent-soft-edge)"
              />
              <path
                d="M 517 369 C 531 341 548 326 570 320"
                fill="none"
                stroke="white"
                strokeWidth="72"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - rightBranchPaint}
                opacity={rightBranchPaint === 0 ? 0 : 1}
              />
              <path
                d="M 506 310 C 502 292 497 281 488 274"
                fill="none"
                stroke="white"
                strokeWidth="62"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - leftBranchPaint}
                opacity={leftBranchPaint === 0 ? 0 : 1}
              />
            </mask>
          </defs>

          <g
            clipPath="url(#transparent-exact-n)"
            mask="url(#transparent-painted-n)"
            opacity={1 - exactCrossfade}
          >
            <path d={exactNPath} fill={NAVY} />
            <g
              fill="none"
              strokeLinecap="round"
              opacity={interpolate(frame, [14, 72, 94], [0.24, 0.2, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            >
              <path d="M 225 505 C 230 426 226 271 233 174" stroke="#567096" strokeWidth="5" />
              <path d="M 244 500 C 247 420 241 273 246 179" stroke="#071a35" strokeWidth="4" />
              <path d="M 276 169 L 512 501" stroke="#46678e" strokeWidth="6" />
              <path d="M 288 169 L 521 488" stroke="#071a35" strokeWidth="5" />
              <path d="M 265 183 L 500 505" stroke="#7890ae" strokeWidth="3" />
            </g>
          </g>

          <g clipPath="url(#transparent-exact-n)" opacity={finalWhipOpacity}>
            <path
              d="M 270 164 L 518 507"
              fill="none"
              stroke="#06172f"
              strokeWidth="76"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - finalWhip}
            />
          </g>

          <g opacity={1 - exactCrossfade}>
            <GrowingLeaf path={topLeaf} anchorX={526} anchorY={206} from={98} to={106} frame={frame} />
            <GrowingLeaf path={leftLeaf} anchorX={494} anchorY={255} from={100} to={108} frame={frame} />
            <GrowingLeaf path={rightLeaf} anchorX={542} anchorY={299} from={102} to={110} frame={frame} />
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            width: 787.5,
            height: 787.5,
            opacity: nuviaLayerOpacity,
            translate: `0 ${interpolate(nuviaReveal, [0, 1], [10, 0])}px`,
            maskImage: `linear-gradient(to right, #000 0%, #000 ${nuviaFront - 4}%, rgba(0,0,0,.45) ${nuviaFront}%, transparent ${nuviaFront + 5}%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to right, #000 0%, #000 ${nuviaFront - 4}%, rgba(0,0,0,.45) ${nuviaFront}%, transparent ${nuviaFront + 5}%, transparent 100%)`,
          }}
        >
          <CanvasImage
            src={staticFile("logo-wordmark.png")}
            style={{position: "absolute", inset: 0, width: 787.5, height: 787.5}}
          />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            width: 787.5,
            height: 787.5,
            opacity: academyLayerOpacity,
            translate: `0 ${interpolate(academyReveal, [0, 1], [7, 0])}px`,
            maskImage: `linear-gradient(to right, #000 0%, #000 ${academyFront - 4}%, rgba(0,0,0,.45) ${academyFront}%, transparent ${academyFront + 5}%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to right, #000 0%, #000 ${academyFront - 4}%, rgba(0,0,0,.45) ${academyFront}%, transparent ${academyFront + 5}%, transparent 100%)`,
          }}
        >
          <CanvasImage
            src={staticFile("logo-tagline.png")}
            style={{position: "absolute", inset: 0, width: 787.5, height: 787.5}}
          />
        </div>

        <CanvasImage
          src={staticFile("logo.svg")}
          style={{
            position: "absolute",
            inset: 0,
            width: 787.5,
            height: 787.5,
            opacity: exactCrossfade,
          }}
        />
      </div>
    </div>
  );
};

export const NuviaAcademyClosingTransparent: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "transparent", overflow: "hidden"}}>
      <Audio src={staticFile("reference-improved.mp4")} volume={1} />
      <TransparentLogoAnimation />
    </AbsoluteFill>
  );
};

export const TransparentComposition: React.FC = () => (
  <Composition
    id="NUVIA-Academy-Cierre-Transparent"
    component={NuviaAcademyClosingTransparent}
    durationInFrames={240}
    fps={24}
    width={1920}
    height={1080}
  />
);
