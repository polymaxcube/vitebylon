// import SceneManager from "@/core/SceneManager";

import { Engine, HavokPlugin, Scene, Vector3 } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

export default abstract class BaseGameRender {
    public _canvas: string;
    public _engine?: Engine;
    public _scene?: Scene;
    public _hkPlugin?: HavokPlugin | undefined;
    
    // public sceneManager?: SceneManager;
    
    constructor(canvas: string) {
        if (!canvas) throw new Error("Canvas Name not found!");
        this._canvas = canvas;

        if (!this._canvas) throw new Error("Canvas not found!");

        try {
            this.setUpEngine();
        } catch (error) {
            console.log(error)
        }

        if(this._engine) {
            this._scene = new Scene(this._engine);
            // this.setUpPhysics();
        }
    }

    public async setUpPhysicsPlugin() {
        try {
            const havokInstance = await HavokPhysics();
            this._hkPlugin = new HavokPlugin(true, havokInstance);
            this._scene?.enablePhysics(new Vector3(0, -9.81, 0), this._hkPlugin);
            console.log("Havok Physics initialized successfully.");

            if(this._scene?.enablePhysics()) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log(`Physics Setup: ${error}`);
            return false;
        }
    }

    public setUpEngine() {
        const canvas = document.getElementById(this._canvas) as HTMLCanvasElement;
        
        if (!canvas) {
            console.error(`Canvas with id "${canvas}" not found.`);
            return;
        }

        this._engine = new Engine(canvas, true);
    }

    public async update() {
    }

    protected resizeWindow() {
        if (typeof window !== "undefined") {
            window.addEventListener("resize", () => {
                if (this._engine) {
                    this._engine.resize();
                } else {
                    console.error("Engine is not initialized!");
                }
            });
        } else {
            console.error("Window object is not available. This code is likely not running in a browser.");
        }
    }

    abstract render(): void; 
}