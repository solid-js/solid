import {Disposable} from "../core/Disposable";
import {ArrayUtils} from "../utils/ArrayUtils";

// FIXME : Refaire cette classe, trop de trucs déconne ....
// Faire une API IN / OUT screen avec la direction
// Le delegate IScrollInputDelegate qui n'a qu'un handler ne sert à RIEN !
// Faire en sorte qu'on puisse ajouter plusieurs objets sans que ça écrase (pas de dico mais bien un système de clé, envoyée au handler pour la suppression)
//		Ou alors des signaux ?
// Rendre l'API plus claire et plus complète
// De manière générale se déssolidariser de jQuery, passer des éléments DOM en paramètre est mieux

// TODO : Finir doc

// TODO : Proposer une API qui permet de récupérer le ratio d'un élément sur la page, sans se faire chier à calculer les positions.
// TODO : Par exemple : registerElementForRangeTrigger($pElement, handler, EventType, topRatio, bottomRatio)
// TODO : Le top ratio est le ratio en partant du haut de l'écran, et le bottom ratio en partant du bas


/**
 * Delegate for scroll events
 */
export interface IScrollInputDelegate
{
    inputScrolling (pScrollTop:number, pScrollBottom?:number, pRatio?:number, pContentHeight?:number, pContainerHeight?:number);
}

/**
 * Event types for triggers
 */
export enum ScrollInputEventType
{
    /**
     * When range or element enters trigger point
     */
    ENTER = 1,

    /**
     * When range or element leaves trigger point
     */
    LEAVE = 2,

    /**
     * When range or element is scrolling through trigger point
     */
    SCROLLING = 4,

    AFTER = 8
}

/**
 * Trigger states, inside or outisde trigger zone
 */
enum TriggerStates
{
    /**
     * We are inside trigger zone
     */
    IN,

    /**
     * We are outside trigger zone
     */
    OUT
}

/**
 * Element storing everything we need to detect triggers
 */
interface ITriggerNode
{
    /**
     * Associated jquery target (optional for range and points triggers)
     */
    target		:JQuery,

    /**
     * Current state of the trigger (IN or OUT the trigger zone)
     */
    state		:TriggerStates,

    /**
     * The range of the trigger, can be feeded from target. Can only contains too values, to and bottom.
     */
    range		:number[],

    /**
     * Ratio of the trigger, 0 is on top of the screen, 1 is on bottom
     */
    ratio		:number,

    /**
     *
     */
    eventTypes	:ScrollInputEventType,
    handler		:IScrollInputEventHandler
}

/**
 * Interface for the trigger handler
 */
export type IScrollInputEventHandler = (pTarget:JQuery|number[], pType:ScrollInputEventType, pValue?:number) => void;


/**
 * Dispatcher class
 */
export class ScrollDispatcher extends Disposable
{
    // ------------------------------------------------------------------------- STATICS



    // ------------------------------------------------------------------------- LOCALS

    /**
     * Associated delegate
     */
    protected _delegate						:IScrollInputDelegate;

    /**
     * List of triggers
     */
    protected _triggers						:ITriggerNode[]					= [];

    /**
     * Current ratio for the scroll position (0 top, 1 bottom)
     */
    protected _currentScrollRatio				:number = 0;
    get currentScrollRatio ():number { return this._currentScrollRatio; }

    /**
     * Current scroll position for the top of the screen
     */
    protected _currentTopScrollPosition		:number = 0;
    get currentBottomScrollPosition ():number { return this._currentBottomScrollPosition; }

    /**
     * Current scroll position for the bottom of the screen (top + screen height)
     */
    protected _currentBottomScrollPosition	:number = 0;
    get currentTopScrollPosition ():number { return this._currentTopScrollPosition; }


    // ------------------------------------------------------------------------- DOM

    // Watched target for scroll
    $target									:JQuery;

    // Parent container of target
    $parent									:JQuery;

    // DOM Element for scroll position and event listening
    $listener								:JQuery;

    // ------------------------------------------------------------------------- INIT


    constructor (pDelegate:IScrollInputDelegate, $pTarget:JQuery = $(document))
    {
        // Relay
        super();

        // Check delegate parameter validity
        if (pDelegate == null) throw new Error('ScrollInput.ScrollDispatcher // Delegate can\'t be null.');

        // Check target parameter validity
        if ($pTarget == null || $pTarget.length != 1) throw new Error('ScrollInput.ScrollDispatcher // $pTarget can\'t be null and have to target only one DOM element.');

        // Store delegate and target
        this._delegate = pDelegate;
        this.$target = $pTarget;

        // Special case if we have to listen document
        if ( $pTarget.is( $(document) ) )
        {
            // Parent is window
            this.$parent = $(window);

            // But event listening and scroll position are on document
            this.$listener = $pTarget;
        }
        else
        {
            // With deep DOM Elements, the parent holds the scroll position and event listening.
            this.$parent = $pTarget.parent();
            this.$listener = this.$parent;
        }

        // Init listening now we have
        this.initListening();
    }

    /**
     * Init scroll listening on target
     */
    protected initListening ():void
    {
        // Listen scroll
        this.$listener.bind('scroll', this.scrolledHandler);

        // And resize !
        $(window).bind('resize', this.scrolledHandler);

        // Dispatch first scroll when DOM is ready
        $(() => this.scrolledHandler());
    }


    // ------------------------------------------------------------------------- HANDLERS

    protected scrolledHandler = (pEvent ?: any):void =>
    {
        // Update scroll position for delegate
        this.updateCurrentScrollPosition();

        // Update triggers
        this.checkTargetsTriggering();
    };


    public updateScrollPosition ()
    {
        this.scrolledHandler();
    }


    // ------------------------------------------------------------------------- UPDATE

    // TODO : Direction du scroll passé au delegate

    protected updateCurrentScrollPosition ():void
    {
        // Get top scroll value
        this._currentTopScrollPosition = this.$listener.scrollTop();

        // Get heights
        var contentHeight = this.$target.height();
        var parentHeight = this.$parent.height();

        // Get bottom scroll value
        this._currentBottomScrollPosition = this._currentTopScrollPosition + parentHeight;

        // Compute scrolling ratio from top 0 to bottom 1
        this._currentScrollRatio = this._currentTopScrollPosition / (contentHeight - parentHeight);

        // Call delegate
        this._delegate.inputScrolling(this._currentTopScrollPosition, this._currentBottomScrollPosition, this._currentScrollRatio, contentHeight, parentHeight);
    }

    /**
     * Check every triggers for new scroll position
     */
    protected checkTargetsTriggering ():void
    {
        // Copy reference to triggers array so we can remove trigger from delegate
        var triggers = this._triggers;

        // Browse triggers
        var total = triggers.length;
        for (var i = 0; i < total; i ++)
        {
            this.checkTargetTriggering(triggers[i]);
        }
    }

    protected checkTargetTriggering (pTrigger:ITriggerNode)
    {
        // Compute trigger position from ratio
        var triggerPosition = this._currentTopScrollPosition + (this._currentBottomScrollPosition - this._currentTopScrollPosition) * pTrigger.ratio;

        // Select target for handler (ratio or element)
        var targetForHandler:JQuery|number[] = (pTrigger.target == null ? pTrigger.range : pTrigger.target);

        // If our element just go out of range
        var justGotOut = false;

        var isPosition = (
            pTrigger.range.length == 1
            ||
            ((pTrigger.eventTypes & ScrollInputEventType.AFTER) > 0)
        );

        // ----- CHECK TRIGGER ENTERING

        if
        (
            isPosition
                ? (
                    triggerPosition >= pTrigger.range[0]
                )
                : (
                    triggerPosition >= pTrigger.range[0]
                    &&
                    triggerPosition <= pTrigger.range[1]
                )
        )
        {
            // Only changing state
            if (pTrigger.state == TriggerStates.OUT)
            {
                // Store new state
                pTrigger.state = TriggerStates.IN;

                // If handler is valid and required
                if
                (
                    pTrigger.handler != null
                    &&
                    (
                        (pTrigger.eventTypes & ScrollInputEventType.ENTER) > 0
                        ||
                        (pTrigger.eventTypes & ScrollInputEventType.AFTER) > 0
                    )
                )
                {
                    pTrigger.handler(targetForHandler, ScrollInputEventType.ENTER);
                }
            }
        }

        // ----- CHECK TRIGGER LEAVING

        // Only changing state
        else if (pTrigger.state == TriggerStates.IN)
        {
            // Store new state
            pTrigger.state = TriggerStates.OUT;

            // We just got out from the range. On more cycle to dispatch scrolling.
            justGotOut = true;

            // If handler is valid and required
            if (
                pTrigger.handler != null
                &&
                (pTrigger.eventTypes & ScrollInputEventType.LEAVE) > 0
            )
            {
                pTrigger.handler(targetForHandler, ScrollInputEventType.LEAVE);
            }
        }

        // ----- CHECK TRIGGER SCROLLING

        // If handler is valid and required
        if (
            // Check if this is the first cycle we go out, to dispatch the limited value
            (pTrigger.state == TriggerStates.IN || justGotOut)
            &&
            (pTrigger.eventTypes & ScrollInputEventType.SCROLLING) > 0
        )
        {
            // Compute ratio
            var ratio = (
                (triggerPosition - pTrigger.range[0])
                /
                (pTrigger.range[1] - pTrigger.range[0])
            );

            // Limit it
            ratio = Math.max(0, Math.min(ratio, 1));

            // Call handler with ratio
            pTrigger.handler(targetForHandler, ScrollInputEventType.SCROLLING, ratio);
        }
    }


    // -------------------------------------------------------------------------

    public addPositionTarget (pPosition:number, pHandler:IScrollInputEventHandler, pEventTypes:ScrollInputEventType, pTriggerRatio:number = .5):void
    {
        //
        var trigger:ITriggerNode = {
            target: null,
            state: TriggerStates.OUT,
            range: [pPosition],
            ratio: pTriggerRatio,
            eventTypes: pEventTypes,
            handler: pHandler
        };
        this._triggers.push(trigger);

        this.checkTargetTriggering(trigger);
    }

    /**
     *
     * @param $pTarget
     * @param pHandler
     * @param pEventTypes
     * @param pTriggerRatio
     */
    public addElementTrigger ($pTarget:JQuery, pHandler:IScrollInputEventHandler, pEventTypes:ScrollInputEventType, pTriggerRatio:number = .5):void
    {
        // Check parameters
        if ($pTarget == null || $pTarget.length != 1) throw new Error('ScrollInput.ScrollDispatcher.addElementTrigger // $pTarget must target only on DOM element.');

        var trigger:ITriggerNode = {
            target: $pTarget,
            state: TriggerStates.OUT,
            range: this.getTargetBoundaries($pTarget),
            ratio: pTriggerRatio,
            eventTypes: pEventTypes,
            handler: pHandler
        };

        // Register trigger
        this._triggers.push(trigger);


        this.checkTargetTriggering(trigger);
    }

    /**
     *
     * @param pRange
     * @param pHandler
     * @param pEventTypes
     * @param pTriggerRatio
     */
    public addRangeTrigger (pRange:number[], pHandler:IScrollInputEventHandler, pEventTypes:ScrollInputEventType, pTriggerRatio:number = .5):void
    {
        // Check parameters
        if (pRange == null || pRange.length != 2) throw new Error('ScrollInput.ScrollDispatcher.addRangeTrigger // pRange must contains to numbers (start and end positions).');

        //
        var trigger:ITriggerNode = {
            target: null,
            state: TriggerStates.OUT,
            range: pRange,
            ratio: pTriggerRatio,
            eventTypes: pEventTypes,
            handler: pHandler
        };
        this._triggers.push(trigger);

        this.checkTargetTriggering(trigger);
    }

    /**
     * Removed element trigger by jQuery selector
     * @param $pTarget JQuery selector targeting element to remove
     * @returns {number} Total removed elements
     */
    public removeElementTrigger ($pTarget:JQuery):number
    {
        return this.removeTrigger($pTarget, null);
    }

    public removeRangeTrigger (pRange:number[]):number
    {
        return this.removeTrigger(null, pRange);
    }


    protected removeTrigger ($pElement:JQuery, pRange:number[])
    {
        // New triggers array
        var newTriggers = [];

        // Count removed triggers
        var totalRemovedTriggers = 0;

        // Browse triggers
        var total = this._triggers.length;
        var currentTriggerNode:ITriggerNode;
        for (var i = 0; i < total; i ++)
        {
            // Target node
            currentTriggerNode = this._triggers[i];

            if ($pElement != null)
            {
                // If this target have not to be removed
                if (!$pElement.is(currentTriggerNode.target))
                {
                    // Add to new array
                    newTriggers.push(currentTriggerNode);
                }
                else
                {
                    // Count removed elements
                    totalRemovedTriggers ++;
                }
            }
            else
            {
                // If this target have not to be removed
                if (
                    // Check first position
                    currentTriggerNode.range[0] != pRange[0]
                    &&
                    (
                        // Ok if we only have one position
                        currentTriggerNode.range.length == 1
                        ||
                        // Else check second position
                        currentTriggerNode.range[1] != pRange[1]
                    )
                )
                {
                    // Add to new array
                    newTriggers.push(currentTriggerNode);
                }
                else
                {
                    // Count removed elements
                    totalRemovedTriggers ++;
                }
            }
        }

        // Registrer new triggers list
        this._triggers = newTriggers;

        // Return total removed elements
        return totalRemovedTriggers;
    }

    /**
     * Update boundaries of registered jQuery elements.
     */
    public updateElementsTriggerBoundaries ():void
    {
        // Browse triggers
        var total = this._triggers.length;
        var currentTriggerNode:ITriggerNode;
        for (var i = 0; i < total; i ++)
        {
            // Target trigger node
            currentTriggerNode = this._triggers[i];

            // If this node is targeting a jQuery element
            if (currentTriggerNode.target != null)
            {
                // Update boundaries of this element
                currentTriggerNode.range = this.getTargetBoundaries(currentTriggerNode.target);
            }
        }
    }

    /**
     * Get vertical boundaries of a jQuery object.
     * Will not check of it contains one and only one DOM element (it have to BTW).
     * @param $pTarget JQuery element giving boundaries
     * @returns {number[]} Boundaries as an array of length 2
     */
    protected getTargetBoundaries ($pTarget:JQuery):number[]
    {
        // TODO : Gérer l'offset de l'élément scrollé au cas où ça n'est pas document
        // TODO : Car offset ne gère que par rapport au document (position non utilisable car ça gère qu'au premier parent)
        // TODO : En gros faut qu'on mesure l'offset par rapport à $target

        var top = $pTarget.offset().top;

        return [top, top + $pTarget.height()];
    }

    // ------------------------------------------------------------------------- DISPOSE

    /**
     * Destruction of the dispatched
     */
    dispose ()
    {
        // Unbind scroll and resize
        this.$listener.unbind('scroll', this.scrolledHandler);
        $(window).unbind('resize', this.scrolledHandler);

        // Remove references
        this.$target = null;
        this.$parent = null;

        // Relay
        super.dispose();
    }
}