import {Signal} from '../helpers/Signal';
import {Disposable} from "../core/Disposable";

export const KONAMI_SEQUENCE = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

// http://www.cambiaresearch.com/articles/15/javascript-key-codes

export const ASCII_NUMBERS_KEY_RANGE = [47, 58];
export const ASCII_NUMPAD_KEY_RANGE = [95, 112];
export const ASCII_ALPHA_KEY_RANGE = [64, 91];

export const ASCII_ENTER_KEY_CODE = 13;

export const ASCII_SPACEBAR_KEY_CODE = 32;

// TODO : A continuer

// TODO : Une classe d'input de clavier

export class Sequence extends Disposable
{
    // TODO : DOC

    private _currentIndex					:number				= 0;
    get currentIndex ():number { return this._currentIndex; }

    private _sequence						:number[];
    get sequence ():number[] { return this._sequence; }
    set sequence (pValue:number[])
    {
        this._sequence = pValue;
        this._currentIndex = 0;
    }

    private _onIndexChanged					:Signal				= new Signal();
    get onIndexChanged ():Signal { return this._onIndexChanged; }

    private _onSequenceEntered				:Signal				= new Signal();
    get onSequenceEntered ():Signal { return this._onSequenceEntered; }


    constructor (pSequence:number[])
    {
        this._sequence = pSequence;

        $(window).bind("keydown", this.keyDownHandler);
    }

    keyDownHandler = (pEvent:JQueryEventObject):void =>
    {
        let oldIndex = this._currentIndex;

        this._currentIndex = (
            pEvent.keyCode == this._sequence[this._currentIndex]
                ? this._currentIndex + 1
                : 0
        );

        if (oldIndex != this._currentIndex)
        {
            this._onIndexChanged.dispatch();
        }

        if (this._currentIndex == this._sequence.length)
        {
            this._onSequenceEntered.dispatch();

            this._currentIndex = 0;
        }
    };

    dispose ():void
    {
        $(window).unbind("keydown", this.keyDownHandler);

        super.dispose();
    }
}