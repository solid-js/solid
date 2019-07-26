

export module ObjectUtils
{
    /**
     * Merge two objects inside a new object.
     * B will override A.
     * New instance will be created and returned.
     * @param pA First object to inject
     * @param pB Second object to inject (will override A)
     * @param pCheckOwnProperties If true, only owned properties will be injected
     * @returns {Object} New instance will A and B properties injected.
     */
    export function merge (pA:Object, pB:Object, pCheckOwnProperties = true):Object
    {
        // New instance
        const result = {};

        // Browse A
        for (let varName in pA)
        {
            // Check if this is an owned property
            if (pCheckOwnProperties && !pB.hasOwnProperty(varName)) continue;

            // Inject into new instance
            result[varName] = pA[varName];
        }

        // Browse B
        for (let varName in pB)
        {
            // Check if this is an owned property
            if (pCheckOwnProperties && !pB.hasOwnProperty(varName)) continue;

            // Inject into new instance
            result[varName] = pB[varName];
        }

        // Return new instance
        return result;
    }

    /**
     * Will inject B properties inside A reference object.
     * No new instance will be created, A will be returned
     * @param pA Will receive properties from B
     * @param pB Each properties will be injected in A
     * @param pCheckOwnProperties If true, only owned properties will be injected
     * @returns {Object} Reference of A
     */
    export function inject (pA:Object, pB:Object, pCheckOwnProperties = true):Object
    {
        // Browse B object
        for (let varName in pB)
        {
            // Check if this is an owned property
            if (pCheckOwnProperties && !pB.hasOwnProperty(varName)) continue;

            // Inject into A
            pA[varName] = pB[varName];
        }

        // Return A instance
        return pA;
    }
}