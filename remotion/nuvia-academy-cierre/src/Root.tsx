import "./index.css";
import {AcademyHeroSelectedComposition} from "./AcademyHeroSelected";
import { MyComposition } from "./Composition";
import {ExactTransparentComposition} from "./ExactTransparentComposition";
import {TransparentComposition} from "./TransparentComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <AcademyHeroSelectedComposition />
      <MyComposition />
      <TransparentComposition />
      <ExactTransparentComposition />
    </>
  );
};
