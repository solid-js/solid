// todo : SOLID doc pour les différents dégradé implémenter + throw error si pDirection pas bon

export module BitmapUtils
{
    export enum GradientTypes
    {
        LINEAR,
        RADIAL
    }

    /**
     * TODO : TRAD / DOC / REFACTO
     * Générer un bitmap dégradé
     * @param pWidth Largeur de l'image
     * @param pHeight Hauteur de l'image
     * @param pColorStops Liste des couleurs (premier index étant la position du dégradé entre 0 et 1, et en second index la couleur)
     * @param pGradientType Linear or radial gradient. Look for enum GradientTypes on module BitmapUtils.
     * @param pDirection Direction du dégradé comme suit : x0 y0 x1 y1
     * @returns Le dégradé sous forme d'élément canvas
     */
    export function generateGradient (pWidth:number, pHeight:number, pColorStops:any[][], pGradientType:GradientTypes, pDirection:number[] = [0, 0, pWidth, pHeight]):HTMLCanvasElement
    {
        // Créer le canvas aux bonnes dimensions
        var canvas = document.createElement('canvas');
        canvas.width = pWidth;
        canvas.height = pHeight;

        // Récupérer le contexte 2D
        var context = canvas.getContext('2d');

        // Dessiner sur toute la surface
        context.rect(0, 0, pWidth, pHeight);

        var gradient;

        if (pGradientType == GradientTypes.RADIAL)
        {
            pDirection[0] = pWidth / 2;
            pDirection[1] = pHeight / 2;
            pDirection[2] = Math.min(pWidth, pHeight) / 2;

            gradient = context.createRadialGradient(pDirection[0], pDirection[1], 0, pDirection[0], pDirection[1], pDirection[2]);
        }
        else if (pGradientType == GradientTypes.LINEAR)
        {
            if (pDirection.length != 4)
            {
                // todo : throw error
            }

            // Créer le dégradé linéaire
            gradient = context.createLinearGradient(pDirection[0], pDirection[1], pDirection[2], pDirection[3]);
        }
        else
        {
            // todo : throw error
        }

        // Ajouter chaque stop
        for (var i in pColorStops)
        {
            gradient.addColorStop(pColorStops[i][0], pColorStops[i][1]);
        }

        // Dessiner
        context.fillStyle = gradient;
        context.fill();

        // Retourner le canvas
        return canvas;
    }

    // TODO : DOC + REFACTO

    export function generateText (text:string, width:number, height:number, font:string = '12px Arial', color:string = 'black', align:CanvasTextAlign = 'left', verticalOffset:number = 1):HTMLCanvasElement
    {
        // Créer le canvas aux bonnes dimensions
        var canvas = document.createElement('canvas');

        // Définir la taille
        canvas.width = width;
        canvas.height = height;

        // Récupérer le contexte 2D
        var context = canvas.getContext('2d');

        // Configurer le texte
        context.font = font;
        context.textBaseline = "top";
        context.fillStyle = color;
        context.textAlign = align;

        var horizontalOffset = 1;

        if (align.toLowerCase() == "center")
        {
            horizontalOffset = width / 2;
        }

        // Ecrire le texte
        context.fillText(text, horizontalOffset, verticalOffset);

        // Retourner le canvas
        return canvas;
    }

    /**
     * Create canvas from multiline text.
     * Height will be auto from fixed width.
     * Width and height will be defined on canvas object.
     * @param text text to print on canvas
     * @param maxWidth max-width in pixel of the text. If the text overlaps this width, it warps.
     * @param lineHeight distance between the lines, in pixel.
     * @param font size and font name of the text
     * @param color color of the text
     * @param align alignement of the text left/center/right
     * @param padding Padding arround text to avoid bleeding
     * @returns {HTMLCanvasElement}
     */
    export function generateMultilineText (text:string, maxWidth:number, lineHeight:number, font:string = '12px Arial', color:string = 'black', align:CanvasTextAlign = 'left', padding = 2):HTMLCanvasElement
    {
        // Create canvas and get 2D context
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        // Configure text drawing
        context.font = font;
        context.textBaseline = "top";
        context.fillStyle = color;
        context.textAlign = align;

        // Split text in words to get auto line breaks
        let words = text.split(' ');
        let currentLine = '';
        let lines = [];

        // Get final height of the canvas
        let y = padding;
        for (let n = 0; n < words.length; n++)
        {
            // Add a word at end of line
            let testLine = currentLine + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;

            // If we get too much width
            if (testWidth > (maxWidth - (padding * 2)) && n > 0)
            {
                // Register line for drawing
                lines.push(currentLine);

                // Reset next line and add last word to next line
                currentLine = words[n] + ' ';

                // Break line
                y += lineHeight;
            }

            // Still not filling all current line
            else
            {
                // Test next word on same line
                currentLine = testLine;
            }
        }

        // Register last line for drawing
        lines.push(currentLine);

        // Set canvas size before re-setting context options
        canvas.width = maxWidth;
        canvas.height = y + padding + lineHeight;

        // Configure text drawing options now our canvas is resized
        context.font = font;
        context.textBaseline = "top";
        context.fillStyle = color;
        context.textAlign = align;

        // Set offset in order to match the alignement rule
        const offset = (
            align == "center"
                ? canvas.width / 2
                : padding
        );

        // Draw lines on canvas
        y = padding;
        for (let n = 0; n < lines.length; n++)
        {
            context.fillText(lines[n], offset, (n * lineHeight));
        }

        // Return filled canvas
        return canvas;
    }

    /**
     * TODO : TRAD
     * Fit une image dans un canvas à la manière d'un background-cover centré.
     * Version modifié du code trouvé ici : https://sdqali.in/blog/2013/10/03/fitting-an-image-in-to-a-canvas-object/
     * @param image L'objet Image à dessiner sur le canvas
     * @param canvasWidth La largeur du canvas (cadre) généré
     * @param canvasHeight La hauteur du canvas (cadre) généré
     * @param fitMethod "cover" pour laisser dépasser l'image du cadre, "contain" pour ajouter des bordures
     * @param backgroundColor La couleur de fond, "transparent" par défaut.
     */
    export function generateFitCanvasTexture (image:HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap, canvasWidth:number, canvasHeight:number, fitMethod = 'cover', backgroundColor = 'transparent')
    {
        // On crée un nouveau canvas et on récupère son contexte
        const canvas = document.createElement('canvas') as HTMLCanvasElement;
        const context = canvas.getContext('2d');

        // On set le canvas avec la taille donnée en paramètre
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // On détermine les ratios du canvas et de l'image
        const imageAspectRatio = image.width / image.height;
        const canvasAspectRatio = canvas.width / canvas.height;

        // point de départ de la zone a dessiner sur le canvas
        let xStart = 0;
        let yStart = 0;

        // dimensions de la zone à dessiner sur le canvas
        let renderableWidth = canvas.width;
        let renderableHeight = canvas.height;

        /**
         * Deux cas de figure : cover / contain. Dans les deux cas, on compare le ratio de l'image au ratio du canvas.
         * cover : si le ratio de l'image est plus grand que le canvas, on fit à la hauteur et on centre en largeur, sinon, l'inverse.
         * contain : si le ratio de l'image est moins grand que le canvas, on on fit à la hauteur et on centre en largeur, sinon l'inverse
         */
        if ( fitMethod == 'cover' )
        {
            if ( imageAspectRatio > canvasAspectRatio )
            {
                renderableHeight = canvas.height;
                renderableWidth = image.width * (renderableHeight / image.height);
                xStart = (canvas.width - renderableWidth) / 2;
                yStart = 0;
            }
            else if ( imageAspectRatio < canvasAspectRatio )
            {
                renderableWidth = canvas.width;
                renderableHeight = image.height * (renderableWidth / image.width);
                xStart = 0;
                yStart = (canvas.height - renderableHeight) / 2;
            }
        }
        else if ( fitMethod == 'contain' )
        {
            if ( imageAspectRatio < canvasAspectRatio )
            {
                renderableHeight = canvas.height;
                renderableWidth = image.width * (renderableHeight / image.height);
                xStart = (canvas.width - renderableWidth) / 2;
                yStart = 0;
            }
            else if ( imageAspectRatio > canvasAspectRatio )
            {
                renderableWidth = canvas.width;
                renderableHeight = image.height * (renderableWidth / image.width);
                xStart = 0;
                yStart = (canvas.height - renderableHeight) / 2;
            }
        }

        // On rempli avec la couleur de fond
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // On dessine l'image et on retourne le canvas
        context.drawImage(image, xStart, yStart, renderableWidth, renderableHeight);
        return canvas;
    }
}
