export module ColorUtils
{
    /**
     * Convert component 0-1 to 00-FF hex
     * @param component Component from 0 to 1
     * @returns {string} Hex from 00 to FF
     */
    export function componentToHex (component)
    {
        // Convert to hex
        let hex = component.toString(16);

        // Prepend with 0 to be always on two digits
        return ( hex.length == 1 ? '0' + hex : hex );
    }

    /**
     * Compute color between to colors
     * @param a Color A
     * @param b Color B
     * @param ratio Ratio between color A and B, from 0 is A to 1 is B
     * @returns {Color} Color RGB Object
     */
    export function between (a:Color, b:Color, ratio)
    {
        // Create color
        const newColor = new Color();

        // Parse color components
        ['r', 'g', 'b'].map( component =>
        {
            // Compute ratio for each color component
            newColor[ component ] = Math.round( a[component] + (b[component] - a[component]) * ratio );
        });

        // Return new color
        return newColor;
    }

    /**
     * RGB Color object
     */
    export class Color
    {
        // --------------------------------------------------------------------- STATIC

        /**
         * Create color object from hexadecimal string
         * @param hex Hexadecimal string as #FFFFFF or FFFFFF
         */
        static fromHexString ( hex:string ):Color
        {
            let c = new Color();
            c.fromHexString( hex );
            return c;
        }

        /**
         * Create color object from hexadecimal number
         * @param hex Hexadecimal number as 0xFFFFFF
         */
        static fromHexNumber ( hex:number ):Color
        {
            let c = new Color();
            c.fromHexNumber( hex );
            return c;
        }

        // --------------------------------------------------------------------- PROPERTIES

        /**
         * Red component from 0 to 1
         */
        r:number;

        /**
         * Green component from 0 to 1
         */
        g:number;

        /**
         * Blue component from 0 to 1
         */
        b:number;

        /**
         * Constructor of a color
         * @param r Red component from 0 to 1
         * @param g Green component from 0 to 1
         * @param b Blue component from 0 to 1
         */
        constructor ( r = 0, g = 0, b = 0 )
        {
            this.r = r;
            this.g = g;
            this.b = b;
        }

        // --------------------------------------------------------------------- FROM

        /**
         * Feed values from hexadecimal string
         * @param hex Hexadecimal string as #FFFFFF or FFFFFF
         */
        fromHexString ( hex:string )
        {
            // Parse hexadecimal with or without hash
            const match = hex.replace(/#/,'').match(/.{1,2}/g);

            // Extract values and feed color object
            this.r = parseInt(match[0], 16);
            this.g = parseInt(match[1], 16);
            this.b = parseInt(match[2], 16);
        }

        /**
         * Feed values from hexadecimal number
         * @param hex Hexadecimal number as 0xFFFFFF
         */
        fromHexNumber ( hex:number)
        {
            this.fromHexString( hex.toString(16) );
        }

        // --------------------------------------------------------------------- TO / AS

        /**
         * Convert as hexadecimal value, with or without hash :
         * #FFFFFF
         * @param withHash Prepend with # or not
         * @returns {string}
         */
        asHex ( withHash = true ):string
        {
            return (
                withHash ? '#' : ''
                + ColorUtils.componentToHex( this.r )
                + ColorUtils.componentToHex( this.g )
                + ColorUtils.componentToHex( this.b )
            );
        }

        /**
         * Convert as css color : rgb(255, 255, 255)
         * @returns {string}
         */
        asCss ():string
        {
            return `rgb(${this.r}, ${this.g}, ${this.b})`;
        }
    }
}

