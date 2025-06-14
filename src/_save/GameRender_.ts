// import { PATHS } from "@/utils/static_assets";
// import { AbstractMesh, AnimationGroup, AxesViewer, Color3, Color4, CreateAudioEngineAsync, CubeTexture, FreeCamera, GroundMesh, HemisphericLight, ImportMeshAsync, KeyboardEventTypes, Mesh, MeshBuilder, Observable, ParticleSystem, PhysicsAggregate, PhysicsBody, PhysicsMotionType, PhysicsShapeSphere, PhysicsShapeType, PhysicsViewer, PointerEventTypes, Quaternion, Scene, ShapeCastResult, StandardMaterial, StaticSound, Texture, TransformNode, Vector3 } from "@babylonjs/core";
// import "@babylonjs/loaders/glTF";
// import * as GUI from 'babylonjs-gui';
// import HealthBar from "../utils/HealthBar";
// import BaseGameRender from "./BaseGameRender";
// import { ItemId } from "@/constants/ItemId";
// import { IGameObject } from "@/types/IGameObject";
// import { RotatingCube } from "@/objects/RotatingCube";

// export class GameRender extends BaseGameRender {

//     private gameObjects: IGameObject[] = [];
//     private lastTime: number = 0;

//     /** Observable emits delta time each frame */
//     public onUpdate: Observable<number> = new Observable<number>();

//     private _light?: HemisphericLight;
//     private _ground?: GroundMesh;
//     // public _hkPlugin?: HavokPlugin;
//     private _characterMesh?: Mesh;
//     private _inputVelocity: Vector3 = new Vector3(0, 0, 0);

//     private _characterBody?: PhysicsBody;
//     private _camera?: FreeCamera;

//     private _falling: boolean = false;
//     private _guiText01?: GUI.TextBlock | undefined;

//     private _dist: number = 0;
//     private _amount: number = 0;

//     private _time: number = 0;
//     private _liftMesh?: any;
//     private _characterAggregate: any;

//     private _sphereHitWorld: Mesh | null = null;

//     private _platformHook: PhysicsAggregate  | null = null;
//     private _platformAggregate: PhysicsAggregate | null = null;

//     private _prevPlatformX = 0;
//     private _deltaX: number = 0;

//     private _healSoundEffect!: StaticSound;
//     private _healingPotionUsed = false; // Add this to your class

//     private _physicsViewer?: PhysicsViewer;

//     private _potionRespawnTime = 10000; // 1 นาที = 60000 ms
//     private _potionCollectedAt: number | null = null;

//     private _potionElapsedTime = 0;
    
//     private _animations: Record<string, AnimationGroup> = {};
//     private _currentAnim: string | null = null;

//     private _playRecord: Record<string, {}> = {}

//     public _playerHP: number = 50;
//     public _hpBar: HealthBar | undefined;

//     // private _platformHook

//     constructor(id: string) {
//         super(id);

//         // Create
//         this.createMainScene();
//         this.createCharacterMesh();
//         this.createAudio();

//         this.initializePhysics(); //update

//         // Events
//         this.update();
//         this.showGUI();

//     }


//     private createHealingParticlesAttachedToCharacter() {
//         if (!this._characterMesh) return;

//         // Main healing aura effect
//         const particleSystem = new ParticleSystem("healingAura", 500, this._scene!);
        
//         // Use a soft glow texture (consider a custom circular gradient texture)
//         particleSystem.particleTexture = new Texture("textures/flare.png", this._scene);
//         particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE; // Additive blending for bright effect

//         // Attach to character
//         particleSystem.emitter = this._characterMesh;
//         particleSystem.isLocal = true;

//         // Emission area - focused around character's core
//         particleSystem.minEmitBox = new Vector3(-0.5, 0, -0.5);
//         particleSystem.maxEmitBox = new Vector3(0.5, 1.8, 0.5);

//         // Color - vibrant healing green with white core
//         particleSystem.color1 = new Color4(0.2, 1.0, 0.3, 1.0); // Vivid green
//         particleSystem.color2 = new Color4(0.8, 1.0, 0.8, 0.3); // White-green fade
//         particleSystem.colorDead = new Color4(0.1, 0.4, 0.1, 0.0);

//         // Larger particle sizes (reduced count but more visible)
//         particleSystem.minSize = 0.4;
//         particleSystem.maxSize = 1.2;

//         // Fewer but longer-lasting particles
//         particleSystem.minLifeTime = 1.0;
//         particleSystem.maxLifeTime = 2.5;
//         particleSystem.emitRate = 60;

//         // Gentle upward movement with some variation
//         particleSystem.direction1 = new Vector3(-0.1, 0.8, -0.1);
//         particleSystem.direction2 = new Vector3(0.1, 1.2, 0.1);
//         particleSystem.gravity = new Vector3(0, 0.1, 0);

//         // Rotation for organic feel
//         particleSystem.minAngularSpeed = -0.3;
//         particleSystem.maxAngularSpeed = 0.3;

//         // Initial burst effect
//         const burstParticles = new ParticleSystem("healingBurst", 100, this._scene!);
//         burstParticles.particleTexture = particleSystem.particleTexture.clone();
//         burstParticles.emitter = this._characterMesh.position.clone();
//         burstParticles.minSize = 1.5;
//         burstParticles.maxSize = 3.0;
//         burstParticles.minLifeTime = 0.4;
//         burstParticles.maxLifeTime = 0.8;
//         burstParticles.emitRate = 300;
//         burstParticles.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        
//         // Start systems
//         particleSystem.start();
//         burstParticles.start();

//         // Dynamic control
//         const startTime = Date.now();
//         const duration = 2000;
//         const updateInterval = setInterval(() => {
//             const elapsed = Date.now() - startTime;
//             if (elapsed >= duration) {
//                 clearInterval(updateInterval);
//                 particleSystem.stop();
//                 burstParticles.stop();
//                 setTimeout(() => {
//                     particleSystem.dispose();
//                     burstParticles.dispose();
//                 }, 2500);
//                 return;
//             }
            
//             // Update burst position to follow character
//             burstParticles.emitter = this._characterMesh?.position.clone()!;
            
//             // Reduce burst emission after initial pop
//             if (elapsed > 300) {
//                 burstParticles.emitRate = 0;
//             }
//         }, 16);

//         // Optional: Add a subtle pulse effect on the character material
//         // this._addHealingPulseEffect();
//     }

//     private createHealingParticles(position: Vector3) {

//         if(!this._scene) return;
//         const particleSystem = new ParticleSystem("healingParticles", 1000, this._scene);

//         // ใช้ texture อนุภาค
//         particleSystem.particleTexture = new Texture("textures/flare.png", this._scene);

//         // ตำแหน่งเริ่มต้น
//         particleSystem.emitter = position.clone();
//         particleSystem.minEmitBox = new Vector3(-0.2, 0, -0.2); // ปล่อยกระจายเล็กน้อย
//         particleSystem.maxEmitBox = new Vector3(0.2, 0.5, 0.2);

//         // สีของอนุภาค (เขียว)
//         particleSystem.color1 = new Color4(0.3, 1, 0.3, 1);
//         particleSystem.color2 = new Color4(0.2, 0.8, 0.2, 0.5);
//         particleSystem.colorDead = new Color4(0, 0.5, 0, 0);

//         // ขนาด
//         particleSystem.minSize = 0.2;
//         particleSystem.maxSize = 0.4;

//         // อายุ
//         particleSystem.minLifeTime = 0.5;
//         particleSystem.maxLifeTime = 1.5;

//         // ความเร็ว
//         particleSystem.emitRate = 150;

//         // ทิศทางการเคลื่อนที่
//         particleSystem.direction1 = new Vector3(0, 1, 0); // ลอยขึ้น
//         particleSystem.direction2 = new Vector3(0, 1.5, 0);

//         // แรงโน้มถ่วง (ไม่มี)
//         particleSystem.gravity = new Vector3(0, 0, 0);

//         // ความเร็วเริ่มต้น
//         particleSystem.minEmitPower = 0.2;
//         particleSystem.maxEmitPower = 0.6;
//         particleSystem.updateSpeed = 0.01;

//         particleSystem.start();

//         // หยุดแสดงหลัง 2 วิ
//         setTimeout(() => {
//             particleSystem.stop();
//             particleSystem.dispose(); // ลบออกจาก scene
//         }, 2000);
//     }

//     private updateHealingPotion() {
//         if(!this._scene) return;

//         this._scene.registerBeforeRender(() => {

//             if (!this._characterMesh) return;

//             const deltaTime = this._scene?.getEngine().getDeltaTime(); // ms ที่ผ่านไปในแต่ละ frame

//             // เช็คว่า potion ถูกเก็บไปแล้วหรือยัง
//             if (this._healingPotionUsed) {

//                 this._potionElapsedTime += deltaTime!;

//                 // console.log(`ElapsedTime: ${this._potionElapsedTime}`)

//                 if (this._potionElapsedTime >= this._potionRespawnTime) {
//                     // เวลาครบ 1 นาทีแล้ว ให้ potion กลับมา
//                     const potionMesh = this._scene?.getMeshByName("node0");
//                     if (potionMesh) {
//                         // potionMesh.isVisible = true;
//                         potionMesh.position.y = 1; // ย้ายออกจากฉาก
//                         new PhysicsAggregate(potionMesh, PhysicsShapeType.MESH, { mass: 1 });
//                     }
//                     this._healingPotionUsed = false;
//                     this._potionCollectedAt = null;
//                     this._potionElapsedTime = 0;
//                 }
//                 return; // รอจน respawn เสร็จ
//             }

//             this._scene?.meshes.forEach((otherMesh) => {
//                 // ตรวจสอบการชนปกติ
//                 const potionMesh = this._scene?.getMeshByName("node0");
//                 if (potionMesh && potionMesh.isVisible && this._characterMesh?.intersectsMesh(potionMesh, false)) {
//                     // potionMesh.isVisible = false;
//                     // potionMesh.checkCollisions = false;
//                     this._hpBar?.updateHP(20);
//                     potionMesh.position.y = -10; // ย้ายออกจากฉาก
//                     potionMesh.physicsBody?.dispose(); // ปิด physics

//                     this._healSoundEffect.play();
//                     this._healingPotionUsed = true;
//                     this._potionElapsedTime = 0;

//                     this.createHealingParticles(this._characterMesh.position.clone());
//                     this.createHealingParticlesAttachedToCharacter();
//                 }
//             });
//         });
//     }

//     public applyPhysicsViewer() {
//         if(!this._scene) return;
//         this._physicsViewer = new PhysicsViewer(this._scene);
//         for (const node of this._scene.rootNodes) {
//             if (node instanceof Mesh && node.physicsBody) {
//                 const debugMesh = this._physicsViewer.showBody(node.physicsBody);
//             }
//         }
//         // if(this._bossPhysicsBody) {
//         //     const debugMeshd = physicsViewer.showBody(this._bossPhysicsBody?.body);

//         // }
//         // for (const node of this._scene.rootNodes) {
//         //     if (node instanceof Mesh && node.physicsBody) {
//         //         const debugMesh = physicsViewer.showBody(node.physicsBody);
//         //     }
//         // }

//     }

//     public async initializePhysics(): Promise<boolean> {

//         if(!this._scene) throw Error("Cannot find scene");
    
//         try {

//             const isActivePhysics = await this.setUpPhysicsPlugin();         

//             if (isActivePhysics) {
//                 console.log("initializePhysics: Physics engine enabled.");
//                 this.setPhysicsMesh();                
//                 this.setupCharacterControl();

//                 // Decoration
//                 await this.createModel(ItemId.GreenPotion, false);
//                 // this.applyPhysicsViewer();
//                 await this.createMainCharacter();

//                 return true;
//             } else {
//                 console.error("initializePhysics: Physics engine not enabled.");
//                 return false;
//             }

//         } catch (error) {
//             console.error("Failed to load Havok Physics:", error);
//             return false;
//         }
//     }

//     public createSphere() {
//         const x = 0;
//         const y = 2;
//         const z = 4;

//         var sph = MeshBuilder.CreateSphere("s"+x+y+z, {diameter: 0.5});
//         // sph.material = mat;
//         sph.position.set(0, 2, -6);
//         var ag = new PhysicsAggregate(sph, PhysicsShapeType.SPHERE, {mass: 1});
//     }

//     private applyPhysicsToEachChildMesh(mesh: AbstractMesh) {
//         const childMeshes = mesh.getChildMeshes();

//         if (childMeshes.length === 0) {
//             console.warn("No child meshes found.");
//             return;
//         }

//         childMeshes.forEach(child => {
//             if (child instanceof Mesh) {
//                 console.log(`Applying physics to: ${child.name}`);
//                 child.scaling.scaleInPlace(0.5)
//                 child.position.y = -0.5;
//                 new PhysicsAggregate(child, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
//             }
//         });
//     }

//     private mergeChildMeshes(mesh: AbstractMesh): Mesh | null {
//         const childMeshes = mesh.getChildMeshes().filter(
//             (m): m is Mesh => m instanceof Mesh
//         );

//         console.log(`Merging ${childMeshes.length} child meshes...`);

//         if (childMeshes.length > 1) {
//             const merged = Mesh.MergeMeshes(childMeshes, true, true, undefined, false, true);
//             if (merged) {
//                 merged.position = mesh.position.clone();
//                 merged.isVisible = true;
//                 merged.setEnabled(true);
//                 console.log("Meshes merged successfully.");
//                 return merged;
//             } else {
//                 console.warn("Mesh merging failed.");
//                 return null;
//             }
//         } else if (childMeshes.length === 1) {
//             console.log("Only one mesh found. No merging performed.");
//             return childMeshes[0];
//         } else {
//             console.warn("No meshes to merge.");
//             return null;
//         }
//     }

//     private applyPhysicsSmart(mesh: AbstractMesh) {
//         const childMeshes = mesh.getChildMeshes().filter(
//             (m): m is Mesh => m instanceof Mesh
//         );

//         console.log(`childMeshes: ${childMeshes.length}`)
//         if (childMeshes.length === 1) {
//             // Just apply physics directly to that one mesh
//             const singleMesh = childMeshes[0];
//             console.log("Applying physics to single mesh:", singleMesh.name);
//             new PhysicsAggregate(singleMesh, PhysicsShapeType.MESH, { mass: 1 }, this._scene);
//         } else if (childMeshes.length > 1) {
//             // Merge and apply physics
//             const merged = Mesh.MergeMeshes(childMeshes, true, true, undefined, false, true);
//             if (merged) {
//                 // merged.position = mesh.position.clone();
//                 merged.isVisible = true;
//                 merged.setEnabled(true);
//                 new PhysicsAggregate(merged, PhysicsShapeType.MESH, { mass: 1 }, this._scene);
//                 console.log("Applied physics to merged mesh.");
//             } else {
//                 console.warn("Mesh merging failed.");
//             }
//         } else {
//             console.warn("No valid mesh to apply physics.");
//         }
//     }

//     public async createModel(modelId: string, isMerge: boolean = true) {
        
//         const result = await ImportMeshAsync(modelId, this._scene!);
//         const mesh = result.meshes[0];
//         let childMeshes = mesh.getChildMeshes();

//         if (!childMeshes) {
//             console.error("No mesh found in GLB.");
//             return;
//         }

//         if (childMeshes.length === 0) {
//         console.warn("No child meshes found.");
//         return;
//         }

//         mesh.scaling.scaleInPlace(0.5);
//         mesh.position.z = -8;
//         mesh.position.y = 1;

//         mesh.showBoundingBox = true;
//         mesh.showSubMeshesBoundingBox = true;

//         //Apply Physics
//         if (this._scene?.isPhysicsEnabled()) {
//             this.applyPhysicsSmart(mesh);
//             // new PhysicsAggregate(mesh!, PhysicsShapeType.MESH, { mass: 2 });
//             // if(isMerge && childMeshes.length > 1) {
//             //     const mesh0 = this.mergeChildMeshes(mesh!);
//             //     if(mesh0) {
//             //         // this.applyPhysicsSmart(mesh0!);
//             //         this.applyPhysicsToEachChildMesh(mesh);

//             //     }
//             // }else{
//             //     this.applyPhysicsToEachChildMesh(mesh);
//             // }
//         } else {
//             console.warn("Physics is not enabled on the scene.");
//         }
//     }

//     public async createAudio() {
//         const audioEngine = await CreateAudioEngineAsync();
//         this._healSoundEffect = await audioEngine.createSoundAsync("healing", PATHS.SOUNDS.HEALING);
//         this._healSoundEffect.volume = 0.25;
//         await audioEngine.unlockAsync();
//     }
    
//     public createCamera() {
//         this._camera = new FreeCamera("camera1", new Vector3(0, 5, -10), this._scene);
//         this._camera.setTarget(Vector3.Zero());
//         this._camera.attachControl(true);
//     }

//     public async createMainScene() {

//         // Camera
//         this.createCamera();

//         // Light
//         this._light = new HemisphericLight('light1', new Vector3(0, 1, 0), this._scene);
    
//         // Skybox 
//         // this.createSkybox();

//         // Ground
//         const groundSize = 20;
//         this._ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, this._scene);

//     }

//     private _shootBullet() {
//         if (!this._characterMesh || !this._scene || !this._hkPlugin) return;
    
//         // Create bullet mesh
//         const bullet = MeshBuilder.CreateSphere("bullet", { diameter: 0.2 }, this._scene);
//         bullet.position = this._characterMesh.position.clone().add(new Vector3(0, 0.25, 0));
    
//         // Material
//         const mat = new StandardMaterial("bulletMat", this._scene);
//         mat.diffuseColor = new Color3(1, 1, 0); // yellow
//         bullet.material = mat;
    
//         // Physics body
//         const bulletAggregate = new PhysicsAggregate(bullet, PhysicsShapeType.SPHERE, {
//             mass: 0.2,
//             restitution: 0.1,
//             friction: 0.2
//         }, this._scene);
    
//         // Get forward direction
//         const forward = this._characterMesh.forward;
    
//         // Apply velocity
//         bulletAggregate.body.setLinearVelocity(forward.scale(100));
    
//         // 💥 Auto-dispose after 3 seconds
//         setTimeout(() => {
//             bulletAggregate.body.dispose(); // dispose physics
//             bullet.dispose();               // dispose mesh
//             mat.dispose();                  // dispose material
//         }, 3000);
//     }

//     //collision world
//     private createTrampoline() {
//         var trampoline = MeshBuilder.CreateBox("trampoline", {size: 1}, this._scene);
//         trampoline.position = new Vector3(3, 0, -5);
//         trampoline.scaling.y = 0.3;
//         trampoline.checkCollisions = true;
//         const trampolineMat = new StandardMaterial("trampoline_mat");
//         trampolineMat.diffuseColor = new Color3(1, 0.95, 0);
//         trampoline.material = trampolineMat;

//         var trampolineAggregate = new PhysicsAggregate(trampoline, PhysicsShapeType.BOX, { mass: 0, restitution:0.0}, this._scene);
//         trampolineAggregate.body.setCollisionCallbackEnabled(true);

//         // 🔍 Listen only when the trampoline is involved
//         this._hkPlugin?.onCollisionObservable.add((event) => {
//             const nodeA = event.collider.transformNode;
//             const nodeB = event.collidedAgainst.transformNode;

//             const isTrampolineInvolved =
//                 nodeA?.name === "trampoline" || nodeB?.name === "trampoline";

//             if (isTrampolineInvolved) {
//                 console.log(`nodeA: ${nodeA}, nodeB: ${nodeB}`);
//                 if(event.type === "COLLISION_STARTED" && nodeA.name === "character_capsule") {
//                     this._inputVelocity.y = 6;
//                 }
//             }
//         });
        
//         this._hkPlugin?.onCollisionEndedObservable.add((ev) => {
//             console.log(ev.type);
//             this._inputVelocity.y = 0;
//         });

//     }

//     private createSkybox() {
//         const skybox = MeshBuilder.CreateBox("skyBox", { size: 3500.0 }, this._scene);
//         const skyboxMaterial = new StandardMaterial("skyBox", this._scene);
        
//         const reflectionTexture = new CubeTexture(PATHS.TEXTURES.SKY, this._scene!);
//         skyboxMaterial.reflectionTexture = reflectionTexture;
//         skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
//         skyboxMaterial.backFaceCulling = false;
//         skyboxMaterial.disableLighting = true;
//         skybox.material = skyboxMaterial;

//         return skybox
//     };

//     private createWallsPhysics(groundSize = 20) {
//         // Wall settings
//         const wallHeight = 2;
//         const wallThickness = 0.5;
//         const wallLength = groundSize;

//         // debug red sphere that will be placed where the shape cast detects the casting collision point
//         this._sphereHitWorld = MeshBuilder.CreateSphere("s", {diameter: 0.15});
//         const sphereHitWorldMaterial = new StandardMaterial("sm");
//         sphereHitWorldMaterial.diffuseColor = new Color3(1,0,0);
//         this._sphereHitWorld.material = sphereHitWorldMaterial;
    
//         // Back Wall (Z-)
//         // const wallBack = MeshBuilder.CreateBox("wallBack", { width: wallLength, height: wallHeight, depth: wallThickness }, this._scene);
//         // wallBack.position = new Vector3(0, wallHeight / 2, -groundSize / 2);
    
//         // Front Wall (Z+)
//         const wallFront = MeshBuilder.CreateBox("wallFront", { width: wallLength, height: wallHeight, depth: wallThickness }, this._scene);
//         wallFront.position = new Vector3(0, wallHeight / 2, groundSize / 2);
    
//         // Left Wall (X-)
//         const wallLeft = MeshBuilder.CreateBox("wallLeft", { width: wallThickness, height: wallHeight, depth: wallLength }, this._scene);
//         wallLeft.position = new Vector3(-groundSize / 2, 1, 0);

//         const wallMat = new StandardMaterial("wallMat");
//         const wallTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Platform_1mx1m.png");
//         wallTexture.vScale = wallHeight / 2;
//         wallTexture.uScale = wallHeight / 2;
//         wallMat.diffuseTexture = wallTexture;
//         wallLeft.checkCollisions = true;

//         // Right Wall (X+)
//         const wallRight = MeshBuilder.CreateBox("wallRight", { width: wallThickness, height: wallHeight, depth: wallLength }, this._scene);
//         wallRight.position = new Vector3(groundSize / 2, wallHeight / 2, 0);

//         wallLeft.material = wallMat;
//         wallRight.material = wallMat;
//         wallFront.material = wallMat;

//         var wallBase = MeshBuilder.CreateBox("wall", {size: 2}, this._scene);
//         wallBase.position.y = 1;
//         wallBase.position.x = 3;
//         var wallAggregate = new PhysicsAggregate(wallBase, PhysicsShapeType.BOX, { mass: 0, restitution:0.0}, this._scene);
//         const wallMaterial = new StandardMaterial("wall");
//         wallMaterial.diffuseTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Wall_1mx1m.png");
//         wallBase.material = wallMaterial;

//         // up/down lift
//         this._liftMesh = MeshBuilder.CreateBox("lift", {width: 2, height:0.1, depth:2}, this._scene);
//         var liftAggregate = new PhysicsAggregate(this._liftMesh, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
//         const liftMaterial = new StandardMaterial("lift");
//         liftMaterial.diffuseTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Platform_1mx1m.png");
//         this._liftMesh.material = liftMaterial;
//         liftAggregate.body.disablePreStep = false;
//         liftAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
//         // wallBase.position.x = 3;
//         this._liftMesh.position.x= 1;
//         let time = 0;

//         /**
//         * set wall physics
//         */
//         new PhysicsAggregate(wallLeft, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
//         new PhysicsAggregate(wallRight, PhysicsShapeType.BOX, { mass: 0 }, this._scene);
//         new PhysicsAggregate(wallFront, PhysicsShapeType.BOX, { mass: 0 }, this._scene);

//         // left/right platform
//         this._platformAggregate = new PhysicsAggregate(this._liftMesh.clone(), PhysicsShapeType.BOX, { mass: 0 }, this._scene);
//         this._platformAggregate.body.disablePreStep = false;
//         this._platformAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
//         this._platformAggregate.transformNode.position.set(5,2,0);

//         this._scene?.onBeforeAnimationsObservable.add( () => {

//             if(!this._engine) return;
//             if(!this._platformAggregate) return;

//             const newPlatformx = (Math.sin(time * 0.8) + 6);
//             // platformAggregate.deltax = newPlatformx - platformAggregate.transformNode.position.x;
//             this._deltaX = newPlatformx - this._platformAggregate.transformNode.position.x;

//             this._platformAggregate.transformNode.position.x = newPlatformx;
//             // console.log(`deltaX: ${this._deltaX}`)

//             this._liftMesh.position.y = (Math.cos(time * 0.8) + 1) * 0.98;
//             time += this._engine.getDeltaTime() * 0.001;

//         });

//     }
    
//     public activateAxes(character: Mesh) {
//         const axes = new AxesViewer(this._scene, 0.5);
//         axes.xAxis.position = new Vector3(0, 1, 0);
//         axes.yAxis.position = new Vector3(0, 1, 0);
//         axes.zAxis.position = new Vector3(0, 1, 0);

//         axes.xAxis.parent = character;
//         axes.yAxis.parent = character;
//         axes.zAxis.parent = character;

//         // Make sure the axes follow the character's rotation
//         axes.xAxis.rotationQuaternion = null;
//         axes.yAxis.rotationQuaternion = null;
//         axes.zAxis.rotationQuaternion = null;

//     }

//     public createCharacterMesh() {
//         this._characterMesh = MeshBuilder.CreateCapsule("character_capsule", {height: 1.8, radius: 0.45 });
//         // this._characterMesh = MeshBuilder.CreateBox("character", {height: 1.8 });

//         const characterMaterial = new StandardMaterial("character");
//         characterMaterial.diffuseColor = new Color3(1, 0.56, 0.56);
//         this._characterMesh.material = characterMaterial;
//         this._characterMesh.position.set(0,1.5,-5);
//         this._characterMesh.isVisible = false;

//         //Healthbar
//         this._hpBar = new HealthBar( this._characterMesh, "Visitor", { isBoss: false, hp: this._playerHP }, this._scene!);

//         //Set Camera
//         this._camera && this._camera.setTarget(this._characterMesh.position);

//         //Axes
//         this.activateAxes(this._characterMesh);

//         //Loading Character Mesh
//         // ImportMeshAsync('./models/character');


//     }

//     //Trigger 
//     private createTriggerShape() {
//         var triggerShapeRadius = 2;

//         // Mesh
//         const triggerShapeRepr = MeshBuilder.CreateSphere("triggerShapeRepr", {diameter: triggerShapeRadius*2});
//         var triggerTransform = new TransformNode("triggerTransform");

//         // Mat
//         const triggerShapeReprMat = new StandardMaterial("triggerShapeShapeReprMat");
//         triggerShapeReprMat.diffuseColor = Color3.Red();
//         // assign Mat into Mesh
//         triggerShapeRepr.material = triggerShapeReprMat;
//         triggerShapeRepr.material.alpha = 0.7;

//         triggerShapeRepr.position = new Vector3(0, 0, 0);

//         // Mess
//         var triggerShape = new PhysicsShapeSphere(new Vector3(0,0,0), triggerShapeRadius, this._scene!);
//         triggerShape.isTrigger = true;

//         // Mess PhysicsBody
//         var triggerBody = new PhysicsBody(triggerTransform, PhysicsMotionType.STATIC, false, this._scene!);
//         triggerBody.shape = triggerShape;

//         this._hkPlugin?.onTriggerCollisionObservable.add((ev) => {
//             // console.log(ev);
//             console.log(ev.type, ':', ev.collider.transformNode.name, '-', ev.collidedAgainst.transformNode.name);
//         });

//     }

//     private async setPhysicsMesh() {
//         if(!this._characterMesh || !this._ground) return;
//         this._characterAggregate = new PhysicsAggregate(this._characterMesh,
//             PhysicsShapeType.CAPSULE,
//             { mass: 1, friction: 0.5, restitution: 0 },
//             this._scene);
//         this._characterBody = this._characterAggregate.body;
//         if(this._characterBody) {
//             this._characterBody.disablePreStep = false;
//             this._characterBody.setMassProperties({ inertia: Vector3.ZeroReadOnly });

//             this._characterBody.setCollisionCallbackEnabled(true);

//             // Observe collisions (passive)
//             const observable = this._characterBody.getCollisionObservable();
//             const observer = observable.add((collisionEvent) => {
//                 const other = collisionEvent.collider;
//                 const name = other.transformNode?.name || 'Unnamed object';
//                 // console.log('Character collided with:', collisionEvent.collidedAgainst.transformNode.name);
//             });
//         }

//         var groundAggregate = new PhysicsAggregate(this._ground, PhysicsShapeType.BOX, { mass: 0 }, this._scene);        
//         const groundMaterial = new StandardMaterial("ground");
//         const groundTexture = new Texture("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Ground_1mx1m.png");
//         groundTexture.vScale = 5;
//         groundTexture.uScale = 5;
//         groundMaterial.diffuseTexture = groundTexture;
//         this._ground.material = groundMaterial;

//         //call others
//         await this.update();
//     }

//     private respawnUnderThreshold() {
//         if(this._characterMesh) {
//             if(this._characterMesh.position.y < -1) {
//                 this._characterMesh.position.set(0,1,-3);
//             }
//         }
//     }

//     private showGUI() {
//         if(!this._scene) return;

//         var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene!);
//         this._guiText01 = new GUI.TextBlock("guiTextBlock01", "");
//         this._guiText01.color = "white";
//         this._guiText01.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
//         this._guiText01.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
//         this._guiText01.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
//         this._guiText01.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
//         this._guiText01.fontFamily = "Courier New";
//         this._guiText01.fontSize = "15pt"; 
//         this._guiText01.text += "Sprinting         : \n";
//         this._guiText01.text += "Jump              : \n";

//         advancedTexture.addControl(this._guiText01); 

//         // Shoot bullet
//         this._scene?.onPointerObservable.add(() => this._shootBullet(), PointerEventTypes.POINTERDOWN);


//         this._engine && this._engine.onBeginFrameObservable.add(() => {

//             if(this._guiText01) {
//                 this._guiText01.text = "\n";
//                 this._guiText01.text += "   FPS               : " +  this._engine?.getFps().toFixed(2) + "\n";
//                 this._guiText01.text += "   inputVelocity     : " +  this._inputVelocity + "\n";
//                 this._guiText01.text += "   dist              : " +  this._dist + "\n";
//                 this._guiText01.text += "   min dist          : " +  Math.min(this._dist - 10, 0) + "\n";
//                 this._guiText01.text += "   max dist          : " +  Math.max(this._dist - 6, 0) + "\n";
//                 this._guiText01.text += "   amount            : " +  (Math.min(this._dist-10, 0) + Math.max(this._dist-15, 0)) + "\n";
//                 this._guiText01.text += "   amount * 0.02     : " +  (Math.min(this._dist-10, 0) + Math.max(this._dist-15, 0)) * 0.02 + "\n";
//             }
//         });
//     }

//     private _playAnimation(name: string) {
//         if (this._currentAnim === name) return;

//         if (this._currentAnim) {
//             this._animations[this._currentAnim]?.stop();
//         }

//         this._animations[name]?.start(true);
//         this._currentAnim = name;
//     }


//     private setupCharacterControl() {
//         if(!this._scene) return;

//         this._scene.onBeforeAnimationsObservable.add( ()=> {
//             if(!this._camera || !this._characterMesh || !this._characterBody) return;

//             this._amount = 0;
//             this._dist = 0;

//             // by default, character velocity is 0. It won't move if no input or not falling
//             var linearVelocity = new Vector3(0,0,0);

//             //#region Update Camera
//             // get camera world direction and right vectors. Character will move in camera space. 
//             var cameraDirection = this._camera.getDirection(new Vector3(0,0,1));
//             cameraDirection.y = 0;
//             cameraDirection.normalize();

//             var cameraRight = this._camera.getDirection(new Vector3(1,0,0));
//             cameraRight.y = 0;
//             cameraRight.normalize();

//             cameraDirection.scaleAndAddToRef(this._inputVelocity.z, linearVelocity); // z is forward
//             cameraRight.scaleAndAddToRef(this._inputVelocity.x, linearVelocity);     // x is strafe
//             //#endregion

//             // interpolate between current velocity and targeted velocity. This will make acceleration and decceleration more visible
//             linearVelocity = Vector3.Lerp(this._characterBody.getLinearVelocity(), linearVelocity, 0.2);

//             //falling
//             if (this._platformHook) {
//                 console.log(`hit platform...`)
//                 // linearVelocity.x += 0.00999 * 16.66;
//                 linearVelocity.x += this._deltaX * 16.66;
//             }
            
//             if(this._inputVelocity.y > 0) {
//                 linearVelocity.y = this._inputVelocity.y;
//             }else{
//                 linearVelocity.y = this._characterBody.getLinearVelocity().y;
//             } 

//             if(this._characterMesh) {
//                 // Casting the shape to the ground below. It works like a raycast but with thickness
//                 // this._camera.parent = this._characterMesh;
//                 const shapeLocalResult = new ShapeCastResult();
//                 const hitWorldResult = new ShapeCastResult();
//                 this._hkPlugin?.shapeCast({shape: this._characterAggregate.shape,
//                     rotation: this._characterMesh.rotationQuaternion!,
//                     startPosition: this._characterMesh?.position!,
//                     endPosition: new Vector3(this._characterMesh?.position.x, this._characterMesh?.position.y-10, this._characterMesh.position.z),
//                     shouldHitTriggers: false,
//                 }, shapeLocalResult, hitWorldResult);

//                 // Move sphere to hit position
//                 if(this._sphereHitWorld) {
//                     this._sphereHitWorld.position = hitWorldResult.hitPoint;
//                 }

//                 // Check on platform *PhysicsAggregate 
//                 if(this._platformAggregate) {
//                     this._platformHook = (hitWorldResult.body === this._platformAggregate.body) ? this._platformAggregate : null;
//                 }
//             }

//             // linearVelocity.y = this._characterBody.getLinearVelocity().y;

//             if (this._inputVelocity.x !== 0 || this._inputVelocity.z !== 0) {
//                 const moveDir = new Vector3(this._inputVelocity.x, 0, this._inputVelocity.z);
//                 const angle = Math.atan2(moveDir.x, moveDir.z); // target angle in radians
//                 // console.log(`x: ${moveDir.x}, y: ${moveDir.z}, angle: ${angle}`)
            
//                 // const currentRotation = this._characterBody.transformNode.rotationQuaternion?.toEulerAngles() ?? Vector3.Zero();
//                 const targetRotation =  Quaternion.RotationYawPitchRoll(angle, 0, 0);
            
//                 // Optional: slerp for smooth rotation
//                 const newRotation = Quaternion.Slerp(
//                     this._characterBody.transformNode.rotationQuaternion ?? Quaternion.Identity(),
//                     targetRotation,
//                     0.2 // Smoothing factor
//                 );
            
//                 this._characterBody.transformNode.rotationQuaternion = newRotation;
//             }

//             // Apply computed linear velocity. Each frame is the same: get current velocity, transform it, apply it, ...

//             const movementSpeed = new Vector3(linearVelocity.x, 0, linearVelocity.z).length();
//             const isWalking = movementSpeed > 0.05;

//             this._characterBody.setLinearVelocity(linearVelocity);

//             if (isWalking) {
//                 this._playAnimation("Walk");
//             } else {
//                 this._playAnimation("Idle");
//             }

            
//             // Camera control: Interpolate the camera target with character position. compute an amount of distance to travel to be in an acceptable range.
//             this._camera.setTarget(Vector3.Lerp(this._camera.getTarget(), this._characterMesh.position, 0.1));
//             this._dist = Vector3.Distance(this._camera.position, this._characterMesh.position);
//             this._amount = (Math.min(this._dist - 10, 0) + Math.max(this._dist - 15, 0)) * 0.02;

//             cameraDirection.scaleAndAddToRef(this._amount, this._camera.position);
//             this.respawnUnderThreshold();

//         });

//         this._scene.onKeyboardObservable.add((kbInfo) => {
//             const multiplier = (kbInfo.type == KeyboardEventTypes.KEYDOWN) ? 2 : 0;
        
//             switch (kbInfo.event.key.toLowerCase()) {
//                 // Arrow keys
//                 case 'arrowup':
//                 case 'w':
//                     this._inputVelocity.z = multiplier; // ✅ Forward
//                     break;
//                 case 'arrowdown':
//                 case 's':
//                     this._inputVelocity.z = -multiplier; // ✅ Backward
//                     break;
//                 case 'arrowleft':
//                 case 'a':
//                     this._inputVelocity.x = -multiplier; // ✅ Left
//                     break;
//                 case ' ':
//                     this._inputVelocity.y = multiplier * 2.5;
//                     break;
//                 case 'arrowright':
//                 case 'd':
//                     this._inputVelocity.x = multiplier; // ✅ Right
//                     break;
//             }
//         });
//     }

//     //dev
//     private async createMainCharacter() {
//         const result =  await ImportMeshAsync(ItemId.MainCharacter, this._scene!);
//         const mesh = result.meshes[0]

//         // Force bounding info update (in case it's not ready)
//         mesh.computeWorldMatrix(true);
//         mesh.name = "MainCharacterMerged";
//         mesh.position.set(0, 0, 0);
//         // mergedMesh.scaling.set(100, 100, 100); // Or any scale factor
//         mesh.computeWorldMatrix(true);

//         const boundingInfo = this._characterMesh?.getBoundingInfo();
//         const minY = boundingInfo?.boundingBox.extendSize.y;
//         mesh.position.y -= minY!;

//         mesh.scaling.scaleInPlace(2);
//         mesh.parent = this._characterMesh!;

//         // Access animation groups from the result
//         result.animationGroups.forEach(anim => {
//             this._animations[anim.name] = anim;
//         });

//         // Add Havok physics if scene has physics enabled
//         await this._scene?.whenReadyAsync();

//     }

//     // Call Game Engine
//     public async start() {

//         this.addGameObject(new RotatingCube("cube1", {x: -4.5, y: 2, z: 0 }));
//         this.addGameObject(new RotatingCube("cube2", {x: -4.5, y: 2, z: -3 }));

//         // Add Objects
//         for (const obj of this.gameObjects) {
//             await obj.start(this._scene!);
//         }

//         this.render();
//     }

//     public async update() {

//         // this.createWallsPhysics();
//         // this.createTrampoline();
//         // this.createTriggerShape();
//         // this.createModel(ItemId.MainCharacter, false);
//         this.updateHealingPotion();

//     }

//     /**
//      * Render will bed called in Start();
//      */
//     public render() {

//         // let lastTime = performance.now();
//         this._scene?.onBeforeRenderObservable.add(() => {
//             const deltaTime = this._scene?.getEngine()?.getDeltaTime()! / 1000;
//             if(deltaTime) {
//                 for (const obj of this.gameObjects) {
//                     if (obj.update) {
//                         obj.update(deltaTime);
//                     }
//                 }
//             }
//         });

//         this._engine?.runRenderLoop( () => {

//             this._scene?.render();

//         });
//     }

//     public dispose() {
//         for (const obj of this.gameObjects) {
//             obj.dispose?.();
//         }
//         this.gameObjects = [];
//         this.onUpdate.clear();
//     }

//     public addGameObject(obj: IGameObject) {
//         this.gameObjects.push(obj);
//     }

// }