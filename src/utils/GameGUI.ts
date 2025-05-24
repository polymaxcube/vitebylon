import { Engine, Scene, Vector3 } from '@babylonjs/core';
import * as GUI from 'babylonjs-gui';

export default class GameGUI {
    public _guiText01?: GUI.TextBlock | undefined;
    public _engine?: Engine;
    public _scene? : Scene;
    public _inputVelocity?: Vector3;

    constructor(inputVelocity?: Vector3, engine?: Engine, scene?: Scene) {

        this._scene = scene;
        this._engine = engine;
        this._inputVelocity = inputVelocity;

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

            }
        });
    }
}