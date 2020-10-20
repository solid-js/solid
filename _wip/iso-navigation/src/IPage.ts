import {IActionParameters} from "./Router";


/**
 * Allowed playIn / playOut states for IPage
 */
export enum EPagePlayState
{
    VISIBLE,
    PLAYING_IN,
    PLAYING_OUT
}


/**
 * Interface for page.
 * It can be triggered from route and managed by an IPageStack
 */
export interface IPage
{
    /**
     * Current play in / play out state of the page.
     * Use this state to disable features when animating.
     */
    readonly playState:EPagePlayState;

    /**
     * Action on this page.
     * Have to check props.action and props.params to show proper content.
     */
    action (pActionName:string, pParams:IActionParameters);

    /**
     * Play intro animation.
     * Have to return a promise when animation is ended.
     */
    playIn (...rest):Promise<any>;

    /**
     * Play outro animation.
     * Have to return a promise when animation is ended.
     */
    playOut (...rest):Promise<any>;
}