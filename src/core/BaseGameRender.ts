// import SceneManager from "@/core/SceneManager";

import { Engine, FreeCamera, Scene } from "@babylonjs/core";



export default abstract class BaseGameRender {
    public _canvas: string;
    public _engine?: Engine;
    public _scene?: Scene;
    public _camera?: FreeCamera;
    // public sceneManager?: SceneManager;
    
    constructor(canvas: string) {
        console.log(`canvas: ${canvas}`)
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