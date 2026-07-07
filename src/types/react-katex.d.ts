declare module "react-katex" {
  import { ComponentType } from "react";
  export const BlockMath: ComponentType<{ math: string }>;
  export const InlineMath: ComponentType<{ math: string }>;
}