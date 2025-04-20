import { AxesViewer, Color3, FreeCamera, GroundMesh, HavokPlugin, HemisphericLight, KeyboardEventTypes, Mesh, MeshBuilder, PhysicsAggregate, PhysicsBody, PhysicsMotionType, PhysicsShapeType, PointerEventTypes, Quaternion, Scalar, ShapeCastResult, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
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

    private _time: number = 0;
    private _liftMesh?: any;
    private _characterAggregate: any;

    private _sphereHitWorld: Mesh | null = null;

    private _platformHook: PhysicsAggregate  | null = null;
    private _platformAggregate: PhysicsAggregate | null = null;

    private _prevPlatformX = 0;
    private _deltaX: number = 0;

    // private _platformHook

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
                console.log("initializePhysics: Physics engine enabled.");
                this.setPhysicsMesh();                
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
        // Camera and light
        this._camera = new FreeCamera("camera1", new Vector3(0, 5, -10), this._scene);
        this._camera.setTarget(Vector3.Zero());
        this._camera.attachControl(true);
        this._light = new HemisphericLight('light1', new Vector3(0, 1, 0), this._scene);
    
        // Ground
        const groundSize = 20;
        this._ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, this._scene);

    }

    private _shootBullet() {
        if (!this._characterMesh || !this._scene || !this._hkPlugin) return;
    
        // Create bullet mesh
        const bullet = MeshBuilder.CreateSphere("bullet", { diameter: 0.2 }, this._scene);
        bullet.position = this._characterMesh.position.clone().add(new Vector3(0, 0.25, 0));
    
        // Material
        const mat = new StandardMaterial("bulletMat", this._scene);
        mat.diffuseColor = new Color3(1, 1, 0); // yellow
        bullet.material = mat;
    
        // Physics body
        const bulletAggregate = new PhysicsAggregate(bullet, PhysicsShapeType.SPHERE, {
            mass: 0.2,
            restitution: 0.1,
            friction: 0.2
        }, this._scene);
    
        // Get forward direction
        const forward = this._characterMesh.forward;
    
        // Apply velocity
        bulletAggregate.body.setLinearVelocity(forward.scale(100));
    
        // 💥 Auto-dispose after 3 seconds
        setTimeout(() => {
            bulletAggregate.body.dispose(); // dispose physics
            bullet.dispose();               // dispose mesh
            mat.dispose();                  // dispose material
        }, 3000);
    }
    

    private createWallsPhysics(groundSize = 20) {
        // Wall settings
        const wallHeight = 2;
        const wallThickness = 0.5;
        const wallLength = groundSize;


        // debug red sphere that will be placed where the shape cast detects the casting collision point
        this._sphereHitWorld = MeshBuilder.CreateSphere("s", {diameter: 0.15});
        const sphereHitWorldMaterial = new StandardMaterial("sm");
        sphereHitWorldMaterial.diffuseColor = new Color3(1,0,0);
        this._sphereHitWorld.material = sphereHitWorldMaterial;

    
        // Back Wall (Z-)
        // const wallBack = MeshBuilder.CreateBox("wallBack", { width: wallLength, height: wallHeight, depth: wallThickness }, this._scene);
        // wallBack.position = new Vector3(0, wallHeight / 2, -groundSize / 2);
    
        // Front Wall (Z+)
        const wallFront = MeshBuilder.CreateBox("wallFront", { width: wallLength, height: wallHeight, depth: wallThickness }, this._scene);
        wallFront.position = new Vector3(0, wallHeight / 2, groundSize / 2);
    
        // Left Wall (X-)
        const wallLeft = MeshBuilder.CreateBox("wallLeft", { width: wallThickness, height: wallHeight, depth: wallLength }, this._scene);
        wallLeft.position = new Vector3(-groundSize / 2, 1, 0);

        const wallMat = new StandardMaterial("wallMat");
        const wallTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Platform_1mx1m.png");
        wallTexture.vScale = wallHeight / 2;
        wallTexture.uScale = wallHeight / 2;
        wallMat.diffuseTexture = wallTexture;
        wallLeft.checkCollisions = true;

        // Right Wall (X+)
        const wallRight = MeshBuilder.CreateBox("wallRight", { width: wallThickness, height: wallHeight, depth: wallLength }, this._scene);
        wallRight.position = new Vector3(groundSize / 2, wallHeight / 2, 0);

        wallLeft.material = wallMat;
        wallRight.material = wallMat;
        wallFront.material = wallMat;


        var wallBase = MeshBuilder.CreateBox("wall", {size: 2}, this._scene);
        wallBase.position.y = 1;
        wallBase.position.x = 3;
        var wallAggregate = new PhysicsAggregate(wallBase, PhysicsShapeType.BOX, { mass: 0, restitution:0.0}, this._scene);
        const wallMaterial = new StandardMaterial("wall");
        wallMaterial.diffuseTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Wall_1mx1m.png");
        wallBase.material = wallMaterial;

        // up/down lift
        this._liftMesh = MeshBuilder.CreateBox("lift", {width: 2, height:0.1, depth:2}, this._scene);
        var liftAggregate = new PhysicsAggregate(this._liftMesh, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
        const liftMaterial = new StandardMaterial("lift");
        liftMaterial.diffuseTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Platform_1mx1m.png");
        this._liftMesh.material = liftMaterial;
        liftAggregate.body.disablePreStep = false;
        liftAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        // wallBase.position.x = 3;
        this._liftMesh.position.x= 1;
        let time = 0;

        /**
        * set wall physics
        */
        new PhysicsAggregate(wallLeft, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
        new PhysicsAggregate(wallRight, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
        new PhysicsAggregate(wallFront, PhysicsShapeType.BOX, { mass: 0 }, this._scene);

        // left/right platform
        this._platformAggregate = new PhysicsAggregate(this._liftMesh.clone(), PhysicsShapeType.BOX, { mass: 0 }, this._scene);
        this._platformAggregate.body.disablePreStep = false;
        this._platformAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this._platformAggregate.transformNode.position.set(5,2,0);

        this._scene?.onBeforeAnimationsObservable.add( () => {
            if(!this._engine) return;
            if(!this._platformAggregate) return;

            const newPlatformx = (Math.sin(time * 0.8) + 6);
            // platformAggregate.deltax = newPlatformx - platformAggregate.transformNode.position.x;
            this._deltaX = newPlatformx - this._platformAggregate.transformNode.position.x;

            this._platformAggregate.transformNode.position.x = newPlatformx;
            console.log(`deltaX: ${this._deltaX}`)

            this._liftMesh.position.y = (Math.cos(time * 0.8) + 1) * 0.98;
            time += this._engine.getDeltaTime() * 0.001;

        });

 

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
        this._characterMesh.position.set(0,1.5,-5);

        //Healthbar
        new HealthBar( this._characterMesh, "Visitor", { isBoss: false, hp: 100 }, this._scene!);

        //Set Camera
        this._camera && this._camera.setTarget(this._characterMesh.position);

        //Axes
        this.activateAxes(this._characterMesh)

    }

    private setPhysicsMesh() {
        if(!this._characterMesh || !this._ground) return;
        this._characterAggregate = new PhysicsAggregate(this._characterMesh,
            PhysicsShapeType.CAPSULE,
            { mass: 1, friction: 0.5, restitution: 0 },
            this._scene);
        this._characterBody = this._characterAggregate.body;
        if(this._characterBody) {
            this._characterBody.disablePreStep = false;
            this._characterBody.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        }

        var groundAggregate = new PhysicsAggregate(this._ground, PhysicsShapeType.BOX, { mass: 0 }, this._scene);        
        const groundMaterial = new StandardMaterial("ground");
        const groundTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Ground_1mx1m.png");
        groundTexture.vScale = 5;
        groundTexture.uScale = 5;
        groundMaterial.diffuseTexture = groundTexture;
        this._ground.material = groundMaterial;

        this.createWallsPhysics();

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

        // Shoot bullet
        this._scene?.onPointerObservable.add(() => this._shootBullet(), PointerEventTypes.POINTERDOWN);


        this._engine && this._engine.onBeginFrameObservable.add(() => {

            if(this._guiText01) {
                this._guiText01.text = "\n";
                this._guiText01.text += "   FPS               : " +  this._engine?.getFps().toFixed(2) + "\n";
                this._guiText01.text += "   inputVelocity     : " +  this._inputVelocity + "\n";
                this._guiText01.text += "   dist              : " +  this._dist + "\n";
                this._guiText01.text += "   min dist          : " +  Math.min(this._dist - 10, 0) + "\n";
                this._guiText01.text += "   max dist          : " +  Math.max(this._dist - 6, 0) + "\n";
                this._guiText01.text += "   amount            : " +  (Math.min(this._dist-10, 0) + Math.max(this._dist-15, 0)) + "\n";
                this._guiText01.text += "   amount * 0.02     : " +  (Math.min(this._dist-10, 0) + Math.max(this._dist-15, 0)) * 0.02 + "\n";
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

            //falling
            if (this._platformHook) {
                console.log(`hit platform...`)
                // linearVelocity.x += 0.00999 * 16.66;
                linearVelocity.x += this._deltaX * 16.66;

            }
            
            if(this._inputVelocity.y > 0) {
                linearVelocity.y = this._inputVelocity.y;
            }else{
                linearVelocity.y = this._characterBody.getLinearVelocity().y;
            } 

            
            if(this._characterMesh) {
                // Casting the shape to the ground below. It works like a raycast but with thickness
                // this._camera.parent = this._characterMesh;
                const shapeLocalResult = new ShapeCastResult();
                const hitWorldResult = new ShapeCastResult();
                this._hkPlugin?.shapeCast({shape: this._characterAggregate.shape,
                    rotation: this._characterMesh.rotationQuaternion!,
                    startPosition: this._characterMesh?.position!,
                    endPosition: new Vector3(this._characterMesh?.position.x, this._characterMesh?.position.y-10, this._characterMesh.position.z),
                    shouldHitTriggers: false,
                }, shapeLocalResult, hitWorldResult);

                // Move sphere to hit position
                if(this._sphereHitWorld) {
                    this._sphereHitWorld.position = hitWorldResult.hitPoint;
                }

                // Check on platform *PhysicsAggregate 
                if(this._platformAggregate) {
                    this._platformHook = (hitWorldResult.body === this._platformAggregate.body) ? this._platformAggregate : null;
                }
            }

            linearVelocity.y = this._characterBody.getLinearVelocity().y;

            if (this._inputVelocity.x !== 0 || this._inputVelocity.z !== 0) {
                const moveDir = new Vector3(this._inputVelocity.x, 0, this._inputVelocity.z);
                const angle = Math.atan2(moveDir.x, moveDir.z); // target angle in radians
                // console.log(`x: ${moveDir.x}, y: ${moveDir.z}, angle: ${angle}`)
            
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
            this._amount = (Math.min(this._dist - 10, 0) + Math.max(this._dist - 15, 0)) * 0.02;

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