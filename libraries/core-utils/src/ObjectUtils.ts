

export module ObjectUtils
{
    /**
     * Will inject B properties inside A reference object.
     * No new instance will be created, A will be returned
     * @param objectA Will receive properties from B
     * @param objectB Each properties will be injected in A
     * @param pCheckOwnProperties If true, only owned properties will be injected
     * @returns {Object} Reference of A
     */
    export function inject (objectA:Object, objectB:Object, pCheckOwnProperties = true):Object
    {
        // Browse B object
        for (let varName in objectB)
        {
            // Check if this is an owned property
            if (pCheckOwnProperties && !objectB.hasOwnProperty(varName)) continue;

            // Inject into A
            objectA[ varName ] = objectB[ varName ];
        }

        // Return A instance
        return objectA;
    }
}