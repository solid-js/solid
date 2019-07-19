import {Disposable} from '../core/Disposable';
import {TimerUtils} from '../utils/TimerUtils';
import {ArrayUtils} from '../utils/ArrayUtils';

/**
 * Delegate interface to handle touch dragging events
 */
export interface ITouchInputDelegate
{
    inputTap (pTouchPoint:TouchPoint):void;
    inputDragLock (pTouchPoint:TouchPoint):void;
    inputDragUnlock (pTouchPoint:TouchPoint, pDirection:EInputDirection):void;
    inputDragging (pTouchPoint:TouchPoint, pDirection:EInputDirection):void;
}

/**
 * Enumerating available directions for a drag
 */
export enum EInputDirection
{
    HORIZONTAL,
    VERTICAL,
    UNKNOWN
}

/**
 * Allowed type of input
 */
export enum EInputTypes
{
    TOUCH = 1,
    MOUSE = 2
}

/**
 * Normalized point (not original event)
 */
export interface TouchPoint
{
    // Identifying our touch
    id				:number;

    // Input type, mouse or touch
    inputType		:EInputTypes;

    // The target used
    target			:HTMLElement;

    // Event creating this touch point
    originalEvent	:UIEvent;

    // Position
    x				:number;
    y				:number;

    // Delta between current and previous frame
    deltaX			:number;
    deltaY			:number;

    // Velocity from deltas
    velocityX		:number;
    velocityY		:number;
}

/**
 * Fake touch event to convert mouse to touch
 */
interface FakeTouch
{
    identifier	:number;
    inputType	:EInputTypes;
    clientX		:number;
    clientY		:number;
}

/**
 * Dispatcher class.
 * Will provide touch dragging handlers on a specific delegate.
 */
export class TouchDispatcher extends Disposable
{
    /**
     * Mouse id is -1 because no touch will use this id
     */
    static MOUSE_ID						:number						= -1;

    /**
     * The last move event for external preventDefault
     */
    protected _lastMoveEvent				:Event;

    /**
     * The delegate who honor handling
     */
    protected _delegate					:ITouchInputDelegate;
    get delegate ():ITouchInputDelegate { return this._delegate; }

    /**
     * DOM Element target listening events
     */
    protected _target						:HTMLElement|Element;
    get target ():HTMLElement|Element { return this._target; }

    /**
     * Allowed input types
     */
    protected _inputTypes 				:number;
    get inputTypes ():number { return this._inputTypes; }

    /**
     * Current used points
     */
    protected _points						:TouchPoint[]					= [];
    get points ():TouchPoint[] { return this._points; }

    /**
     * Current direction for the first point
     */
    protected _currentDirection			:EInputDirection				= EInputDirection.UNKNOWN;
    get currentDirection ():EInputDirection { return this._currentDirection; }

    /**
     * If the event catching is enabled
     */
    protected _enabled					:boolean					= true;
    get enabled ():boolean { return this._enabled; }
    set enabled (pValue:boolean)
    {
        this._enabled = pValue;
    }

    /**
     * If the prenventDefault is called on move events
     */
    protected _preventMove					:boolean				= false;
    get preventMove ():boolean { return this._preventMove; }
    set preventMove (pValue:boolean)
    {
        this._preventMove = pValue;
    }

    /**
     * If the stopPropagation is called on events
     */
    protected _stopPropagation					:boolean				= false;
    get stopPropagation ():boolean { return this._stopPropagation; }
    set stopPropagation (pValue:boolean)
    {
        this._stopPropagation = pValue;
    }

    /**
     * Velocity Factor.
     * Each frame, velocity is going to delta value, divided by this number.
     */
    protected _velocityFactor					:number				= 2;
    get velocityFactor ():number { return this._velocityFactor; }
    set velocityFactor (pValue:number)
    {
        this._velocityFactor = pValue;
    }


    /**
     * Constructor
     * @param pDelegate The drag delegate. Have to implements ITouchInputDelegate
     * @param pTarget DOM Element used to listen events
     * @param pEInputTypes Allowed input types (look at the InputType enum). Can be multiple input types with the pipe | operator on enum (EInputTypes.TOUCH | EInputTypes.MOUSE) for example.
     */
    constructor (pDelegate:ITouchInputDelegate, pTarget:HTMLElement|Element, pEInputTypes:number = EInputTypes.TOUCH | EInputTypes.MOUSE)
    {
        // Relay
        super();

        // Check parameters validity
        if (pDelegate == null)
        {
            throw new Error('TouchInput.TouchDispatcher error. Delegate can\'t be null.');
        }

        if (pTarget == null)
        {
            throw new Error('TouchInput.TouchDispatcher error. pTarget can\'t be null.');
        }

        // Keep references
        this._delegate = pDelegate;
        this._target = pTarget;
        this._inputTypes = pEInputTypes;

        // Start listening
        this.initListening();
    }

    /**
     * Initialize listening on target
     */
    protected initListening ():void
    {
        // Listen touch
        this._target.addEventListener('touchstart', this.touchHandler);
        this._target.addEventListener('touchmove', this.touchHandler);
        this._target.addEventListener('touchend', this.touchHandler);

        // Listen mouse
        this._target.addEventListener('mousedown', this.mouseHandler);
        document.addEventListener('mouseup', this.mouseHandler);

        // Start frame based loop
        TimerUtils.addFrameHandler(this, this.frameHandler);
    }

    /**
     * Stop listening on target
     */
    protected removeListening ():void
    {
        // Remove touch listening
        this._target.removeEventListener('touchstart', this.touchHandler);
        this._target.removeEventListener('touchmove', this.touchHandler);
        this._target.removeEventListener('touchend', this.touchHandler);

        // Remove mouse listening
        this._target.removeEventListener('mousedown', this.mouseHandler);
        document.removeEventListener('mousemove', this.mouseHandler);
        document.removeEventListener('mouseup', this.mouseHandler);

        // Stop frame based loop
        TimerUtils.removeFrameHandler(this.frameHandler);
    }

    /**
     * Every mouse event goes here
     */
    protected mouseHandler = (pEvent:MouseEvent):void =>
    {
        // Check enable and mouse input
        if (!this._enabled || !(this._inputTypes & EInputTypes.MOUSE)) return;

        // Init mouse move listening on whole document
        // To be able to track mouse move when cursor is out of target
        if (pEvent.type == 'mousedown')
        {
            document.addEventListener('mousemove', this.mouseHandler)
        }
        else if (pEvent.type == 'mouseup')
        {
            document.removeEventListener('mousemove', this.mouseHandler)
        }

        // If this is a move, check if we have the mouse point registered
        else if (pEvent.type == 'mousemove')
        {
            let hasMouseInput = false;

            for (let i = 0; i < this._points.length; i ++)
            {
                if (this._points[i].id == TouchDispatcher.MOUSE_ID)
                {
                    hasMouseInput = true;
                    break;
                }
            }

            if (!hasMouseInput) return;
        }

        // Process this mouse as a touch by creating a false touch input object
        this.processTouchEvent(pEvent, {
            identifier: -1,
            inputType: TouchDispatcher.MOUSE_ID,
            clientX: pEvent.clientX,
            clientY: pEvent.clientY
        });

        // Stop propagation if needed
        if (this._stopPropagation)
        {
            pEvent.stopPropagation();
        }
    };

    /**
     * Every touch event goes here.
     * Used to dispath events by touch point entries.
     */
    protected touchHandler = (pEvent:TouchEvent):void =>
    {
        // Check enable and touch input
        if (!this._enabled || !(this._inputTypes & EInputTypes.TOUCH)) return;

        // Get the original points
        let originalPoints = pEvent.changedTouches;

        // Browse our points
        for (let i = 0; i < originalPoints.length; i ++)
        {
            this.processTouchEvent(pEvent, originalPoints[i]);
        }
    };

    /**
     * Process an event on a touch point entry
     */
    protected processTouchEvent (pEvent:UIEvent, pOriginalPoint:Touch|FakeTouch):void
    {
        // Current point
        let currentPoint:TouchPoint;

        // Stop propagation if needed
        if (this._stopPropagation)
        {
            pEvent.stopPropagation();
        }

        // -- START
        if (pEvent.type == 'touchstart' || pEvent.type == 'mousedown')
        {
            // Convert the point to a normalized one
            this._points.push({
                id				: pOriginalPoint.identifier,
                originalEvent	: pEvent,
                inputType		: (
                    ('inputType' in pOriginalPoint)
                        ? (pOriginalPoint as FakeTouch).inputType
                        : EInputTypes.TOUCH
                ),
                target			: (pEvent.target as HTMLElement),
                x				: pOriginalPoint.clientX,
                y				: pOriginalPoint.clientY,
                deltaX			: 0,
                deltaY			: 0,
                velocityX		: 0,
                velocityY		: 0
            });

            // If this is our first point
            if (this._points.length == 1)
            {
                // We don't have direction yet
                this._currentDirection = EInputDirection.UNKNOWN;

                // Notify the delegate
                this._delegate.inputDragLock( this._points[0] );
            }
        }

        // -- MOVE
        else if (pEvent.type == 'touchmove' || pEvent.type == 'mousemove')
        {
            // Record this event for external preventDefault
            this._lastMoveEvent = pEvent;

            // Prevent default on move if needed
            if (this._preventMove)
            {
                pEvent.preventDefault();
            }

            // Browse our current normalized points
            for (let i in this._points)
            {
                // Target this point
                currentPoint = this._points[i];

                // If ID matches
                if (currentPoint.id == pOriginalPoint.identifier)
                {
                    // Compute velocity
                    currentPoint.deltaX += currentPoint.x - pOriginalPoint.clientX;
                    currentPoint.deltaY += currentPoint.y - pOriginalPoint.clientY;

                    // Register new position
                    currentPoint.x = pOriginalPoint.clientX;
                    currentPoint.y = pOriginalPoint.clientY;

                    // If we don't have direction yet
                    if (this._currentDirection == EInputDirection.UNKNOWN)
                    {
                        // Compute direciton from velocity
                        if (Math.abs(currentPoint.deltaX) > Math.abs(currentPoint.deltaY))
                        {
                            this._currentDirection = EInputDirection.HORIZONTAL;
                        }
                        else if (Math.abs(currentPoint.deltaY) > Math.abs(currentPoint.deltaX))
                        {
                            this._currentDirection = EInputDirection.VERTICAL;
                        }
                    }
                }
            }
        }

        // -- END
        else if (pEvent.type == 'touchend' || pEvent.type == 'mouseup')
        {
            // Cancel last event
            this._lastMoveEvent = null;

            // If this is the last point
            if (this._points.length == 1)
            {
                // Notify unlock
                this._delegate.inputDragUnlock( this._points[0], this._currentDirection );

                // If we don't have direction, this was a tap
                if (this._currentDirection == EInputDirection.UNKNOWN)
                {
                    this._delegate.inputTap( this._points[0] );
                }

                // We don't have direction anymore
                this._currentDirection = EInputDirection.UNKNOWN;
            }

            // Remove this point
            this._points = ArrayUtils.deleteWhere(this._points, {
                id: pOriginalPoint.identifier
            });
        }
    }

    /**
     * Every frames
     */
    protected frameHandler = ():void =>
    {
        // If we have only one point and a direction
        if (this._points.length == 1 && this._currentDirection != EInputDirection.UNKNOWN)
        {
            // Target the main point
            let mainPoint = this._points[0];

            // And notify on the delegate
            this._delegate.inputDragging( mainPoint, this._currentDirection );
        }

        // Cancel velocity on all points
        for (let i = 0; i < this._points.length; i ++)
        {
            // Target curret point
            let currentPoint = this._points[i];

            // Compute velocity from delta
            currentPoint.velocityX = Math.round(
                (currentPoint.velocityX - currentPoint.deltaX) / this._velocityFactor
            );
            currentPoint.velocityY = Math.round(
                (currentPoint.velocityY - currentPoint.deltaY) / this._velocityFactor
            );

            // Reset delta
            currentPoint.deltaX = 0;
            currentPoint.deltaY = 0;
        }
    };

    /**
     * Destruct
     */
    dispose ():void
    {
        // Relay
        super.dispose();

        // Stop listening
        this.removeListening();

        // Remove references
        this._target = null;
        this._delegate = null;
    }
}