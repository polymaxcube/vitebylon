import { Color3, FreeCamera, GroundMesh, HemisphericLight, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import * as GUI from '@babylonjs/gui';
import BaseGameRender from "./BaseGameRender";

export class GameRender extends BaseGameRender {

    private _textBlock?: GUI.TextBlock;
    private _light?: HemisphericLight;
    private _ground?: GroundMesh;

    constructor(id: string) {
        super(id);
        this.createMainScene();
        this.createCharacterMesh();
        this.textGui();
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
    }

    private textGui() {
        if (!this._scene) {
            console.error("Scene is not initialized yet!");
            return;
        }

        // GUI
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true);
        var button1 = GUI.Button.CreateSimpleButton("but1", "Click Me");
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "white";
        button1.cornerRadius = 20;
        button1.background = "green";
        button1.onPointerUpObservable.add(function() {
            alert("you did it!");
        });
        advancedTexture.addControl(button1);          
    }
    
    public render() {
        this._engine?.runRenderLoop(()=>{
            this._scene?.render();
        });
    }

}