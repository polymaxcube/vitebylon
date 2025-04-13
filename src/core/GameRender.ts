import { ActionManager, Color3, FreeCamera, GroundMesh, HemisphericLight, KeyboardEventTypes, Mesh, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import * as GUI from '@babylonjs/gui';
import BaseGameRender from "./BaseGameRender";

export class GameRender extends BaseGameRender {

    private _textBlock?: GUI.TextBlock;
    private _light?: HemisphericLight;
    private _ground?: GroundMesh;

    private _characterMesh: Mesh | null = null;

    constructor(id: string) {
        super(id);
        this.createMainScene();
        this.createCharacterMesh();
        this.setupControls();
        // this.textGui();
    }

    public createMainScene() {
        this._camera = new FreeCamera('camera1', new Vector3(0, 1, 0.7), this._scene);
        this._camera.attachControl(this._canvas, false);

        this._light = new HemisphericLight('light1', new Vector3(0, 1, 0), this._scene);
        this._ground = MeshBuilder.CreateGround('ground1', { height: 6, width: 6 }, this._scene);
        const groundMaterial = new StandardMaterial("groundMat", this._scene);
        groundMaterial.diffuseColor = new Color3(0, 0, 1); // RGB for blue

        this._ground.material = groundMaterial;

    }

    public createCharacterMesh() {
        if(!this._camera) return;

        this._characterMesh = MeshBuilder.CreateCapsule("character", {height: 1.8, radius: 0.45 });
        const characterMaterial = new StandardMaterial("character");
        characterMaterial.diffuseColor = new Color3(1, 0.56, 0.56);
        this._characterMesh.material = characterMaterial;
        this._characterMesh.position.set(0,1,0);

        this._camera.parent = this._characterMesh;
        this._camera.setTarget(this._characterMesh.position);
        this._camera.attachControl(this._canvas, false);

    }

    private setupControls() {
        const inputMap: { [key: string]: boolean } = {};

        if(!this._scene) return; 

        this._scene.actionManager = new ActionManager(this._scene);
    
        this._scene.onKeyboardObservable.add((kbInfo) => {
            const evt = kbInfo.event;
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                inputMap[evt.key.toLowerCase()] = true;
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
                inputMap[evt.key.toLowerCase()] = false;
            }
        });
    
        this._scene.onBeforeRenderObservable.add(() => {
            if (!this._characterMesh) return;
            const speed = 0.05;
    
            const forward = this._camera!.getForwardRay().direction;
            const right = this._camera!.getForwardRay().direction.cross(Vector3.Up()).normalize();
    
            if (inputMap["w"]) {
                this._characterMesh.position.addInPlace(forward.scale(speed));
            }
            if (inputMap["s"]) {
                this._characterMesh.position.addInPlace(forward.scale(-speed));
            }
            if (inputMap["a"]) {
                this._characterMesh.position.addInPlace(right.scale(speed));
            }
            if (inputMap["d"]) {
                this._characterMesh.position.addInPlace(right.scale(-speed));
            }
        });
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