export module MathUtils
{
    // ------------------------------------------------------------------------- GEOMETRY

    /**
     * Get the angle between 3 points in radians
     * @param points An array container 3 points, each point object need to have 'x' and 'y' properties.
     * @return Angle in radians
     */
    export function angle3 (points:{x:number; y:number}[]):number
    {
        // Get 3 absolute angles
        let AB = Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2));
        let BC = Math.sqrt(Math.pow(points[1].x - points[2].x, 2) + Math.pow(points[1].y - points[2].y, 2));
        let AC = Math.sqrt(Math.pow(points[2].x - points[0].x, 2) + Math.pow(points[2].y - points[0].y, 2));

        // Compute relative angle between the 3 points
        return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    }

    /**
     * Convert radian angle to degrees
     */
    export function radToDeg (angle:number):number
    {
        return angle / Math.PI * 180;
    }

    /**
     * Convert degree angle to radians
     */
    export function degToRad (angle:number):number
    {
        return angle / 180 * Math.PI;
    }

    /**
     * Normalize an angle to be between -Math.PI and +Math.PI
     */
    export function normalizeAngle (angle:number):number
    {
        return MathUtils.positiveModulo( angle + Math.PI, Math.PI * 2 ) - Math.PI;
    }


    // ------------------------------------------------------------------------- RANGE UTILS

    /**
     * Return an offset value in a range from 0 to max.
     * For exemple :
     * 1. if currentValue is 8, max is 9 and you set an offset of 1, you'll get back to 0.
     *
     * It also works for negative offsets :
     * 2. If currentValue is 0, max is 9 and you set an offset of -1, you'll get to 8
     *
     * It works with all offsets as real numbers less than max :
     * 3. If currentValue is 3, max is 9 and you set an offset of 8, you'll get to 2
     *
     * @param currentValue
     * @param max
     * @param offset
     * @returns {number}
     */
    export function circularRange (currentValue:number, max:number, offset:number):number
    {
        return (((currentValue + offset) % max) + max) % max;
    }

    /**
     * Limit a value between a min and a max
     * @param min Can't go bellow
     * @param value Our value to limit
     * @param max Can't go above
     * @returns {number} Limited value
     */
    export function limitRange (min:number, value:number, max:number):number
    {
        return Math.max(min, Math.min(value, max));
    }


    // ------------------------------------------------------------------------- ARITHMETIC

    /**
     * Returns positive modulo, even when 'n' is negative.
     * From http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
     */
    export function positiveModulo (n:number, m:number):number
    {
        return ((n % m) + m) % m;
    }


    // ------------------------------------------------------------------------- RANDOM

    /**
     * Return a random number between min and max.
     * @param min Can't go bellow
     * @param max Can't go above
     * @param round If true, will be rounded by Math.floor.
     * @returns {number}
     */
    export function randomRange (min:number, max:number, round = false)
    {
        // Get random value between min and max
        let value = min + Math.random() * (max - min);

        // Round if needed and return
        return round ? Math.floor(value) : value;
    }

    /**
     * Return a random integer number between 0 and to, excluded.
     * Usefull to get a random element from an array.
     * @param to Maximum number, excluded.
     * @returns {number} int from 0 to to, excluded
     */
    export function randomTo (to:number):number
    {
        return Math.floor(Math.random() * to);
    }

    /**
     * Return true or false, you don't know.
     * @returns {boolean}
     */
    export function randomBool ():boolean
    {
        return Math.random() > .5;
    }

    /**
     * Pick a random item from an indexed array
     * @param source Indexed array only.
     * @returns {P} Randomly selected value.
     */
    export function randomPickFromArray <P>( source: P[] ):P
    {
        // Return randomly selected object
        return source[
            MathUtils.randomRange(0, source.length, true)
        ];
    }

    /**
     * Pick a random item from an object.
     * Will return value.
     * @param source String indexed object
     * @returns {P} Randomly selected value.
     */
    export function randomPickFromObject <P>( source: {[index:string]:P} ):P
    {
        // Get object keys
        const keys = Object.keys( source );

        // Return randomly selected object
        return source[
            // Not calling randomPickFromArray for performances
            keys[
                // Pick random key
                MathUtils.randomRange(0, keys.length, true)
            ]
        ];
    }
}