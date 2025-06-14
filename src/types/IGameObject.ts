import { Mesh, Scene } from "@babylonjs/core";

export interface IGameObject {
  start(scene: Scene): Promise<void>;
  // update?(scene: Scene, deltaTime: number): void;
  update?(deltaTime: number): void;
  dispose?(): void;
  mesh?: Mesh; // Optional: for Babylon-level access
  
}