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

// These paths are copied verbatim from B-NUVIA-Academy-academy-oro.svg.
// Every animated pixel is clipped to them, so the animation never substitutes
// or redraws the final logo geometry.
const exactNPath =
  "M 166.046875 144.886719 L 277.230469 144.886719 L 496.179688 399.753906 C 497.460938 368.535218 498.746094 335.609375 499.601562 306.101562 C 500.027344 290.707031 497.460938 280.445312 487.625 274.457031 C 486.34375 273.601562 486.769531 271.464844 488.480469 271.890625 C 494.894531 275.3125 500.457031 281.726562 503.875 288.140625 L 521.835938 217.15625 C 522.265625 215.015625 524.832031 215.445312 524.832031 217.582031 C 520.980469 253.929688 517.988281 301.824219 518.414062 348.867188 C 532.527344 333.042969 549.207031 322.78125 568.019531 318.929688 C 570.585938 318.503906 571.441406 320.640625 568.875 321.925781 C 541.082031 335.609375 522.691406 357.417969 522.691406 386.070312 L 522.691406 516.496094 L 513.710938 516.496094 L 252.429688 212.023438 L 252.429688 433.535156 C 252.429688 484.851562 258.84375 499.390625 308.019531 501.101562 L 308.019531 512.648438 L 168.183594 512.648438 L 168.183594 501.101562 C 215.652344 500.246094 225.058594 485.28125 225.058594 433.535156 L 225.058594 214.589844 C 225.058594 177.8125 212.230469 162.84375 166.046875 160.28125 Z M 166.046875 144.886719";

const topLeaf =
  "M 526.539062 206.464844 C 510.71875 197.484375 502.59375 185.082031 503.875 167.121094 C 505.160156 137.617188 522.691406 108.964844 553.480469 88.4375 C 565.882812 113.242188 572.726562 137.617188 569.730469 160.707031 C 566.308594 184.65625 552.199219 200.050781 526.539062 206.464844 Z M 526.539062 206.464844";

const leftLeaf =
  "M 493.613281 255.214844 C 476.082031 259.0625 459.402344 253.929688 447 241.53125 C 432.035156 226.5625 424.335938 204.324219 423.480469 179.09375 C 447 180.804688 467.101562 188.074219 480.785156 202.1875 C 494.894531 216.300781 500.027344 236.398438 493.613281 255.214844 Z M 493.613281 255.214844";

const rightLeaf =
  "M 541.933594 298.832031 C 538.085938 285.148438 540.652344 269.753906 548.777344 258.207031 C 562.460938 238.535156 587.691406 233.40625 622.332031 238.535156 C 617.625 263.765625 606.507812 284.292969 590.257812 295.410156 C 576.574219 304.820312 558.183594 306.957031 541.933594 298.832031 Z M 541.933594 298.832031";

const paintEase = Easing.bezier(0.42, 0.03, 0.23, 1);
const growEase = Easing.bezier(0.16, 1, 0.3, 1);
const textEase = Easing.inOut(Easing.cubic);

const progress = (
  frame: number,
  from: number,
  to: number,
  easing = paintEase,
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
  const amount = progress(frame, from, to, growEase);

  return (
    <path
      d={path}
      fill={GOLD}
      opacity={amount}
      transform={`translate(${anchorX} ${anchorY}) scale(${amount}) translate(${-anchorX} ${-anchorY})`}
    />
  );
};

const ExactWordmarkLetter: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  from: number;
  to: number;
  frame: number;
}> = ({left, top, width, height, from, to, frame}) => {
  const amount = progress(frame, from, to, textEase);
  const maskFront = amount * 125 - 15;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        overflow: "hidden",
        opacity: progress(frame, from, from + 10, textEase),
        maskImage: `linear-gradient(145deg, #000 0%, #000 ${maskFront - 6}%, rgba(0,0,0,.5) ${maskFront}%, transparent ${maskFront + 8}%, transparent 100%)`,
        WebkitMaskImage: `linear-gradient(145deg, #000 0%, #000 ${maskFront - 6}%, rgba(0,0,0,.5) ${maskFront}%, transparent ${maskFront + 8}%, transparent 100%)`,
      }}
    >
      <CanvasImage
        src={staticFile("logo.svg")}
        style={{
          position: "absolute",
          left: -left,
          top: -top,
          width: 750,
          height: 750,
        }}
      />
    </div>
  );
};

const ExactLogoPaint: React.FC = () => {
  const frame = useCurrentFrame();

  const lowerSerifLeft = progress(frame, 11, 18);
  const lowerSerifRight = progress(frame, 11, 20);
  const leftStem = progress(frame, 18, 38);
  const upperSerif = progress(frame, 36, 48);
  const diagonal = progress(frame, 44, 70);
  const trunk = progress(frame, 68, 83);
  const rightBranch = progress(frame, 79, 88, growEase);
  const leftBranch = progress(frame, 80, 88, growEase);
  const exactCompletion = progress(frame, 86, 90, Easing.linear);

  const cameraScale = interpolate(
    frame,
    [0, 108, 140],
    [1.38, 1.38, 1],
    {
      easing: Easing.bezier(0.42, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const cameraTranslateY = interpolate(
    frame,
    [0, 108, 140],
    [80, 80, 0],
    {
      easing: Easing.bezier(0.42, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const taglineReveal = progress(frame, 168, 198, textEase);

  return (
    <div
      style={{
        position: "absolute",
        left: 585,
        top: 120,
        width: 750,
        height: 750,
        translate: `0 ${cameraTranslateY}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: 750,
          height: 750,
          scale: cameraScale,
          transformOrigin: "50% 46%",
        }}
      >
        <svg
          aria-label="Símbolo NUVIA Academy animado con geometría vectorial exacta"
          viewBox="0 0 750 750"
          style={{
            position: "absolute",
            inset: 0,
            width: 750,
            height: 750,
          }}
        >
          <defs>
            <clipPath id="exact-nuvia-n-clip">
              <path d={exactNPath} />
            </clipPath>
            <filter
              id="invisible-bristle-edge"
              x="-12%"
              y="-12%"
              width="124%"
              height="124%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.006 0.045"
                numOctaves="2"
                seed="23"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="2.2"
                xChannelSelector="R"
                yChannelSelector="B"
              />
              <feGaussianBlur stdDeviation="0.12" />
            </filter>
            <mask
              id="exact-nuvia-n-paint"
              maskUnits="userSpaceOnUse"
              x="130"
              y="70"
              width="520"
              height="480"
            >
              <rect x="130" y="70" width="520" height="480" fill="black" />

              <path
                d="M 238 507 L 166 507"
                fill="none"
                stroke="white"
                strokeWidth="34"
                strokeLinecap="round"
                strokeDasharray={`${72 * lowerSerifLeft} 72`}
                opacity={lowerSerifLeft === 0 ? 0 : 1}
              />
              <path
                d="M 238 507 L 308 507"
                fill="none"
                stroke="white"
                strokeWidth="34"
                strokeLinecap="round"
                strokeDasharray={`${70 * lowerSerifRight} 70`}
                opacity={lowerSerifRight === 0 ? 0 : 1}
              />
              <path
                d="M 238 501 C 238 420 238 260 238 176"
                fill="none"
                stroke="white"
                strokeWidth="58"
                strokeLinecap="round"
                strokeDasharray={`${325 * leftStem} 325`}
                opacity={leftStem === 0 ? 0 : 1}
              />
              <path
                d="M 238 178 C 224 164 198 155 166 153 C 202 151 242 151 278 153"
                fill="none"
                stroke="white"
                strokeWidth="62"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${190 * upperSerif} 190`}
                opacity={upperSerif === 0 ? 0 : 1}
              />
              <path
                d="M 274 158 L 518.5 513"
                fill="none"
                stroke="white"
                strokeWidth="112"
                strokeLinecap="round"
                strokeDasharray={`${431 * diagonal} 431`}
                opacity={diagonal === 0 ? 0 : 1}
              />
              <path
                d="M 518 513 C 518 438 517 372 518 340 C 518 296 521 251 524 216"
                fill="none"
                stroke="white"
                strokeWidth="54"
                strokeLinecap="round"
                strokeDasharray={`${297 * trunk} 297`}
                opacity={trunk === 0 ? 0 : 1}
              />
              <path
                d="M 517 371 C 531 342 548 327 570 320"
                fill="none"
                stroke="white"
                strokeWidth="44"
                strokeLinecap="round"
                strokeDasharray={`${67 * rightBranch} 67`}
                opacity={rightBranch === 0 ? 0 : 1}
              />
              <path
                d="M 506 310 C 502 293 497 281 488 274"
                fill="none"
                stroke="white"
                strokeWidth="38"
                strokeLinecap="round"
                strokeDasharray={`${43 * leftBranch} 43`}
                opacity={leftBranch === 0 ? 0 : 1}
              />

              <path d={exactNPath} fill="white" opacity={exactCompletion} />
            </mask>
          </defs>

          <g clipPath="url(#exact-nuvia-n-clip)">
            <g
              fill="none"
              stroke={NAVY}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 238 507 L 166 507"
                strokeWidth="34"
                strokeDasharray={`${72 * lowerSerifLeft} 72`}
                opacity={lowerSerifLeft === 0 ? 0 : 1}
              />
              <path
                d="M 238 507 L 308 507"
                strokeWidth="34"
                strokeDasharray={`${70 * lowerSerifRight} 70`}
                opacity={lowerSerifRight === 0 ? 0 : 1}
              />
              <path
                d="M 238 501 C 238 420 238 260 238 176"
                strokeWidth="58"
                strokeDasharray={`${325 * leftStem} 325`}
                opacity={leftStem === 0 ? 0 : 1}
              />
              <path
                d="M 238 178 C 224 164 198 155 166 153 C 202 151 242 151 278 153"
                strokeWidth="62"
                strokeDasharray={`${190 * upperSerif} 190`}
                opacity={upperSerif === 0 ? 0 : 1}
              />
              <path
                d="M 274 158 L 518.5 513"
                strokeWidth="112"
                strokeDasharray={`${431 * diagonal} 431`}
                opacity={diagonal === 0 ? 0 : 1}
              />
              <path
                d="M 518 513 C 518 438 517 372 518 340 C 518 296 521 251 524 216"
                strokeWidth="54"
                strokeDasharray={`${297 * trunk} 297`}
                opacity={trunk === 0 ? 0 : 1}
              />
              <path
                d="M 517 371 C 531 342 548 327 570 320"
                strokeWidth="44"
                strokeDasharray={`${67 * rightBranch} 67`}
                opacity={rightBranch === 0 ? 0 : 1}
              />
              <path
                d="M 506 310 C 502 293 497 281 488 274"
                strokeWidth="38"
                strokeDasharray={`${43 * leftBranch} 43`}
                opacity={leftBranch === 0 ? 0 : 1}
              />
            </g>

            <path d={exactNPath} fill={NAVY} opacity={exactCompletion} />
            <g
              fill="none"
              strokeLinecap="round"
              opacity={interpolate(
                frame,
                [18, 88, 104],
                [0.22, 0.18, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )}
            >
              <path
                d="M 228 500 C 230 420 227 270 233 176"
                stroke="#5d7598"
                strokeWidth="4"
                strokeDasharray={`${325 * leftStem} 325`}
                opacity={leftStem === 0 ? 0 : 1}
              />
              <path
                d="M 246 498 C 247 420 244 272 247 180"
                stroke="#071a35"
                strokeWidth="3"
                strokeDasharray={`${322 * leftStem} 322`}
                opacity={leftStem === 0 ? 0 : 1}
              />
              <path
                d="M 266 174 L 505 508"
                stroke="#6f88a9"
                strokeWidth="4"
                strokeDasharray={`${411 * diagonal} 411`}
                opacity={diagonal === 0 ? 0 : 1}
              />
              <path
                d="M 282 163 L 519 495"
                stroke="#071a35"
                strokeWidth="4"
                strokeDasharray={`${408 * diagonal} 408`}
                opacity={diagonal === 0 ? 0 : 1}
              />
            </g>
          </g>

          <GrowingLeaf
            path={leftLeaf}
            anchorX={494}
            anchorY={255}
            from={92}
            to={101}
            frame={frame}
          />
          <GrowingLeaf
            path={topLeaf}
            anchorX={526}
            anchorY={206}
            from={95}
            to={104}
            frame={frame}
          />
          <GrowingLeaf
            path={rightLeaf}
            anchorX={542}
            anchorY={299}
            from={98}
            to={107}
            frame={frame}
          />
        </svg>

        <ExactWordmarkLetter
          left={92}
          top={544}
          width={116}
          height={102}
          from={116}
          to={142}
          frame={frame}
        />
        <ExactWordmarkLetter
          left={228}
          top={544}
          width={110}
          height={102}
          from={124}
          to={150}
          frame={frame}
        />
        <ExactWordmarkLetter
          left={350}
          top={544}
          width={109}
          height={102}
          from={132}
          to={158}
          frame={frame}
        />
        <ExactWordmarkLetter
          left={477}
          top={544}
          width={51}
          height={102}
          from={140}
          to={166}
          frame={frame}
        />
        <ExactWordmarkLetter
          left={546}
          top={544}
          width={110}
          height={102}
          from={148}
          to={174}
          frame={frame}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            width: 750,
            height: 750,
            clipPath: "inset(88.5% 0 2.5% 0)",
            opacity: taglineReveal,
            translate: `0 ${interpolate(taglineReveal, [0, 1], [2, 0])}px`,
            scale: 1.05,
            transformOrigin: "50% 92.5%",
          }}
        >
          <CanvasImage
            src={staticFile("logo.svg")}
            style={{
              position: "absolute",
              inset: 0,
              width: 750,
              height: 750,
              filter:
                "drop-shadow(0.65px 0 0 #b58a46) drop-shadow(-0.65px 0 0 #b58a46)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const NuviaAcademyExactTransparent: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("reference-improved.mp4")} volume={1} />
      <ExactLogoPaint />
    </AbsoluteFill>
  );
};

export const ExactTransparentComposition: React.FC = () => (
  <Composition
    id="NUVIA-Academy-Cierre-Exact-Transparent"
    component={NuviaAcademyExactTransparent}
    durationInFrames={240}
    fps={24}
    width={1920}
    height={1080}
  />
);
