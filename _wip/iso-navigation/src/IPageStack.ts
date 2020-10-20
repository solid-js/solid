import {IPage} from "./IPage";

export interface IPageStack
{
    /**
     * Current loaded page name. Can be null.
     */
    readonly currentPageName		:string;

    /**
     * Current displayed page. Can be null.
     */
    readonly currentPage			:IPage;

    /**
     * If we are in transition state.
     */
    readonly isInTransition			:boolean;

    /**
     * Show a page.
     * @param pPageName Name of the page to identify it and detect changes.
     * @param pPageImporter import returning a Promise. Like so : () => import('...')
     * @param pActionName Action to call
     * @param pParams Action parameters
     */
    showPage (pPageName:string, pPageImporter:() => Promise<any>, pActionName:string, pParams:{[index:string]:any});
}