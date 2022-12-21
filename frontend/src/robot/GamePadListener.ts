const NotImplementedError = require("../NotImplementedError");

import {
    Capability,
    useManualVectorControlInteraction,
} from "../api";
import { useCapabilitiesSupported } from "../CapabilitiesProvider";

export class GamePadListener {

    // api function
    private sendInteraction;
    private fps = 2; // samplerate for the gamepad input
    private inputCaptureingRoutineId:NodeJS.Timer | null= null; 

    constructor() {
        const { mutate: sendInteraction, isLoading: interacting } =
            useManualVectorControlInteraction();
        this.sendInteraction = sendInteraction;
    }

    private inputCaptureingLoop() {
        // get all connected gamepads from browser
        const gamepads: (Gamepad | null)[] = navigator.getGamepads();
        if (gamepads!.length > 0 && gamepads[-1] !== null) {
            // check input of last connected gamepad
            const gp = _GamePad.factory(gamepads[-1]!);
            // send data request
            this.sendInteraction({
                x: gp.vector.x,
                y: gp.vector.y,
            });
        }
    }

   public init(): void {
        // check if robo supports manual moving
        const [supported] = useCapabilitiesSupported(Capability.ManualControl);
        if (supported) {
            window.addEventListener("gamepadconnected", (e) => {
                // only start if one gamepad is connected. If several connected use input of last connected
                if (navigator.getGamepads().length == 1) {
                    this.inputCaptureingRoutineId = setInterval(this.inputCaptureingLoop, 1000 / this.fps);
                }
            });

            window.addEventListener("gamepaddisconnected", (e) => {
                // only kill inputCaptureingRoutine when no gamepad is connected anymore
                if (navigator.getGamepads().length == 0 && this.inputCaptureingRoutineId != null) {
                    clearInterval(this.inputCaptureingRoutineId!);
                }
            });
        }
    }

    public dispose() {
        // dispose unused resources
        if (this.inputCaptureingRoutineId != null) {
            clearInterval(this.inputCaptureingRoutineId!);
            this.inputCaptureingRoutineId = null;
        }
    }

}



abstract class _GamePad {
    gp: Gamepad;
    constructor(gp: Gamepad) {
        this.gp = gp;
    }

    static factory(gp: Gamepad): _GamePad {
        // decide on gamepad id which mapping and config should be used
        if (gp.id.includes("Nintendo Wii Remote")) {
            return new WiiController(gp);
        } else {
            throw new NotImplementedError();
        }
    }

    get vector(): { x: number; y: number } {
        // implement for reach controller model stick threshold and mapping
        throw new NotImplementedError();
    }
}

class WiiController extends _GamePad {
    constructor(gp: Gamepad) {
        super(gp);
    }

    get vector(): { x: number; y: number } {
        let x = this.gp.buttons[0].pressed ? 1 : 0;
        x = this.gp.buttons[1].pressed ? -1 : 0;
        let y = this.gp.buttons[2].pressed ? 1 : 0;
        y = this.gp.buttons[3].pressed ? -1 : 0;
        return { x, y };
    }
}
  

