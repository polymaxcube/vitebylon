import { ItemId } from "@/constants/ItemId";
import { IGameObject } from "@/types/IGameObject";
import { AbstractMesh, Color3, ImportMeshAsync, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Scene, StandardMaterial } from "@babylonjs/core";

type Position = {
    x: number;
    y: number;
    z: number;
};

export class Mango implements IGameObject {
    private _mesh!: Mesh | AbstractMesh;
    private _scene!: Scene;
    private _position!: Position | undefined;
    private _id: string;

    constructor(id: string, positions: Position) {
        this._id = id;
        this._position = positions;
    }

    public async start(scene: Scene) {

        this._scene = scene;

        // this._mesh = MeshBuilder.CreateBox(`cube-${this._id}`, { size: 2 }, scene);
        // this._mesh.position.x = this._position?.x || 0;
        // this._mesh.position.y = this._position?.y || 0;
        // this._mesh.position.z = this._position?.z || 0;

        // const material = new StandardMaterial("mat", this._scene);
        // material.diffuseColor = new Color3(0.3, 0.6, 1);
        // this._mesh.material = material;

        await this.createModel(ItemId.Mango, false);

    }

    public async createModel(modelId: string, isMerge: boolean = true) {
        
        const result = await ImportMeshAsync(modelId, this._scene!);
        this._mesh = result.meshes[0];
        let childMeshes =  this._mesh.getChildMeshes();

        if (!childMeshes) {
            console.error("No mesh found in GLB.");
            return;
        }

        if (childMeshes.length === 0) {
        console.warn("No child meshes found.");
        return;
        }

        this._mesh.scaling.scaleInPlace(50);
        this._mesh.position.x = this._position?.x || 0;
        this._mesh.position.y = this._position?.y || 0;
        this._mesh.position.z = this._position?.z || 0;

        this._mesh.showBoundingBox = true;
        this._mesh.showSubMeshesBoundingBox = true;

        //Apply Physics
        if (this._scene?.isPhysicsEnabled()) {
            this.applyPhysicsSmart(this._mesh);
        } else {
            console.warn("Physics is not enabled on the scene.");
        }
    }

    public update(deltaTime: number) {
        return;
        // this._mesh.rotation.y += deltaTime * 1.0;
        // this._mesh.rotation.x += deltaTime * 0.5;
    }

    private applyPhysicsSmart(mesh: AbstractMesh) {
        const childMeshes = mesh.getChildMeshes().filter(
            (m): m is Mesh => m instanceof Mesh
        );

        console.log(`childMeshes: ${childMeshes.length}`)
        if (childMeshes.length === 1) {
            // Just apply physics directly to that one mesh
            const singleMesh = childMeshes[0];
            console.log("Applying physics to single mesh:", singleMesh.name);
            new PhysicsAggregate(singleMesh, PhysicsShapeType.MESH, { mass: 1 }, this._scene);
        } else if (childMeshes.length > 1) {
            // Merge and apply physics
            const merged = Mesh.MergeMeshes(childMeshes, true, true, undefined, false, true);
            if (merged) {
                // merged.position = mesh.position.clone();
                merged.isVisible = true;
                merged.setEnabled(true);
                new PhysicsAggregate(merged, PhysicsShapeType.MESH, { mass: 1 }, this._scene);
                console.log("Applied physics to merged mesh.");
            } else {
                console.warn("Mesh merging failed.");
            }
        } else {
            console.warn("No valid mesh to apply physics.");
        }
    }

    public dispose() {
        this._mesh.dispose();
    }
}
