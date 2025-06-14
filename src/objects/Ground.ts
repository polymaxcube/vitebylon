import { IGameObject } from "@/types/IGameObject";
import { PATHS } from "@/utils/static_assets";
import {
    GroundMesh,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    ShaderMaterial,
    StandardMaterial,
    Texture,
} from "@babylonjs/core";

import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";


type Position = {
    x: number;
    y: number;
    z: number;
};

export class Ground implements IGameObject {
  private _mesh!: Mesh;
  private _scene!: Scene | undefined;
  private _position!: Position | undefined;
  private _id: string;
  private _ground!: GroundMesh | undefined; 
  private _groundSize: number = 50;

  private _isShaderMat: boolean = true;

  constructor(id: string, positions: Position, scene: Scene) {
    this._id = id;
    this._position = positions;
    this._scene = scene;

    this._registerShaders(); // ✅ Register the shader on init
    this.start();

  }

  public async start() {

    let groundMaterial: StandardMaterial;
    let shaderMaterial: ShaderMaterial;

    // this._ground = MeshBuilder.CreateGround("ground", { width: this._groundSize, height: this._groundSize }, this._scene);
    this._ground = MeshBuilder.CreateGroundFromHeightMap("ground", `${PATHS.TEXTURES.GROUND_HEIGHTMAP}`, {
        width: 150, height: 150, subdivisions: 40, maxHeight: 3, minHeight: -2, 
        onReady: async (ground) => {

            // Optional: apply transformations first
            ground.bakeCurrentTransformIntoVertices();
            ground.refreshBoundingInfo();

            // Apply physics only after ground is ready
            this._ground = ground as GroundMesh;

            //#region Normal Mat
            if(!this._isShaderMat) {
              // ✅ Apply material safely after ground is ready
              groundMaterial = new StandardMaterial("ground", this._scene);
              const groundTexture = new Texture(`${PATHS.TEXTURES.GREEN_GRASS}`, this._scene);

              groundTexture.vScale = 5;
              groundTexture.uScale = 5;
              groundMaterial.diffuseTexture = groundTexture;
            }
            //#endregion

           //#region Shader Mat
            if(this._isShaderMat) {
              // ✅ Custom Shader Material for Height-Based Blending
              shaderMaterial = new ShaderMaterial("terrainShader", this._scene!, {
                vertex: "terrain",
                fragment: "terrain",
              }, {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "minHeight", "maxHeight"],
                samplers: ["grassTexture", "snowTexture"],
              });

              shaderMaterial.setTexture("grassTexture", new Texture(`${PATHS.TEXTURES.GREEN_GRASS}`, this._scene));
              shaderMaterial.setTexture("teaGrassTexture", new Texture(`${PATHS.TEXTURES.TEA_GRASS}`, this._scene));
              shaderMaterial.setFloat("minHeight", -2);  // match your terrain settings
              shaderMaterial.setFloat("maxHeight", 3);
            }
            //#endregion

            ground.material = this._isShaderMat ? shaderMaterial : groundMaterial;

            // await this.setPhysicsMesh(); // Now it's safe
            new PhysicsAggregate(
                ground,
                PhysicsShapeType.MESH,
                { mass: 0, friction: 0.8, restitution: 0 },
                this._scene
            );

         }, 
         updatable: false

      }, this._scene,);

  }

  public update(deltaTime: number) {
    return;
  }

  public dispose() {
    this._ground?.dispose();
  }

  public get mesh(): GroundMesh | undefined {
    return this._ground;
  }

  private _registerShaders() {
      if (ShaderStore.ShadersStore["terrainVertexShader"]) return;

      ShaderStore.ShadersStore["terrainVertexShader"] = `
          precision highp float;

          attribute vec3 position;
          attribute vec2 uv;
          uniform mat4 worldViewProjection;

          varying vec2 vUV;
          varying float vY;

          void main(void) {
              gl_Position = worldViewProjection * vec4(position, 1.0);
              vUV = uv;
              vY = position.y;
          }
      `;

      ShaderStore.ShadersStore["terrainFragmentShader"] = `
          precision highp float;

          varying vec2 vUV;
          varying float vY;

          uniform sampler2D grassTexture;
          uniform sampler2D teaGrassTexture;
          uniform float minHeight;
          uniform float maxHeight;

          void main(void) {
              float heightFactor = clamp((vY - minHeight) / (maxHeight - minHeight), 0.0, 1.0);
              vec4 grassColor = texture2D(grassTexture, vUV * 5.0);
              vec4 snowColor = texture2D(teaGrassTexture, vUV * 5.0);
              gl_FragColor = mix(grassColor, snowColor, heightFactor);
          }
      `;
  }

}
