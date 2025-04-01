import { Color3, FreeCamera, GroundMesh, HemisphericLight, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import BaseGameRender from "./BaseGameRender";
import HealthBar from "../utils/HealthBar";

export class GameRender extends BaseGameRender {

    private _light?: HemisphericLight;
    private _ground?: GroundMesh;

    constructor(id: string) {
        super(id);
        this.createMainScene();
        this.createCharacterMesh();
    }

    public createMainScene() {
        var camera = new FreeCamera('camera1', new Vector3(0, 5, -10), this._scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this._canvas, false);
        this._light = new HemisphericLight('light1', new Vector3(0, 1, 0), this._scene);
        this._ground = MeshBuilder.CreateGround('ground1', { height: 6, width: 6 }, this._scene);
    }

    public createCharacterMesh() {
        const characterMesh = MeshBuilder.CreateCapsule("character", {height: 1.8, radius: 0.45 });
        const characterMaterial = new StandardMaterial("character");
        characterMaterial.diffuseColor = new Color3(1, 0.56, 0.56);
        characterMesh.material = characterMaterial;
        characterMesh.position.set(0,1,0);

        //Healthbar
        new HealthBar(characterMesh, "Player", {}, this._scene!);
    }
    
    public render() {
        this._engine?.runRenderLoop(()=>{
            this._scene?.render();
        });
    }

}