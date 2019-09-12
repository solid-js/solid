export module ArrayUtils
{
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

    /**
     * Will count from a number to another by adding one at each loop.
     * Makes a 'for' loop with a function call.
     * Useful with JSX
     * @see ArrayUtils.countStep
     * @param pFrom From which number to start counting
     * @param pTo To which number to end counting
     * @param pHandler Called at each iteration. Index is passed as first argument.
     */
    export function countFrom (pFrom:number = 0, pTo:number, pHandler:(pIndex:number) => any):any[]
    {
        return this.countStep(pFrom, pTo, 1, pHandler);
    }

    /**
     * Will count from 0 to a number.
     * Makes a 'for' loop with a function call.
     * Useful with JSX
     * @see ArrayUtils.countStep
     * @param pTo To which number to end counting
     * @param pHandler Called at each iteration. Index is passed as first argument.
     */
    export function countTo (pTo:number, pHandler:(pIndex:number) => any):any[]
    {
        return this.countStep(0, pTo, 1, pHandler);
    }

    /**
     * Makes a 'for' loop with a function call.
     * Useful with JSX
     *
     * This is like doing :
     * for (let i = pFrom; i < pTo; i += pStep) pHandler( i );
     *
     * Will return an array with all executed handler results.
     *
     * @param pFrom From which number to start counting
     * @param pTo To which number to end counting
     * @param pStep With which number are we counting ? Increment
     * @param pHandler Called at each iteration. Index is passed as first argument.
     */
    export function countStep (pFrom:number, pTo:number, pStep:number, pHandler:(pIndex:number) => any):any[]
    {
        // Make the loop
        let results:any[] = [];
        for (let i = pFrom; i < pTo; i += pStep)
        {
            // Call handler and store result
            results.push( pHandler( i ) );
        }

        // Return results
        return results;
    }

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
}
