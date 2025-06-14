import { IGameObject } from "@/types/IGameObject";
import { Color3, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Scene, StandardMaterial } from "@babylonjs/core";

type Position = {
    x: number;
    y: number;
    z: number;
};

export class CubeTest implements IGameObject {
  private _mesh!: Mesh;
  private _scene!: Scene;
  private _position!: Position | undefined;
  private _id: string;

  constructor(id: string, positions: Position) {
    this._id = id;
    this._position = positions;
  }

  public async start(scene: Scene) {

    this._scene = scene;

    this._mesh = MeshBuilder.CreateBox(`cube-${this._id}-test`, { size: 2 }, scene);
    this._mesh.position.x = this._position?.x || 0;
    this._mesh.position.y = this._position?.y || 0;
    this._mesh.position.z = this._position?.z || 0;

    const material = new StandardMaterial("mat", this._scene);
    material.diffuseColor = new Color3(0.3, 0.6, 1);
    this._mesh.material = material;

    new PhysicsAggregate(this._mesh, PhysicsShapeType.BOX, { mass: 1 }, this._scene);


  }



    public get mesh(): Mesh | undefined {
        return this._mesh;
    }

    public update(deltaTime: number) {
        this._mesh.rotation.y += deltaTime * 1.0;
        this._mesh.rotation.x += deltaTime * 0.5;
        
    }

    public dispose() {
        this._mesh.dispose();
    }
  
}
