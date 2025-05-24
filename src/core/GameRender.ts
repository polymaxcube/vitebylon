import { AxesViewer, Color3, FreeCamera, GroundMesh, HavokPlugin, HemisphericLight, ImportMeshAsync, KeyboardEventTypes, Mesh, MeshBuilder, Nullable, PhysicsAggregate, PhysicsBody, PhysicsCharacterController, PhysicsMotionType, PhysicsShapeType, PhysicsViewer, PointerEventTypes, Quaternion, StandardMaterial, Texture, TransformNode, Vector3 } from "@babylonjs/core";
import BaseGameRender from "./BaseGameRender";
import HealthBar from "../utils/HealthBar";
import HavokPhysics from "@babylonjs/havok";
import * as GUI from 'babylonjs-gui';
import "@babylonjs/loaders/glTF";
import GameGUI from "@/utils/GameGUI";

// import { GLTFFileLoader } from "@babylonjs/loaders/glTF";

export class GameRender extends BaseGameRender {

    private _light?: HemisphericLight;
    private _ground?: GroundMesh;
    public _hkPlugin?: HavokPlugin;

    private _characterMesh?: Mesh;
    private _mainCharacterMesh?: Mesh;

    public _inputVelocity: Vector3 = new Vector3(0, 0, 0);

    private _characterBody?: PhysicsBody;
    private _mainCharacterBody? : PhysicsBody;

    private _falling: boolean = false;
    private _guiText01?: GUI.TextBlock | undefined;

    public _dist: number = 0;
    private _amount: number = 0;

    private _isFPS = false;
    private _gunParentNode?: Nullable<TransformNode>;
    
    private _characterController?: PhysicsCharacterController;

    private _physicsViewer?: PhysicsViewer;

    private _h = 1.8;
    private _r = 0.6;

    // private _mainCharacter: Mesh | undefined = null;

    constructor(id: string) {
        super(id);
      this.createMainScene();
        this.createCharacterMesh();
        this.initializePhysics();
  
        // this.showGUI();
        new GameGUI(this._inputVelocity, this._engine!, this._scene!);


        // registerBuiltInLoaders();

        this._scene && this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (!this._engine?.isPointerLock) {
                    this._engine?.enterPointerlock();
                }
            }
        });
        
    }

    // private async loadMap() {
    //     if(!this._scene) return;
    //     await ImportMeshAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/CharController/levelTest.glb", this._scene).then(() => {
    //         var lightmapped = ["level_primitive0", "level_primitive1", "level_primitive2"];

    //     });
    // }

    //#region loadmodels here
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
    

                this.applyPhysicsMesh();    



                console.log("initializePhysics: Physics engine enabled.");
                this.setupCharacterControl();




                if(this._characterMesh) {
                    this._characterController = new PhysicsCharacterController(
                        this._characterMesh?.position, 
                        { capsuleHeight: this._h, capsuleRadius: this._r }, 
                        this._scene!);
                }

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
    //#endregion

    public createMainScene() {

        if(!this._isFPS) {
            this._camera = new FreeCamera("camera1", new Vector3(0, 5, -10), this._scene);
        }
        else {
            this._camera = new FreeCamera('camera1', new Vector3(0, 1, 0.2), this._scene);
            // this._camera.attachControl(this._canvas, true);
        }

        this._light = new HemisphericLight('light1', new Vector3(0, 1, 0), this._scene);
        // Mandatory ground
        this._ground = MeshBuilder.CreateGround("ground", {width: 30, height: 30}, this._scene);

        // this.loadGunModel();
        // this.loadCharacterModel();
                
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

    public lockPointer(): boolean {
        if (!this._engine) {
            console.error("Cannot lock pointer - engine not available");
            return false;
        }

        try {
            this._engine.enterPointerlock();
            
            if (!this._engine.isPointerLock) {
                this._engine.getRenderingCanvas()?.requestPointerLock();
            }
            
            return this._engine.isPointerLock;
        } catch (err) {
            console.error("Error locking pointer:", err);
            return false;
        }
    }

    public createCharacterMesh() {
        if(!this._camera) return;

        this._characterMesh = MeshBuilder.CreateCapsule("character", {height: this._h, radius: this._r });
        // this._characterMesh = MeshBuilder.CreateBox("character", {height: 1.8 });

        const characterMaterial = new StandardMaterial("character");
        characterMaterial.diffuseColor = new Color3(1, 0.56, 0.56);
        this._characterMesh.material = characterMaterial;
        this._characterMesh.position.set(0,1,0);


        //Healthbar
        new HealthBar( this._characterMesh, "Player", {}, this._scene!);

        //Set Camera
        // this._camera && this._camera.setTarget(this._characterMesh.position);

        if(!this._isFPS) {
            this._camera.setTarget(this._characterMesh.position);
        }else{
            this._camera.parent = this._characterMesh;
            this._camera.setTarget(this._characterMesh.position);
            this._camera.attachControl(this._canvas, true);
        }

        //Axes
        this.activateAxes(this._characterMesh)


    }

    private async applyPhysicsMesh() {
        if(!this._characterMesh || !this._ground || !this._scene) return;


        // this.loadGunModel();
        // await this.loadCharacterModel();

        
        // if (!bodyMesh || bodyMesh.getTotalVertices() === 0) {
        //     console.error("Character model has no vertices or failed to load. Skipping physics aggregate.");
        //     return;
        // }


        // this._mainCharacterMesh = bodyMesh;

        // if (!this.bodyMesh) {
        // console.error("Main character mesh is null/undefined");
        // return;
        // }

        const result = await ImportMeshAsync('character.glb', this._scene);
        const bodyMesh = result.meshes[0] as Mesh; // LP_body_primitive0 (Body)
        bodyMesh.scaling.scaleInPlace(2);
        bodyMesh.isPickable = true;
        // bodyMesh.position.y = 3;

        bodyMesh.getWorldMatrix();
        bodyMesh.rotationQuaternion = null; // Clear any existing quaternion
        bodyMesh.rotation = Vector3.Zero(); // Reset rotation

        bodyMesh.rotation = new Vector3(0, 2 * -Math.PI, 0); // Rotate 180 degrees around Y to face forward

        // const axes = new AxesViewer(this._scene, 1);
        // axes.xAxis.parent = body;
        // axes.yAxis.parent = body;
        // axes.zAxis.parent = body;
        // body.rotationQuaternion = Quaternion.RotationYawPitchRoll(Math.PI/2, Math.PI/4, 0);
        // body.computeWorldMatrix(true); 
        bodyMesh.position.z = this._characterMesh?.position.z! + 1;
        // body.rotation.x = Math.PI / 4;
        // this._mainCharacterMesh = bodyMesh;

        const mainCharacterAggregate = new PhysicsAggregate(
                bodyMesh,
                PhysicsShapeType.MESH,
                { mass: 1 },
                this._scene
        );

        // const mainCharacterBody = mainCharacterAggregate.body;
        // mainCharacterBody.disablePreStep = false;
        // mainCharacterBody.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        



        // if (this._mainCharacterMesh) {
        //     // Check if the mesh has valid geometry
        //     if (this._mainCharacterMesh.getTotalVertices() > 0) {
        //         try {
        //             const mainCharacterAggregate = new PhysicsAggregate(
        //                 this._mainCharacterMesh,
        //                 PhysicsShapeType.CONVEX_HULL,
        //                 { mass: 2, center: new Vector3(0, 0, 0) },
        //                 this._scene
        //             );
                    
        //             mainCharacterAggregate.body.disablePreStep = true;
        //             // mainCharacterAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        //         } catch (error) {
        //             console.error("Failed to create physics aggregate for character:", error);
        //             // Handle the error appropriately (maybe fallback to simpler physics shape)
        //         }
        //     } else {
        //         console.warn("Main character mesh has no vertices, skipping physics setup");
        //     }
        // } else {
        //     console.warn("Main character mesh is not defined");
        // }

        const characterAggregate = new PhysicsAggregate(this._characterMesh,
            PhysicsShapeType.CAPSULE,
            { mass: 1, friction: 0.5, restitution: 0 },
            this._scene);
        this._characterBody = characterAggregate.body;
        this._characterBody.disablePreStep = false;
        this._characterBody.setMassProperties({ inertia: Vector3.ZeroReadOnly });


        // Main character/NPC physics - only if mesh exists


        // this._mainCharacterBody.applyForce(new Vector3(0, 0, 10), new Vector3(0, 0, 10))

        // this._mainCharacterBody.disablePreStep = false;
        // this._mainCharacterBody.setMassProperties({ inertia: Vector3.Zero() });
        // this._mainCharacterBody.setMassProperties({ inertia: Vector3.ZeroReadOnly });

        new PhysicsAggregate(this._ground, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
        
        const groundMaterial = new StandardMaterial("ground");
        const groundTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Ground_1mx1m.png");
        groundTexture.vScale = 5;
        groundTexture.uScale = 5;
        groundMaterial.diffuseTexture = groundTexture;
        this._ground.material = groundMaterial;

        
        await this.applyPhysicsViewer();

    }

    public async applyPhysicsViewer() {
        if(!this._scene) return;
        this._physicsViewer = new PhysicsViewer(this._scene);
        for (const node of this._scene.rootNodes) {
            if (node instanceof Mesh && node.physicsBody) {
                const debugMesh = this._physicsViewer.showBody(node.physicsBody);
            }
        }
    }


    private respawnUnderThreshold() {
        if(this._characterMesh) {
            if(this._characterMesh.position.y < -1) {
                this._characterMesh.position.set(0,1,-3);
            }
        }
    }

    private async loadGunModel() {
        if(!this._scene) return;
        // SceneLoader.ImportMesh(
        //     "", 
        //     "https://dl.dropbox.com/s/kqnda4k2aqx8pro/", 
        //     "AKM.obj", 
        //     this._scene, 
        //     function (newMeshes) {
        //         var mat = new StandardMaterial("gunMaterial");
        //         mat.diffuseTexture = new Texture("https://dl.dropbox.com/s/isvd4dggvp3vks2/akm_diff.tga");
        //         mat.bumpTexture = new Texture("https://dl.dropbox.com/s/hiuhjsp4pckt9pu/akm_norm.tga");
        //         mat.specularTexture = new Texture("https://dl.dropbox.com/s/f3samm7vuvl0ez4/akm_spec.tga");
                
        //         for (var i = 0; i < newMeshes.length; i++) {
        //             var mesh = newMeshes[i];
        //             mesh.material = mat;
        //             mesh.scaling.set(0.05, 0.05, 0.05);
        //             mesh.isPickable = false;
        //             mesh.parent = parentNode;
        //         }
        //     }
        // );

        const result = await ImportMeshAsync('pistol.glb', this._scene);
        const body = result.meshes[0] as Mesh; // LP_body_primitive0 (Body)
        body.scaling.scaleInPlace(0.05);
        body.isPickable = false;

        // body.rotationQuaternion = null; // Clear any existing quaternion
        // body.rotation = Vector3.Zero(); // Reset rotation

        body.rotation = new Vector3(0, -Math.PI / 2, 0); // Rotate 180 degrees around Y to face forward

        // const axes = new AxesViewer(this._scene, 1);
        // axes.xAxis.parent = body;
        // axes.yAxis.parent = body;
        // axes.zAxis.parent = body;
        // body.rotationQuaternion = Quaternion.RotationYawPitchRoll(Math.PI/2, Math.PI/4, 0);
        // body.computeWorldMatrix(true); 
        body.position.z = this._characterMesh?.position.z! + 1;
        // body.rotation.x = Math.PI / 4;
        body.parent = this._characterMesh!;

    }

    private async loadCharacterModel() {
        if(!this._scene) return;
        // SceneLoader.ImportMesh(
        //     "", 
        //     "https://dl.dropbox.com/s/kqnda4k2aqx8pro/", 
        //     "AKM.obj", 
        //     this._scene, 
        //     function (newMeshes) {
        //         var mat = new StandardMaterial("gunMaterial");
        //         mat.diffuseTexture = new Texture("https://dl.dropbox.com/s/isvd4dggvp3vks2/akm_diff.tga");
        //         mat.bumpTexture = new Texture("https://dl.dropbox.com/s/hiuhjsp4pckt9pu/akm_norm.tga");
        //         mat.specularTexture = new Texture("https://dl.dropbox.com/s/f3samm7vuvl0ez4/akm_spec.tga");
                
        //         for (var i = 0; i < newMeshes.length; i++) {
        //             var mesh = newMeshes[i];
        //             mesh.material = mat;
        //             mesh.scaling.set(0.05, 0.05, 0.05);
        //             mesh.isPickable = false;
        //             mesh.parent = parentNode;
        //         }
        //     }
        // );

        const result = await ImportMeshAsync('character.glb', this._scene);
        const bodyMesh = result.meshes[0] as Mesh; // LP_body_primitive0 (Body)
        bodyMesh.scaling.scaleInPlace(2);
        bodyMesh.isPickable = false;
        // bodyMesh.position.y = 3;

        bodyMesh.getWorldMatrix();
        bodyMesh.rotationQuaternion = null; // Clear any existing quaternion
        bodyMesh.rotation = Vector3.Zero(); // Reset rotation

        bodyMesh.rotation = new Vector3(0, 2 * -Math.PI, 0); // Rotate 180 degrees around Y to face forward

        // const axes = new AxesViewer(this._scene, 1);
        // axes.xAxis.parent = body;
        // axes.yAxis.parent = body;
        // axes.zAxis.parent = body;
        // body.rotationQuaternion = Quaternion.RotationYawPitchRoll(Math.PI/2, Math.PI/4, 0);
        // body.computeWorldMatrix(true); 
        bodyMesh.position.z = this._characterMesh?.position.z! + 1;
        // body.rotation.x = Math.PI / 4;
        this._mainCharacterMesh = bodyMesh;


        // return bodyMesh;



        // bodyMesh.parent = this._characterMesh!;

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
            // this._mainCharacterBody.setLinearVelocity(linearVelocity);

            // this._mainCharacterBody.setLinearVelocity(linearVelocity);

            if(!this._isFPS) {
                // Camera control: Interpolate the camera target with character position. compute an amount of distance to travel to be in an acceptable range.
                this._camera.setTarget(Vector3.Lerp(this._camera.getTarget(), this._characterMesh.position, 0.1));

                this._dist = Vector3.Distance(this._camera.position, this._characterMesh.position);
                this._amount = (Math.min(this._dist - 10, 0) + Math.max(this._dist - 7, 0)) * 0.02;

                cameraDirection.scaleAndAddToRef(this._amount, this._camera.position);
            }

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
                    //  this._mainCharacterBody?.setLinearVelocity(this._inputVelocity);

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