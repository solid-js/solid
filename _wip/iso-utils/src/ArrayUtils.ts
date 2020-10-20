import {start} from "repl";

export interface ICountHandler
{
    (value?:number, index?:number) : any|void
}


export module ArrayUtils
{
    // ------------------------------------------------------------------------- ORGANIZE

    /**
     * Creates an array of elements split into groups the length of size.
     * If array can't be split evenly, the final chunk will be the remaining elements.
     *
     * ex:
     * ArrayUtils.chunk( [1, 2, 3, 4, 5], 2 );
     * // => [[1,2], [3,4], [5]]
     *
     * @link https://gist.github.com/webinista/11240585#gistcomment-1781756
     * @param array
     * @param groupSize
     */
    export function chunk <GType extends any> ( array:GType[], groupSize:number ):GType[]
    {
        return array.reduce( (a, b, i, g) =>
            ! (i % groupSize)
                ? a.concat([ g.slice(i, i + groupSize) ])
                : a, []
        )
    }

    /**
     * Shuffle an indexed array.
     * Source : https://bost.ocks.org/mike/shuffle/
     * @param array The indexed array to shuffle.
     * @returns Original instance of array with same elements at other indexes
     */
    export function shuffle <GType extends any> (array:GType[]):GType[]
    {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;

        // While there remain elements to shuffle...
        while ( 0 !== currentIndex )
        {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    // ------------------------------------------------------------------------- COUNT / FILL

    /**
     * Makes a 'for' loop with a function call.
     * Useful with JSX
     *
     * This is like doing :
     * for (let i = from; i < to; i += step) handler( i );
     *
     * Will return an array with all executed handler results.
     *
     * @param from From which number to start counting
     * @param to To which number to end counting
     * @param step With which number are we counting ? Increment
     * @param handler Called at each iteration. Value is passed as first argument, index as second argument.
     */
    export function countRange (from:number, to:number, step:number = 1, handler ?: ICountHandler):number[]
    {
        return Array.from(
            { length: ( to - from ) / step + 1 },
            ( x, i ) => {
                const value = from + i * step;
                handler && handler( value, i );
                return value;
            }
        );
    }

    /**
     * Will count from a number to another by adding one at each loop.
     * Makes a 'for' loop with a function call.
     * Useful with JSX
     * @see ArrayUtils.countRange
     * @param from From which number to start counting
     * @param to To which number to end counting
     * @param handler Called at each iteration. Index is passed as first argument.
     */
    export function countFrom (from:number = 0, to:number, handler?:ICountHandler):number[]
    {
        return this.countRange( from, to, 1, handler );
    }

    /**
     * Will count from 0 to a number.
     * Makes a 'for' loop with a function call.
     * Useful with JSX
     * @see ArrayUtils.countRange
     * @param to To which number to end counting
     * @param handler Called at each iteration. Index is passed as first argument.
     */
    export function countTo (to:number, handler ?: ICountHandler):number[]
    {
        return this.countRange( 0, to, 1, handler );
    }
}
