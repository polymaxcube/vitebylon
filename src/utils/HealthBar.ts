//#region import
import { AbstractMesh, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
//#endregion

export enum Size {
    Large = 120,
    Normal = 50,
}

type Options = {
    isBoss?: boolean;
    hp?: number;
}

export default class HealthBar {
    private _scene: Scene;
    private _nodeMesh: Mesh;
    private _text: string | null = null;
    private _healthBarSize: Size = Size.Normal;
    private _options?: Options = { isBoss: false, hp: 100 };

    public _isDev: boolean = true;
    public _isBoss: boolean = false;
    public _setExtraHeight: number = 0.5;

    constructor(mesh: Mesh, text: string, options: Options, scene: Scene) {
        this._nodeMesh = mesh;
        this._scene = scene;
        this._text = text;
        this._options = options;
        this.init();
    }

    private init() {
        if (!this._nodeMesh) return;
        // Create billboard
        const billboard = MeshBuilder.CreatePlane("healthbar", { size: 1.5 }, this._scene);
        billboard.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
        billboard.parent = this._nodeMesh;
        billboard.isPickable = false;
        billboard.position = new Vector3(0, this._nodeMesh.getBoundingInfo().boundingBox.extendSize.y + this._setExtraHeight, 0); // Raise higher

        // Create UI for the mesh
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(billboard);

        // Create a StackPanel (to align text and health bar)
        const panel = new GUI.StackPanel();
        panel.isVertical = true; // Stack elements vertically
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Create TextBlock
        const textBlock = new GUI.TextBlock();
        textBlock.text = this._text ? this._text : "No Name";

        textBlock.color = this._isDev? "blue":"red";
        textBlock.fontSize = 120;
        textBlock.fontWeight = "bold";
        textBlock.outlineWidth = 2;
        textBlock.outlineColor = "black";
        textBlock.height = this._isBoss ? "220px": "250px";

        panel.addControl(textBlock); 


        // Create Health Bar
        const healthbar = new GUI.Rectangle();
        healthbar.width = 1;
        healthbar.height = `${Size.Normal}px`;
        healthbar.cornerRadius = 5;
        healthbar.color = "black";
        healthbar.thickness = 1;
        healthbar.background = "red";

        // Create Green Fill
        const greenHeal = new GUI.Rectangle();
        greenHeal.height = "100%";
        greenHeal.cornerRadius = 5;
        greenHeal.color = "black";
        greenHeal.thickness = 1;
        greenHeal.background = "green";
        greenHeal.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        greenHeal.width = `${this._options?.hp ? this._options.hp: 0}%`; // Health fill percentage
        healthbar.addControl(greenHeal);

        panel.addControl(healthbar); // Add health bar below text

        // Add the panel to the UI
        advancedTexture.addControl(panel);
    }

}
