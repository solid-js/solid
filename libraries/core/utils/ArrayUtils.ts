export module ArrayUtils
{
    // TODO : Altération d'un array via clone + méthode de filtre
    // TODO : Intérêt vis à vis de filter ?
    export function alter ()
    {

    }


    /**
     * TODO : KEEP ?
     * Delete elements from an array following a condition.
     * Will return a new Array reference to re-affect.
     * @param array Array to remove from
     * @param where Condition to satisfy to remove.
     * @returns {Array} New array reference to re-affect.
     */
    export function deleteWhere (array:any[], where:{}):any[]
    {
        const newArray = [];

        // Browse array
        for ( let i in array )
        {
            // Browse conditions
            for ( let j in where )
            {
                // Check if this object is ok with condition
                if (!(j in array[i]) || where[j] != array[i][j])
                {
                    newArray.push(array[i]);
                    break;
                }
            }
        }

        // Return filtered array
        return newArray;
    }

    /**
     * Remove an element from an array.
     * Will return a new Array reference to re-affect.
     * @param array Array to search from
     * @param element Element to remove
     * @returns {Array} New array reference to re-affect.
     */
    export function removeElement <GType extends any> (array:GType[], element:GType)
    {
        const newArray = [];
        for ( let i in array )
        {
            if ( array[i] == element ) continue;
            newArray.push( array[i] );
        }
        return newArray;
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

    /**
     * Will count from a number to another by adding one at each loop.
     * Makes a 'for' loop with a function call.
     * Usefull with JSX
     * @see ArrayUtils.countWith
     * @param pFrom From which number to start counting
     * @param pTo To which number to end counting
     * @param pHandler Called at each iteration. Index is passed as first argument.
     * @returns {any[]}
     */
    export function countFrom (pFrom:number = 0, pTo:number, pHandler:(pIndex:number) => any):any[]
    {
        return this.countWith(pFrom, pTo, 1, pHandler);
    }

    /**
     * Will count from 0 to a number.
     * Makes a 'for' loop with a function call.
     * Usefull with JSX
     * @see ArrayUtils.countWith
     * @param pTo To which number to end counting
     * @param pHandler Called at each iteration. Index is passed as first argument.
     * @returns {any[]}
     */
    export function countTo (pTo:number, pHandler:(pIndex:number) => any):any[]
    {
        return this.countWith(0, pTo, 1, pHandler);
    }

    /**
     * Makes a 'for' loop with a function call.
     * Usefull with JSX
     *
     * This is like doing :
     * for (let i = pFrom; i < pTo; i += pWith) pHandler( i );
     *
     * Will return an array with all executed handler results.
     *
     * @param pFrom From which number to start counting
     * @param pTo To which number to end counting
     * @param pWith With which number are we counting ? Increment
     * @param pHandler Called at each iteration. Index is passed as first argument.
     * @returns {any[]}
     */
    export function countWith (pFrom:number, pTo:number, pWith:number, pHandler:(pIndex:number) => any):any[]
    {
        // Make the loop
        let results:any[] = [];
        for (let i = pFrom; i < pTo; i += pWith)
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
