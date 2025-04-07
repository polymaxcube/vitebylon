import { AxesViewer, Color3, FreeCamera, GroundMesh, HavokPlugin, HemisphericLight, KeyboardEventTypes, Mesh, MeshBuilder, PhysicsAggregate, PhysicsBody, PhysicsShapeType, Quaternion, Scalar, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import BaseGameRender from "./BaseGameRender";
import HealthBar from "../utils/HealthBar";
import HavokPhysics from "@babylonjs/havok";
import * as GUI from 'babylonjs-gui';

export class GameRender extends BaseGameRender {

    private _light?: HemisphericLight;
    private _ground?: GroundMesh;
    public _hkPlugin?: HavokPlugin;
    private _characterMesh?: Mesh;
    private _inputVelocity: Vector3 = new Vector3(0, 0, 0);

    private _characterBody?: PhysicsBody;
    private _camera?: FreeCamera;

    private _falling: boolean = false;
    private _guiText01?: GUI.TextBlock | undefined;

    private _dist: number = 0;
    private _amount: number = 0;

    constructor(id: string) {
        super(id);
        this.initializePhysics();
        this.createMainScene();
        this.createCharacterMesh();
        this.showGUI();
    }

    public async initializePhysics(): Promise<boolean> {
        if(!this._scene) {
             throw Error("Cannot find scene");
        }
        try {
            const havokInstance = await HavokPhysics();
            this._hkPlugin = new HavokPlugin(true, havokInstance);
            this._scene.enablePhysics(new Vector3(0, -9.81, 0), this._hkPlugin);
            console.log("Havok Physics initialized successfully.");

            if (this._scene.isPhysicsEnabled()) {
                this.setPhysicsMesh();                
                console.log("initializePhysics: Physics engine enabled.");
                this.setupCharacterControl();
                return true;
            } else {
                console.error("initializePhysics: Physics engine not enabled.");
                return false;
            }
        } catch (error) {
            console.error("Failed to load Havok Physics:", error);
            return false;
        }
    }

    public createMainScene() {
        this._camera = new FreeCamera("camera1", new Vector3(0, 5, -10), this._scene);
        this._light = new HemisphericLight('light1', new Vector3(0, 1, 0), this._scene);
        // Mandatory ground
        this._ground = MeshBuilder.CreateGround("ground", {width: 30, height: 30}, this._scene);
    }

    public activateAxes(character: Mesh) {
        const axes = new AxesViewer(this._scene, 0.5);
        axes.xAxis.position = new Vector3(0, 1, 0);
        axes.yAxis.position = new Vector3(0, 1, 0);
        axes.zAxis.position = new Vector3(0, 1, 0);

        axes.xAxis.parent = character;
        axes.yAxis.parent = character;
        axes.zAxis.parent = character;

        // Make sure the axes follow the character's rotation
        axes.xAxis.rotationQuaternion = null;
        axes.yAxis.rotationQuaternion = null;
        axes.zAxis.rotationQuaternion = null;

    }

    public createCharacterMesh() {
        this._characterMesh = MeshBuilder.CreateCapsule("character", {height: 1.8, radius: 0.45 });
        // this._characterMesh = MeshBuilder.CreateBox("character", {height: 1.8 });


        const characterMaterial = new StandardMaterial("character");
        characterMaterial.diffuseColor = new Color3(1, 0.56, 0.56);
        this._characterMesh.material = characterMaterial;
        this._characterMesh.position.set(0,1,0);

        //Healthbar
        new HealthBar( this._characterMesh, "Player", {}, this._scene!);

        //Set Camera
        this._camera && this._camera.setTarget(this._characterMesh.position);

        //Axes
        this.activateAxes(this._characterMesh)


    }

    private setPhysicsMesh() {
        if(!this._characterMesh || !this._ground) return;
        const characterAggregate = new PhysicsAggregate(this._characterMesh,
            PhysicsShapeType.CAPSULE,
            { mass: 1, friction: 0.5, restitution: 0 },
            this._scene);
        this._characterBody = characterAggregate.body;
        this._characterBody.disablePreStep = false;
        this._characterBody.setMassProperties({ inertia: Vector3.ZeroReadOnly });

        var groundAggregate = new PhysicsAggregate(this._ground, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
        
        const groundMaterial = new StandardMaterial("ground");
        const groundTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Ground_1mx1m.png");
        groundTexture.vScale = 5;
        groundTexture.uScale = 5;
        groundMaterial.diffuseTexture = groundTexture;
        this._ground.material = groundMaterial;
    }

    private respawnUnderThreshold() {
        if(this._characterMesh) {
            if(this._characterMesh.position.y < -1) {
                this._characterMesh.position.set(0,1,-3);
            }
        }
    }

    private showGUI() {
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._guiText01 = new GUI.TextBlock("guiTextBlock01", "");
        this._guiText01.color = "white";
        this._guiText01.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this._guiText01.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
        this._guiText01.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._guiText01.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._guiText01.fontFamily = "Courier New";
        this._guiText01.fontSize = "15pt"; 
        this._guiText01.text += "Sprinting         : \n";
        this._guiText01.text += "Jump              : \n";
        advancedTexture.addControl(this._guiText01); 

        this._engine && this._engine.onBeginFrameObservable.add(() => {

            if(this._guiText01) {
                this._guiText01.text = "\n";
                this._guiText01.text += "   inputVelocity     : " + this._inputVelocity + "\n";
                this._guiText01.text += "   dist              : " + this._dist + "\n";
                this._guiText01.text += "   min dist          : " + Math.min(this._dist - 10, 0) + "\n";
                this._guiText01.text += "   max dist          : " + Math.max(this._dist - 6, 0) + "\n";
                this._guiText01.text += "   amount            : " +   (Math.min(this._dist-10, 0) + Math.max(this._dist-15, 0)) + "\n";
                this._guiText01.text += "   amount * 0.02     : " + (Math.min(this._dist-10, 0) + Math.max(this._dist-15, 0)) * 0.02 + "\n";
            }
        });
    }

    private setupCharacterControl() {
        if(!this._scene) return;

        this._scene.onBeforeAnimationsObservable.add( ()=> {
            if(!this._camera || !this._characterMesh || !this._characterBody) return;

            this._amount = 0;
            this._dist = 0;

            // get camera world direction and right vectors. Character will move in camera space. 
            var cameraDirection = this._camera.getDirection(new Vector3(0,0,1));
            cameraDirection.y = 0;
            cameraDirection.normalize();

            var cameraRight = this._camera.getDirection(new Vector3(1,0,0));
            cameraRight.y = 0;
            cameraRight.normalize();

            // by default, character velocity is 0. It won't move if no input or not falling
            var linearVelocity = new Vector3(0,0,0);
            
            cameraDirection.scaleAndAddToRef(this._inputVelocity.z, linearVelocity); // z is forward
            cameraRight.scaleAndAddToRef(this._inputVelocity.x, linearVelocity);     // x is strafe

            // interpolate between current velocity and targeted velocity. This will make acceleration and decceleration more visible
            linearVelocity = Vector3.Lerp(this._characterBody.getLinearVelocity(), linearVelocity, 0.2);
            if(this._inputVelocity.y > 0) {
                linearVelocity.y = this._inputVelocity.y;
            }else{
                linearVelocity.y = this._characterBody.getLinearVelocity().y;
            } 

            if (this._inputVelocity.x !== 0 || this._inputVelocity.z !== 0) {
                const moveDir = new Vector3(this._inputVelocity.x, 0, this._inputVelocity.z);
                const angle = Math.atan2(moveDir.x, moveDir.z); // target angle in radians
                console.log(`x: ${moveDir.x}, y: ${moveDir.z}, angle: ${angle}`)
            
                // const currentRotation = this._characterBody.transformNode.rotationQuaternion?.toEulerAngles() ?? Vector3.Zero();
                const targetRotation =  Quaternion.RotationYawPitchRoll(angle, 0, 0);
            
                // Optional: slerp for smooth rotation
                const newRotation = Quaternion.Slerp(
                    this._characterBody.transformNode.rotationQuaternion ?? Quaternion.Identity(),
                    targetRotation,
                    0.2 // Smoothing factor
                );
            
                this._characterBody.transformNode.rotationQuaternion = newRotation;
            }

            // Apply computed linear velocity. Each frame is the same: get current velocity, transform it, apply it, ...
            this._characterBody.setLinearVelocity(linearVelocity);

            // Camera control: Interpolate the camera target with character position. compute an amount of distance to travel to be in an acceptable range.
            this._camera.setTarget(Vector3.Lerp(this._camera.getTarget(), this._characterMesh.position, 0.1));

            this._dist = Vector3.Distance(this._camera.position, this._characterMesh.position);
            this._amount = (Math.min(this._dist - 10, 0) + Math.max(this._dist - 7, 0)) * 0.02;

            cameraDirection.scaleAndAddToRef(this._amount, this._camera.position);
            this.respawnUnderThreshold();

        });


        this._scene.onKeyboardObservable.add((kbInfo) => {
            const multiplier = (kbInfo.type == KeyboardEventTypes.KEYDOWN) ? 2 : 0;
        
            switch (kbInfo.event.key.toLowerCase()) {
                // Arrow keys
                case 'arrowup':
                case 'w':
                    this._inputVelocity.z = multiplier; // ✅ Forward
                    break;
                case 'arrowdown':
                case 's':
                    this._inputVelocity.z = -multiplier; // ✅ Backward
                    break;
                case 'arrowleft':
                case 'a':
                    this._inputVelocity.x = -multiplier; // ✅ Left
                    break;
                case ' ':
                    this._inputVelocity.y = multiplier;
                    break;
                case 'arrowright':
                case 'd':
                    this._inputVelocity.x = multiplier; // ✅ Right
                    break;
            }
        });
    }


    public render() {
        this._engine?.runRenderLoop(()=>{
            this._scene?.render();
        });
    }

}