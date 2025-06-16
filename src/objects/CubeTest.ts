import { IGameObject } from "@/types/IGameObject";
import { Color3, Mesh, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

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
  private _physicsAggregate!: PhysicsAggregate;

  constructor(id: string, positions: Position) {
    this._id = id;
    this._position = positions;
  }

  public async start(scene: Scene) {

    this._scene = scene;

    this._mesh = MeshBuilder.CreateBox(`cubetest-${this._id}`, { size: 2 }, scene);
    this._mesh.position.x = this._position?.x || 0;
    this._mesh.position.y = this._position?.y || 0;
    this._mesh.position.z = this._position?.z || 0;

    const material = new StandardMaterial("mat", this._scene);
    material.diffuseColor = new Color3(0.3, 0.6, 1);

    const diffuseTexture = new Texture("textures/crate.png", scene);

    material.diffuseTexture = diffuseTexture;
    this._mesh.material = material;


    //physics   
    this._physicsAggregate = new PhysicsAggregate(this._mesh, PhysicsShapeType.BOX, { mass: 1}, this._scene);

    // OPTIONAL: Adjust inertia for controlled rotation
    this._physicsAggregate.body.disablePreStep = false; // Ensure physics is active
    this._physicsAggregate.body.setMassProperties({
        inertia: new Vector3(5, 5, 5) // Makes rotation slower
    });

    // Make it float (ignore gravity)
    this._physicsAggregate.body.setGravityFactor(0); // <-- Key line!

  }

  public update(deltaTime: number) {

      if(!this._physicsAggregate) {

        this._mesh.rotation.y += deltaTime * 1.0;
        this._mesh.rotation.x += deltaTime * 0.5;

      } else {

        this._physicsAggregate.body.setLinearVelocity(new Vector3(0, 0, 1));

        // Ensure the physics body is active (not sleeping)
        this._physicsAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC); // Re-enables forces
        this._physicsAggregate.body.setAngularVelocity(new Vector3(2, 1.0, 0));
    }
    
  }

  public dispose() {
    this._mesh.dispose();
  }
}
